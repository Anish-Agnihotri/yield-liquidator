import { JsonRpcProvider } from "@ethersproject/providers";
import Positions from "./positions";
import { IKeeper } from "./common/interfaces";
import Liquidations from "./liquidations";

export default class Keeper {
  // Ethers setup
  provider: JsonRpcProvider;

  // Keeper state
  state: IKeeper;

  // Providers
  positions: Positions;
  liquidations: Liquidations;

  constructor(rpc: string, network: string) {
    this.provider = new JsonRpcProvider(rpc);
    this.positions = new Positions(this.provider, network);
    this.liquidations = new Liquidations(this.provider, network);
  }

  async onBlock() {
    // Collect gas price
    this.state.gasPrice = 100;

    // Collect block number
    this.state.blockNumber = await this.provider.getBlockNumber();

    // Remove or bump all transactions

    // Collect positions from new block
    this.state.positions = await this.positions.collect();

    // Altruistically call liquidation for any underwater position
    this.state.pendingLiquidations = await this.liquidations.triggerLiquidations(
      this.state.positions,
      this.state.gasPrice
    );

    // Attempt to buy auctions if profitable
  }

  async run() {
    await this.onBlock();
    this.provider.on("block", async () => await this.onBlock());
  }
}
