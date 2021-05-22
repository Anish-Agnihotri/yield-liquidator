// wETH in Bytes32
export const WETH_BYTES32 =
  "0x4554482d41000000000000000000000000000000000000000000000000000000";

// Contract Address constants
export const CONTRACT_ADDRESSES = {
  mainnet: {
    controller: "0xB94199866Fe06B535d019C11247D3f921460b91A",
    liquidations: "0x357B7E1Bd44f5e48b988a61eE38Bfe9a76983E33"
  },
  kovan: {
    controller: "0xFCDF6d4de26C53115610D9FBdaFD93CBDb843Ea2",
    liquidations: "0x6E254e9130D4593561161DcFD0Ea7969C096AEfA"
  },
  development: {
    controller: process.env.DEV_CONTROLLER_ADDR,
    liquidations: process.env.DEV_LIQUIDATIONS_ADDR
  }
};
