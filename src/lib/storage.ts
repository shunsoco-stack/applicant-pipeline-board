import { parseBackup } from "./backup";
import { createSeed } from "./seed";

export const STORAGE_KEY = "apb:v1";

export function loadDatabase(raw: string | null, now = new Date()) {
  if (!raw) return { database: createSeed(now), notice: "" };
  try {
    return { database: parseBackup(raw), notice: "" };
  } catch {
    return {
      database: createSeed(now),
      notice: "保存データが壊れていたため、既定データに戻しました。",
    };
  }
}
