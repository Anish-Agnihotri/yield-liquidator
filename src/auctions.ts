import { Wallet } from "@ethersproject/wallet";
import { ABI_LIQUIDATIONS } from "./common/abi";
import { Contract } from "@ethersproject/contracts";
import { CONTRACT_ADDRESSES } from "./common/constants";
import { IAuction, IPosition } from "./common/interfaces";

export default class Auctions {
  // Liquidations contract
  liquidations: Contract;

  // Auctions (address => auction)
  auctions: Record<string, IAuction> = {};

  /**
   * Setup liquidations contract on load
   * @param {JsonRpcProvider} provider ethers provider
   * @param {string} network mainnet || kovan
   */
  constructor(wallet: Wallet, network: string) {
    // Setup new liquidations contract
    this.liquidations = new Contract(
      CONTRACT_ADDRESSES[network].liquidations,
      ABI_LIQUIDATIONS,
      wallet
    );
  }

  /**
   * Collects individual auction by address
   * @param {string} address to retrieve auction data for
   * @returns {Promise<IAuction>} auction details
   */
  async collectAuctionByAddress(address: string): Promise<IAuction> {
    // Collect vault data + auction start timestamp
    const [vault, timestamp] = await Promise.all([
      await this.liquidations.vaults(address),
      await this.liquidations.liquidations(address)
    ]);

    return { collateral: vault[0], debt: vault[1], timestamp };
  }

  /**
   * Collects auctions for all liquidatable positions
   * @param {Record<string, IPosition>} positions all positions
   */
  async collectAllAuctions(
    positions: Record<string, IPosition>
  ): Promise<void> {
    // For each address with a position
    for (const position in positions) {
      // If the position is liquidatable
      if (!positions[position].collateralized) {
        // Collect auction details
        const auctionDetails = await this.collectAuctionByAddress(position);

        // If auction has begun (non-zero timestamp)
        // TODO: confirm if this timestamp is reset post-auction-success
        if (!auctionDetails.timestamp.eq(0)) {
          // Set auction details
          this.auctions[position] = auctionDetails;
        }
      }
    }
  }

  /**
   * Returns all active auctions
   * @param {Record<string, IPosition>} positions all positions
   * @returns {Promise<Record<string, IAuction>} address => active auction
   */
  async collect(
    positions: Record<string, IPosition>
  ): Promise<Record<string, IAuction>> {
    await this.collectAllAuctions(positions);
    return this.auctions;
  }
}
