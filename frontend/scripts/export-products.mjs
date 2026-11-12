import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const productsModule = await import(pathToFileURL(resolve(here, "../src/data/products.js")).href);
const outputPath = resolve(here, "../../backend/products_seed.json");

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(productsModule.PRODUCTS, null, 2)}\n`);
console.log(`Wrote ${productsModule.PRODUCTS.length} products to ${outputPath}`);
