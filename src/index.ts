import * as dotenv from "dotenv";
import Liquidator from "./liquidator";
import { KOVAN_CONTROLLER } from "./common/constants";

dotenv.config();

async function main() {
  const liq = new Liquidator(process.env.RPC, KOVAN_CONTROLLER);
  await liq.run();
}

main();
