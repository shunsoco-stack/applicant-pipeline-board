const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");

// 既存のTypeScriptだけを使い、純粋関数をNode上で検証する。
require.extensions[".ts"] = (module, filename) => {
  const source = fs.readFileSync(filename, "utf8");
  const result = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  module._compile(result.outputText, filename);
};

const dates = require("../src/lib/dates.ts");
const { createSeed } = require("../src/lib/seed.ts");
const { deadlineStatus, waitingDays, stageDays } = require("../src/lib/deadlines.ts");
const { moveNext, recordContact, closeCandidate } = require("../src/lib/pipeline.ts");
const { splitCriteria, saveEvaluation } = require("../src/lib/scorecard.ts");
const { summarize, rate } = require("../src/lib/declines.ts");
const { createCsv, csvCell, csvFilename } = require("../src/lib/csv.ts");
const { parseBackup, exportBackup, validateDatabase } = require("../src/lib/backup.ts");
const { loadDatabase } = require("../src/lib/storage.ts");
const { boardStats } = require("../src/lib/stats.ts");

const moments = [
  "2026-11-18T14:30:00+09:00",
  "2026-11-21T00:01:00+09:00",
  "2026-11-22T23:59:00+09:00",
  "2027-01-03T23:59:00+09:00",
  "2026-11-18T00:10:00+09:00",
  "2026-11-18T08:00:00+09:00",
  "2026-11-18T12:30:00+09:00",
  "2026-11-18T23:50:00+09:00",
  "2026-10-01T00:05:00+09:00",
  "2026-10-31T23:59:00+09:00",
  "2026-11-20T23:30:00+09:00",
  "2026-11-16T00:01:00+09:00",
  "2026-12-31T00:10:00+09:00",
  "2027-01-01T00:10:00+09:00",
  "2026-11-23T10:00:00+09:00",
  "2026-05-06T00:10:00+09:00",
];

for (const moment of moments) {
  const now = new Date(moment);
  const seed = createSeed(now);
  const today = dates.japanNow(now).date;
  test(`${moment} 記録がすべて現在より前`, () => {
    for (const candidate of seed.candidates) {
      const stamps = [
        candidate.applied,
        ...candidate.history.flatMap((entry) => [
          entry.entered,
          ...(entry.exited ? [entry.exited] : []),
        ]),
        ...candidate.contacts.map((entry) => entry.at),
        ...candidate.evaluations.map((entry) => entry.at),
        ...(candidate.outcome ? [candidate.outcome.at] : []),
      ];
      for (const stamp of stamps)
        assert.ok(
          new Date(`${stamp.date}T${stamp.time}:00+09:00`) < now,
          `${candidate.id} ${JSON.stringify(stamp)}`,
        );
    }
  });
  test(`${moment} 期限と進行中の件数`, () => {
    assert.deepEqual(boardStats(seed.candidates, today), { active: 14, overdue: 3, today: 2 });
    assert.equal(seed.candidates.length, 45);
  });
  test(`${moment} 遵守別の辞退率`, () => {
    const stats = summarize(seed.candidates, dates.shiftDays(today, -130), today, today);
    assert.ok(stats.missed.percent >= 30 && stats.missed.percent <= 55);
    assert.ok(stats.compliant.percent >= 10 && stats.compliant.percent <= 30);
    assert.ok(stats.missed.percent > stats.compliant.percent);
  });
  test(`${moment} 自然なシードと面接の営業日`, () => {
    assert.equal(validateDatabase(seed), true);
    const notes = seed.candidates.flatMap((candidate) =>
      candidate.contacts.map((contact) => contact.note),
    );
    assert.equal(new Set(notes).size, notes.length);
    const applied = seed.candidates.map((candidate) => candidate.applied.date).sort();
    assert.ok(
      new Set(applied.slice(1).map((day, index) => dates.daysBetween(applied[index], day))).size >=
        3,
    );
    const reasons = summarize(seed.candidates, dates.shiftDays(today, -130), today, today).reasons(
      "辞退",
    );
    assert.equal(reasons[0].reason, "他社内定");
    for (const candidate of seed.candidates.filter((item) => item.interview)) {
      assert.ok(
        candidate.interview.date === dates.shiftDays(today, 1) ||
          dates.isBusinessDay(candidate.interview.date),
      );
      assert.ok(candidate.interview.time >= "10:00" && candidate.interview.time <= "18:00");
    }
  });
  test(`${moment} 応募時刻と日付のばらつき`, () => {
    const stamps = seed.candidates.map((item) => item.applied);
    assert.ok(new Set(stamps.map((stamp) => stamp.time)).size >= 15);
    for (const [start, end] of [
      ["08:00", "12:00"],
      ["12:00", "14:00"],
      ["18:00", "23:00"],
    ]) {
      assert.ok(stamps.some((stamp) => stamp.time >= start && stamp.time < end));
    }
    assert.ok(
      stamps.some((stamp) => [0, 6].includes(new Date(`${stamp.date}T00:00:00Z`).getUTCDay())),
    );
    const days = stamps.map((stamp) => stamp.date).sort();
    const gaps = days.slice(1).map((day, index) => dates.daysBetween(days[index], day));
    assert.ok(new Set(gaps).size >= 4);
    assert.ok(gaps.includes(0));
    assert.ok(gaps.some((gap) => gap >= 7));
    assert.ok(
      days.some(
        (day) =>
          new Date(`${day}T00:00:00Z`).getUTCDay() === 1 &&
          days.filter((other) => other === day).length >= 2,
      ),
    );
  });
  test(`${moment} 経路の4件窓が繰り返されない`, () => {
    const sources = seed.candidates.map((item) => item.source);
    const windows = sources.slice(3).map((_, index) => sources.slice(index, index + 4).join("/"));
    assert.equal(new Set(windows).size, windows.length);
    const ratio = sources.filter((source) => source === "求人サイト").length / sources.length;
    assert.ok(ratio >= 0.4 && ratio <= 0.6, String(ratio));
    const warehouse = seed.candidates.filter(
      (item) => item.job === "倉庫リーダー" && item.source === "ハローワーク",
    ).length;
    const others = seed.candidates.filter(
      (item) => item.job !== "倉庫リーダー" && item.source === "ハローワーク",
    ).length;
    assert.ok(warehouse / 15 > others / 30);
  });
  test(`${moment} 氏名に重複や固定順がない`, () => {
    const names = seed.candidates.map((item) => item.name);
    assert.equal(new Set(names).size, names.length);
    const surnames = names.map((name) => name.split(" ")[0]);
    const ranking =
      "佐藤 高橋 田中 伊藤 渡辺 山本 中村 小林 加藤 吉田 山田 佐々木 山口 松本 井上 木村 林 清水 斎藤 池田 橋本 阿部 石川 山崎 森 石井 藤田 岡田 後藤 長谷川 村上 近藤 石田 坂本 遠藤 青木 藤井 西村 福田 太田 三浦 藤原 岡本 松田 中川".split(
        " ",
      );
    const kanaOrder =
      "青木 阿部 石井 石川 伊藤 井上 遠藤 岡田 岡本 小林 加藤 木村 近藤 斎藤 坂本 佐々木 佐藤 汐田 清水 高橋 田中 長谷川 鳴海 西村 檜山 藤井 藤田 藤原 真壁 松田 松本 三浦 村上 森 山口 山崎 山田 山本 吉田 渡辺".split(
        " ",
      );
    for (const fixed of [ranking, kanaOrder]) {
      const pairs = new Set(fixed.slice(1).map((name, index) => `${fixed[index]}/${name}`));
      assert.ok(
        surnames.slice(1).filter((name, index) => pairs.has(`${surnames[index]}/${name}`)).length <
          10,
      );
    }
    for (const name of ["汐田", "檜山", "真壁", "鳴海"]) assert.ok(surnames.includes(name));
  });
  test(`${moment} 全種類のメモが個別で名前の前置きがない`, () => {
    const notes = seed.candidates
      .flatMap((item) => [
        item.note,
        ...item.contacts.map((entry) => entry.note),
        ...item.evaluations.map((entry) => entry.comment),
        item.outcome?.note,
      ])
      .filter(Boolean);
    assert.equal(new Set(notes).size, notes.length);
    assert.ok(notes.every((note) => !/さん[:：]|さんから伺った事情・選考判断/.test(note)));
    const count = seed.candidates.filter((item) => item.note).length;
    assert.ok(count >= 18 && count <= 27);
  });
  test(`${moment} 直近の面接が2件あり未来の予定`, () => {
    const interviews = seed.candidates.flatMap((item) => (item.interview ? [item.interview] : []));
    assert.equal(
      interviews.filter((item) => item.date === today || item.date === dates.shiftDays(today, 1))
        .length,
      2,
    );
    for (const item of interviews) assert.ok(new Date(`${item.date}T${item.time}:00+09:00`) > now);
  });
  test(`${moment} 同一日時で再現できる`, () => {
    assert.deepEqual(createSeed(now), seed);
  });
}

const seed = createSeed(new Date(moments[0]));

test("評価コメントに重複がない", () => {
  const comments = seed.candidates.flatMap((candidate) =>
    candidate.evaluations.map((evaluation) => evaluation.comment),
  );
  assert.equal(new Set(comments).size, comments.length);
});

test("辞退理由は他社内定・条件・選考が遅いの順に多い", () => {
  const reasons = summarize(seed.candidates, "2026-07-01", "2026-11-18", "2026-11-18").reasons(
    "辞退",
  );
  assert.deepEqual(
    reasons.slice(0, 3).map((row) => row.reason),
    ["他社内定", "条件", "選考が遅い"],
  );
});

for (const [label, mutate] of [
  [
    "履歴と現在段階の不一致",
    (candidate) => {
      candidate.stage = "応募";
    },
  ],
  [
    "履歴の時系列逆転",
    (candidate) => {
      candidate.history[0].exited = { date: "2020-01-01", time: "12:00" };
    },
  ],
  [
    "連絡の時系列逆転",
    (candidate) => {
      candidate.contacts[0].at = { date: "2020-01-01", time: "12:00" };
    },
  ],
  [
    "終了理由の不正値",
    (candidate) => {
      candidate.outcome.reason = "不正な理由";
    },
  ],
  [
    "終了時刻と履歴の不一致",
    (candidate) => {
      candidate.outcome.at = { ...candidate.outcome.at, time: "23:59" };
    },
  ],
]) {
  test(`バックアップで${label}を拒否`, () => {
    const broken = structuredClone(seed);
    mutate(broken.candidates[17]);
    assert.equal(validateDatabase(broken), false);
  });
}

test("終了後の連絡を拒否", () => {
  assert.throws(() =>
    recordContact(
      seed.candidates[17],
      seed.settings,
      { date: "2026-11-18", time: "10:00" },
      "電話",
      "確認",
    ),
  );
});

test("応募前の辞退記録を拒否", () => {
  assert.throws(() =>
    closeCandidate(seed.candidates[0], "辞退", "条件", "確認", {
      date: "2020-01-01",
      time: "10:00",
    }),
  );
});
const candidate = seed.candidates[0];
const at = { date: "2026-11-18", time: "10:00" };

for (const day of [
  "2025-02-24",
  "2025-05-06",
  "2026-09-22",
  "2026-12-29",
  "2027-01-03",
  "2027-03-22",
  "2026-11-21",
  "2026-11-22",
]) {
  test(`${day} は休業日`, () => assert.equal(dates.isBusinessDay(day), false));
}

test("金曜から祝日をまたぐ2営業日", () =>
  assert.equal(dates.addBusinessDays("2026-11-20", 2), "2026-11-25"));
test("年末年始をまたぐ1営業日", () =>
  assert.equal(dates.addBusinessDays("2026-12-28", 1), "2027-01-04"));
test("営業日を逆算", () => assert.equal(dates.addBusinessDays("2027-01-04", -1), "2026-12-28"));
test("0営業日は同じ日", () => assert.equal(dates.addBusinessDays("2026-11-18", 0), "2026-11-18"));
test("日本時間の日付境界", () =>
  assert.deepEqual(dates.japanNow(new Date("2026-11-17T15:10:00Z")), {
    date: "2026-11-18",
    time: "00:10",
  }));
test("うるう年の暦日", () => assert.equal(dates.daysBetween("2024-02-28", "2024-03-01"), 2));
test("期限切れ", () => assert.equal(deadlineStatus("2026-11-17", at.date).key, "overdue"));
test("今日期限", () => assert.equal(deadlineStatus(at.date, at.date).key, "today"));
test("あと1日", () => assert.equal(deadlineStatus("2026-11-19", at.date).key, "soon"));
test("余裕あり", () => assert.equal(deadlineStatus("2026-11-20", at.date).key, "safe"));
test("最終連絡からの日数", () => assert.equal(waitingDays(candidate, at.date), 2));
test("段階に入ってからの日数", () => assert.equal(stageDays(candidate, at.date), 8));
test("移動で履歴を閉じ次の履歴を作る", () => {
  const moved = moveNext(candidate, seed.settings, at);
  assert.equal(moved.stage, "書類選考");
  assert.deepEqual(moved.history[0].exited, at);
  assert.deepEqual(moved.history[1].entered, at);
  assert.equal(candidate.history.length, 1);
});
test("期限超過を移動後にも保持", () =>
  assert.equal(moveNext(candidate, seed.settings, at).missed, true));
test("内定から承諾へ", () =>
  assert.equal(moveNext(seed.candidates[12], seed.settings, at).outcome.kind, "内定承諾"));
test("終了後の移動を拒否", () =>
  assert.throws(() => moveNext(seed.candidates[17], seed.settings, at)));
test("連絡で期限を再計算", () => {
  const updated = recordContact(candidate, seed.settings, at, "電話", "日程を確認");
  assert.equal(updated.deadline, "2026-11-20");
  assert.equal(updated.contacts.length, 2);
  assert.equal(updated.contacts[1].due, candidate.deadline);
});
test("空の連絡内容を拒否", () =>
  assert.throws(() => recordContact(candidate, seed.settings, at, "電話", " ")));
test("辞退の理由と履歴", () => {
  const ended = closeCandidate(candidate, "辞退", "条件", "時短希望", at);
  assert.equal(ended.outcome.reason, "条件");
  assert.deepEqual(ended.history.at(-1).exited, at);
});
test("理由なし終了を拒否", () =>
  assert.throws(() => closeCandidate(candidate, "辞退", "", "内容", at)));
test("メモなし終了を拒否", () =>
  assert.throws(() => closeCandidate(candidate, "見送り", "経験", " ", at)));
test("2段階の差を強調", () => assert.equal(splitCriteria(seed.candidates[6].evaluations)[0], true));
test("単独の評価は割れなし", () =>
  assert.deepEqual(splitCriteria(seed.candidates[7].evaluations), [
    false,
    false,
    false,
    false,
    false,
  ]));
test("面接官ごとの更新", () => {
  const evaluation = seed.candidates[6].evaluations[0];
  assert.equal(saveEvaluation([evaluation], { ...evaluation, comment: "更新" }).length, 1);
});
test("範囲外評価を拒否", () =>
  assert.throws(() =>
    saveEvaluation([], { ...seed.candidates[6].evaluations[0], scores: [0, 2, 3, 4, 1] }),
  ));
test("空母集団の割合", () => assert.deepEqual(rate([]), { total: 0, declined: 0, percent: 0 }));
test("クロス集計の合計が辞退数と一致", () => {
  const stats = summarize(seed.candidates, "2026-07-01", at.date, at.date);
  assert.equal(
    stats.cross.reduce((sum, row) => sum + row.counts.reduce((a, b) => a + b, 0), 0),
    stats.declines.length,
  );
});
test("期間外は集計されない", () =>
  assert.equal(summarize(seed.candidates, "2024-01-01", "2024-02-01", at.date).ended.length, 0));
test("CSV BOMとエスケープ", () =>
  assert.equal(createCsv([["氏名", 'a"b,c\nx']]), '\uFEFF"氏名","a""b,c\nx"'));
test("CSV数式対策", () => assert.equal(csvCell("=1+1"), '"\'=1+1"'));
test("応募者CSVファイル名", () => assert.equal(csvFilename(at.date), "応募者一覧_2026-11-18.csv"));
test("辞退CSVファイル名", () =>
  assert.equal(
    csvFilename(at.date, "2026-08-01", at.date),
    "辞退見送り一覧_2026-08-01_2026-11-18.csv",
  ));
test("JSON往復", () => assert.deepEqual(parseBackup(exportBackup(seed)), seed));
test("不正JSON拒否", () => assert.throws(() => parseBackup("{")));
test("異なるバージョン拒否", () => assert.equal(validateDatabase({ ...seed, version: 2 }), false));
test("重複ID拒否", () =>
  assert.equal(validateDatabase({ ...seed, candidates: [candidate, candidate] }), false));
test("壊れた配列拒否", () =>
  assert.equal(
    validateDatabase({ ...seed, candidates: [{ ...candidate, contacts: null }] }),
    false,
  ));
test("不正日付拒否", () =>
  assert.equal(
    validateDatabase({ ...seed, candidates: [{ ...candidate, deadline: "2026-02-30" }] }),
    false,
  ));
test("不正SLA拒否", () =>
  assert.equal(validateDatabase({ ...seed, settings: { ...seed.settings, sla: {} } }), false));
test("壊れた保存データは通知付きで復元", () => {
  const loaded = loadDatabase("broken", new Date(moments[0]));
  assert.ok(loaded.notice);
  assert.equal(loaded.database.candidates.length, 45);
});
test("初回保存は通知なし", () => assert.equal(loadDatabase(null, new Date(moments[0])).notice, ""));
