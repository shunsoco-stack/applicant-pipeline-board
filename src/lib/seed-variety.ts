import { shiftDays } from "./dates";

// 再生成しても比較できるよう、日時に依存しない固定シードを使う。
function random(seed: number) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

export function applicationStamps(today: string) {
  const next = random(20261118);
  const ages = [8, 11, 18, 11, 23, 14, 18, 25, 12, 18, 24, 15, 26, 23];
  // 掲載直後・週明けの集中と、次の掲載まで1週間以上空く期間。
  const weekday = new Date(`${today}T00:00:00Z`).getUTCDay();
  const mondayAge = 35 + ((weekday + 6) % 7);
  const offsets = [
    0, 0, 1, 3, 3, 4, 13, 14, 14, 14, 16, 19, 28, 28, 29, 30, 32, 33, 42, 42, 42, 43, 45, 49, 59,
    60, 60, 61, 64, 70, 77,
  ];
  ages.push(...offsets.map((offset) => mondayAge + offset));
  return ages.map((age) => {
    const period = next();
    const hour =
      period < 0.4
        ? 8 + Math.floor(next() * 4)
        : period < 0.65
          ? 12 + Math.floor(next() * 2)
          : 18 + Math.floor(next() * 5);
    const minute = Math.floor(next() * 60);
    return {
      date: shiftDays(today, -age),
      time: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
    };
  });
}

export function applicationSources() {
  const next = random(74021);
  const sources: string[] = [];
  const windows = new Set<string>();
  for (let index = 0; index < 45; index++) {
    // 営業・経理は求人サイト中心、倉庫はハローワークにも重みを置く。
    const weights = index % 3 === 2 ? [0.4, 0.1, 0.4, 0.1] : [0.55, 0.2, 0.05, 0.2];
    let source: string;
    let window: string;
    do {
      let value = next();
      let choice = 0;
      while (choice < 3 && value >= weights[choice]) value -= weights[choice++];
      source = ["求人サイト", "社員紹介", "ハローワーク", "自社サイト"][choice];
      window = [...sources.slice(-3), source].join("/");
    } while (index >= 3 && windows.has(window));
    sources.push(source);
    if (index >= 3) windows.add(window);
  }
  return sources;
}
