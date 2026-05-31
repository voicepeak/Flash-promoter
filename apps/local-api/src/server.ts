import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createApp } from "./app.js";
import { FlashPromoterRepository } from "@flash-promoter/storage";

const port = Number(process.env.FLASH_PROMOTER_API_PORT ?? 3333);
const host = process.env.FLASH_PROMOTER_API_HOST ?? "127.0.0.1";
const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const defaultDataDir = resolve(appRoot, "data");
const legacyDataDir = resolve(appRoot, "..", "data");
const dataDir = process.env.FLASH_PROMOTER_DATA_DIR ?? chooseDataDir(defaultDataDir, legacyDataDir);
const dbPath = resolve(dataDir, "flash-promoter.sqlite");

const repository = new FlashPromoterRepository(dbPath);
const app = createApp(repository, { dbPath });

await app.listen({ port, host });

app.log.info({ dbPath }, "flash-promoter local API started");

function chooseDataDir(current: string, legacy: string): string {
  const currentDb = resolve(current, "flash-promoter.sqlite");
  const legacyDb = resolve(legacy, "flash-promoter.sqlite");
  return !existsSync(currentDb) && existsSync(legacyDb) ? legacy : current;
}
