import { ABI_CONTROLLER } from "./common/abi";
import { WETH_BYTES32 } from "./common/constants";
import { IBorrower } from "./common/interfaces";
import { Contract } from "@ethersproject/contracts";
import { JsonRpcProvider } from "@ethersproject/providers";
import { logger } from "./common/logging";

export default class Liquidator {
  // Ethers setup
  provider: JsonRpcProvider;
  controller: Contract;

  // Yield positions
  positions: Record<string, IBorrower> = {};

  constructor(rpc: string, controller: string) {
    this.provider = new JsonRpcProvider(rpc);
    this.setupContracts(controller);
  }

  setupContracts(controller: string) {
    // Setup controller
    this.controller = new Contract(controller, ABI_CONTROLLER, this.provider);
  }

  async collectPositionByAddress(address): Promise<IBorrower> {
    const [collateralized, posted, debt] = await Promise.all([
      this.controller.isCollateralized(WETH_BYTES32, address),
      this.controller.posted(WETH_BYTES32, address),
      this.controller.totalDebtDai(WETH_BYTES32, address)
    ]);

    return { collateralized, posted, debt };
  }

  async updateBorrowingAddresses() {
    logger.info("Updating borrowing addresses");

    const borrowFilter = this.controller.filters.Borrowed();
    const borrowEvents = await this.controller.queryFilter(borrowFilter);

    borrowEvents.map((position) => {
      if (!this.positions.hasOwnProperty(position.args.user)) {
        this.positions[position.args.user] = null;
      }
    });
  }

  async updateBorrowingPositions() {
    logger.info("Updating borrower positions");

    for (const address in this.positions) {
      const position = await this.collectPositionByAddress(address);
      this.positions[address] = position;
    }
  }

  async run() {
    this.provider.on("block", async () => {
      await this.updateBorrowingAddresses();
      await this.updateBorrowingPositions();
      console.log(this.positions);
    });
  }
}
