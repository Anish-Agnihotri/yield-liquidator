import { IPosition, IPendingTransaction } from "./common/interfaces";
import { Contract } from "@ethersproject/contracts";
import { Wallet } from "@ethersproject/wallet";
import { CONTRACT_ADDRESSES } from "./common/constants";
import { ABI_LIQUIDATIONS } from "./common/abi";

export default class Liquidations {
  // Ethers setup
  liquidations: Contract;

  // Pending liquidation transactions
  pendingLiquidations: Record<string, IPendingTransaction> = {};

  constructor(wallet: Wallet, network: string) {
    this.liquidations = new Contract(
      CONTRACT_ADDRESSES[network].liquidations,
      ABI_LIQUIDATIONS,
      wallet
    );
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
        !this.pendingLiquidations.hasOwnProperty(position)
      ) {
        console.log("GENERATING A NEW LIQUIDATION");
        // Create liquidation w/ gas price
        const { hash } = await this.liquidations.liquidate(position, {
          gasPrice
        });

        // Update pending liquidations map
        this.pendingLiquidations[position] = { hash, gasPrice };
      }
    }

    // Return new pending liquidations
    return this.pendingLiquidations;
  }
}
