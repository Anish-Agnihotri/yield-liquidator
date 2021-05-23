import { IPosition, IPendingTransaction, IAuction } from "./common/interfaces";
import { Contract } from "@ethersproject/contracts";
import { Wallet } from "@ethersproject/wallet";
import { CONTRACT_ADDRESSES } from "./common/constants";
import { ABI_LIQUIDATIONS } from "./common/abi";
import { logger } from "./common/logging";
import { JsonRpcProvider } from "@ethersproject/providers";
import { BigNumber } from "@ethersproject/bignumber";

export default class Liquidations {
  // Ethers setup
  wallet: Wallet;
  provider: JsonRpcProvider;
  liquidations: Contract;

  // Pending transactions
  pendingTransactions: Record<string, IPendingTransaction> = {};

  constructor(provider: JsonRpcProvider, wallet: Wallet, network: string) {
    this.liquidations = new Contract(
      CONTRACT_ADDRESSES[network].liquidations,
      ABI_LIQUIDATIONS,
      wallet
    );
    this.provider = provider;
    this.wallet = wallet;
  }

  async triggerLiquidations(
    positions: Record<string, IPosition>,
    gasPrice: number
  ) {
    // For each address with a liquidatable position
    for (const position in positions) {
      // If
      if (
        // position is not collateralized
        !positions[position].collateralized &&
        // and existing tx does not exist
        !this.pendingTransactions.hasOwnProperty(position)
      ) {
        logger.warn(`Liquidator: Creating liquidation for ${position}`);

        // Create liquidation w/ gas price
        const { hash } = await this.liquidations.liquidate(position, {
          gasPrice
        });
        console.log("HASH: ", hash);

        // Update pending liquidations map
        this.pendingTransactions[position] = { hash, gasPrice };
      }
    }

    // Return new pending liquidations
    return this.pendingTransactions;
  }

  isAuctionProfitable(auction: IAuction, gasPrice: number): Boolean {
    return true;
  }

  async participateAuctions(
    auctions: Record<string, IAuction>,
    gasPrice: number
  ): Promise<Record<string, IPendingTransaction>> {
    // For each auction that can be particiated in
    for (const auction in auctions) {
      // If
      if (
        // Keeper has not already sent transaction
        !this.pendingTransactions.hasOwnProperty(auction) &&
        // And, auction is profitable
        this.isAuctionProfitable(auctions[auction], gasPrice)
      ) {
        // TODO: participate in auction
      }
    }

    // Return updated pending transactions
    return this.pendingTransactions;
  }

  async bumpOrRemove(
    gasPrice: number
  ): Promise<Record<string, IPendingTransaction>> {
    for (const tx in this.pendingTransactions) {
      const txReceipt = await this.provider.getTransactionReceipt(
        this.pendingTransactions[tx].hash
      );

      // If blockNumber exists, tx was included or a 0 status means tx failure
      if (txReceipt.blockNumber || txReceipt.status == 0) {
        // Remove tx from pendingTransactions
        delete this.pendingTransactions[tx];
        // Else, tx is still pending, increase gas price
      } else {
        // Clone transaction
        let cloneTx = await this.provider.getTransaction(
          this.pendingTransactions[tx].hash
        );
        // Naively double gas price, TODO: re-check for profitability, improve escalator
        const improvedTx = {
          to: cloneTx.to,
          from: cloneTx.from,
          nonce: cloneTx.nonce,
          gasLimit: cloneTx.gasLimit,
          gasPrice: cloneTx.gasPrice.mul(2),
          data: cloneTx.data,
          value: cloneTx.data,
          chainId: cloneTx.chainId,
          type: cloneTx.type,
          accessList: cloneTx.accessList
        };
        // Send tx
        const { hash, gasPrice } = await this.wallet.sendTransaction(
          improvedTx
        );
        console.log(`Resending tx: ${hash}`);
        // Update tx
        this.pendingTransactions[tx] = { hash, gasPrice: gasPrice.toNumber() };
      }
    }

    return this.pendingTransactions;
  }
}
