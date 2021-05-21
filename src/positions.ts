import { WETH_BYTES32 } from "./common/constants";
import { IPosition } from "./common/interfaces";
import { Contract } from "@ethersproject/contracts";
import { logger } from "./common/logging";
import { CONTRACT_ADDRESSES } from "./common/constants";
import { ABI_CONTROLLER } from "./common/abi";
import { JsonRpcProvider } from "@ethersproject/providers";

export default class Positions {
  // Ethers setup
  controller: Contract;

  // Yield positions
  positions: Record<string, IPosition> = {};

  constructor(provider: JsonRpcProvider, network: string) {
    this.controller = new Contract(
      CONTRACT_ADDRESSES[network].controller,
      ABI_CONTROLLER,
      provider
    );
  }

  async collectPositionByAddress(address): Promise<IPosition> {
    const [collateralized, posted, debt] = await Promise.all([
      this.controller.isCollateralized(WETH_BYTES32, address),
      this.controller.posted(WETH_BYTES32, address),
      this.controller.totalDebtDai(WETH_BYTES32, address)
    ]);

    return { collateralized, posted, debt };
  }

  async updateBorrowingAddresses(): Promise<void> {
    logger.info("Updating borrowing addresses");

    const borrowFilter = this.controller.filters.Borrowed();
    const borrowEvents = await this.controller.queryFilter(borrowFilter);

    borrowEvents.map((position) => {
      if (!this.positions.hasOwnProperty(position.args.user)) {
        this.positions[position.args.user] = null;
      }
    });
  }

  async updateBorrowingPositions(): Promise<void> {
    logger.info("Updating borrower positions");

    for (const address in this.positions) {
      const position = await this.collectPositionByAddress(address);
      this.positions[address] = position;
    }
  }

  async collect() {
    await this.updateBorrowingAddresses();
    await this.updateBorrowingPositions();
    return this.positions;
  }
}
