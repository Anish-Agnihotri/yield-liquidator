import { logger } from "./common/logging";
import { ABI_CONTROLLER } from "./common/abi";
import { IPosition } from "./common/interfaces";
import { WETH_BYTES32 } from "./common/constants";
import { Contract } from "@ethersproject/contracts";
import { CONTRACT_ADDRESSES } from "./common/constants";
import { Wallet } from "@ethersproject/wallet";

export default class Positions {
  // Controller contract
  controller: Contract;

  // Borrower positions (address => position)
  positions: Record<string, IPosition> = {};

  /**
   * Setup controller contract on load
   * @param {JsonRpcProvider} provider ethers provider
   * @param {string} network mainnet || kovan
   */
  constructor(wallet: Wallet, network: string) {
    // Setup new controller contract
    this.controller = new Contract(
      CONTRACT_ADDRESSES[network].controller,
      ABI_CONTROLLER,
      wallet
    );
  }

  /**
   * Collects position by address
   * @param {string} address borrower address
   * @returns {Promise<IPosition>} borrower position
   */
  async collectPositionByAddress(address): Promise<IPosition> {
    // Collect collateralization status, posted collateral, debt
    const [collateralized, posted, debt] = await Promise.all([
      this.controller.isCollateralized(WETH_BYTES32, address),
      this.controller.posted(WETH_BYTES32, address),
      this.controller.totalDebtDai(WETH_BYTES32, address)
    ]);

    return { collateralized, posted, debt };
  }

  /**
   * Stores all borrower addresses
   */
  async updateBorrowingAddresses(): Promise<void> {
    logger.info("Updating borrowing addresses");

    // Filter for all Borrow events
    const borrowFilter = this.controller.filters.Borrowed();
    const borrowEvents = await this.controller.queryFilter(borrowFilter);

    // For each borrow event
    borrowEvents.map((position) => {
      // If the user address is not tracker in positions map
      if (!this.positions.hasOwnProperty(position.args.user)) {
        // Generate new null entry
        this.positions[position.args.user] = null;
      }
    });
  }

  /**
   * Stores position per borrower address
   */
  async updateBorrowingPositions(): Promise<void> {
    logger.info("Updating borrower positions");

    for (const address in this.positions) {
      // Collect and update position for each borrower address
      const position = await this.collectPositionByAddress(address);
      this.positions[address] = position;
    }
  }

  /**
   * Collects all borrower addresses, and returns their positions
   * @returns {Promise<Record<string, IPosition>>} borrower positions
   */
  async collect(): Promise<Record<string, IPosition>> {
    await this.updateBorrowingAddresses();
    await this.updateBorrowingPositions();
    return this.positions;
  }
}
