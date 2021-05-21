import * as dotenv from "dotenv";
import Keeper from "./keeper";

dotenv.config();

async function main() {
  const liq = new Keeper(process.env.RPC, "kovan");
  await liq.onBlock();
}

main();
