import Auctions from "./auctions";
import Positions from "./positions";
import Liquidations from "./liquidations";
import { IKeeper } from "./common/interfaces";
import { Wallet } from "@ethersproject/wallet";
import { JsonRpcProvider } from "@ethersproject/providers";
import { logger } from "./common/logging";

export default class Keeper {
  // Ethers setup
  provider: JsonRpcProvider;
  wallet: Wallet;

  // Keeper state
  state: IKeeper = {
    gasPrice: null,
    blockNumber: null,
    positions: null,
    auctions: null,
    pendingTransactions: null
  };

  // Providers
  positions: Positions;
  liquidations: Liquidations;
  auctions: Auctions;

  constructor(rpc: string, network: string) {
    this.provider = new JsonRpcProvider(rpc);
    this.wallet = new Wallet(process.env.PRIVATE_KEY, this.provider);

    this.positions = new Positions(this.wallet, network);
    this.liquidations = new Liquidations(this.provider, this.wallet, network);
    this.auctions = new Auctions(this.wallet, network);
  }

  async onBlock() {
    // TODO: Collect gas price
    this.state.gasPrice = 5;

    // Collect block number
    this.state.blockNumber = await this.provider.getBlockNumber();
    logger.info(`Received block ${this.state.blockNumber.toLocaleString()}`);

    // TODO: Remove or bump all transactions
    this.state.pendingTransactions = await this.liquidations.bumpOrRemove(
      this.state.gasPrice
    );

    // Collect positions from new block
    this.state.positions = await this.positions.collect();

    // Altruistically call liquidation for any underwater position
    this.state.pendingTransactions = await this.liquidations.triggerLiquidations(
      this.state.positions,
      this.state.gasPrice
    );

    // Collect auctions from new block
    this.state.auctions = await this.auctions.collect(this.state.positions);

    // TODO: Attempt to buy auctions if profitable
    /*this.state.pendingTransactions = await this.liquidations.participateAuctions(
      this.state.auctions,
      this.state.gasPrice
    );*/
  }

  async run() {
    await this.onBlock();
    this.provider.on("block", async () => await this.onBlock());
  }
}
