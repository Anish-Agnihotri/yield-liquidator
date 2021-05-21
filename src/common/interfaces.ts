import { BigNumber } from "@ethersproject/bignumber";

export interface IBorrower {
  // borrowing_power(user) >= debt(collateral_type)
  collateralized: boolean;
  // posted collateral
  posted: BigNumber;
  // debt + interest owed at maturity
  debt: BigNumber;
}
