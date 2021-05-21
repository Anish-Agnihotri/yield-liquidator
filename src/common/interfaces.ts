import { BigNumber } from "@ethersproject/bignumber";

export interface IPosition {
  // borrowing_power(user) >= debt(collateral_type)
  collateralized: boolean;
  // posted collateral
  posted: BigNumber;
  // debt + interest owed at maturity
  debt: BigNumber;
}

interface IAuction {}

export interface IPendingTransaction {
  // Transaction hash
  hash: string;
  // Transaction gas price
  gasPrice: number;
}

export interface IKeeper {
  // gas price
  gasPrice: number;
  // last block
  blockNumber: number;
  // all positions
  positions: Record<string, IPosition>;
  // auctions
  auctions: Record<string, IAuction>;
  // pending liquidations (address => gasPrice)
  pendingLiquidations: Record<string, IPendingTransaction>;
}
