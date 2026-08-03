// scripts/test-yalidine.ts
import { yalidineClient } from "../src/infrastructure/yalidine/client";
async function main() {
  const result = await yalidineClient.getWilayas();
  console.log(`Got ${result.total_data} wilayas`);
  console.log(result.data.slice(0, 3));
}

main().catch(console.error);
