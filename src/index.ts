import * as dotenv from "dotenv";

// Keeper
import Keeper from "./keeper";

// Setup environment variables
dotenv.config();

/**
 * Run liquidator
 */
async function main() {
  // Setup and run keeper with rpc endpoint and network
  const liq = new Keeper(process.env.RPC, process.env.NETWORK);
  await liq.run();
}

main();
