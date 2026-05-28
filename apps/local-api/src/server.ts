import { resolve } from "node:path";
import { createApp } from "./app.js";
import { FlashPromoterRepository } from "@flash-promoter/storage";

const port = Number(process.env.FLASH_PROMOTER_API_PORT ?? 3333);
const host = process.env.FLASH_PROMOTER_API_HOST ?? "127.0.0.1";
const dataDir = process.env.FLASH_PROMOTER_DATA_DIR ?? resolve(process.cwd(), "..", "..", "data");
const dbPath = resolve(dataDir, "flash-promoter.sqlite");

const repository = new FlashPromoterRepository(dbPath);
const app = createApp(repository);

await app.listen({ port, host });

app.log.info({ dbPath }, "flash-promoter local API started");
