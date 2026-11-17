import assert from "node:assert/strict";
import test from "node:test";
import { buildDailyPlan, buildDailyPlanCsv, calendarDaysUntil, currentStudyStreak, focusMinutesForDay, mergeImportedTopics, parseSavedState, readStudyBackup, recentStudyWeek, recordFocusSession, summarizeStudyBackup } from "../app/study-state.ts";
import { previewSyllabusCsv } from "../app/syllabus-import.ts";

const parseDate = (examDate) => parseSavedState(JSON.stringify({ subjects: [], examDate })).examDate;

test("keeps valid calendar dates, including leap days", () => {
  assert.equal(parseDate("2024-02-29"), "2024-02-29");
});

test("discards impossible or malformed exam dates from backups", () => {
  for (const value of ["2026-02-31", "2025-02-29", "2026-13-01", "2026-00-10", "2026-04-00", "2026/04/01"]) {
    assert.equal(parseDate(value), "", value);
  }
});

test("counts calendar days correctly across daylight-saving changes", () => {
  assert.equal(calendarDaysUntil("2026-11-02", new Date(2026, 10, 1).getTime()), 1);
  assert.equal(calendarDaysUntil("2026-03-09", new Date(2026, 2, 8).getTime()), 1);
});

test("migrates older topics to normal priority and validates saved priorities", () => {
  const state = parseSavedState(JSON.stringify({ subjects: [{
    id: "math", name: "Math", topics: [
      { id: "old", title: "Older backup topic", minutes: 20, done: false },
      { id: "new", title: "Current topic", minutes: 15, done: false, priority: "high" },
      { id: "bad", title: "Invalid priority", minutes: 10, done: false, priority: "urgent" },
    ],
  }] }));
  assert.deepEqual(state.subjects[0].topics.map((topic) => topic.priority), ["medium", "high", "medium"]);
});

test("builds a priority-first daily plan within its time budget without completing topics", () => {
  const state = parseSavedState(JSON.stringify({ subjects: [{
    id: "math", name: "Math", topics: [
      { id: "large", title: "Long high priority", minutes: 30, done: false, priority: "high" },
      { id: "short", title: "Short high priority", minutes: 15, done: false, priority: "high" },
      { id: "medium", title: "Medium priority", minutes: 20, done: false, priority: "medium" },
      { id: "small", title: "Small low priority", minutes: 5, done: false, priority: "low" },
      { id: "done", title: "Already done", minutes: 5, done: true, priority: "high" },
    ],
  }] }));
  const plan = buildDailyPlan(state.subjects, 25);
  assert.deepEqual(plan.map((topic) => topic.id), ["short", "small"]);
  assert.equal(plan.reduce((sum, topic) => sum + topic.minutes, 0), 20);
  assert.equal(plan.some((topic) => topic.done), false);
  assert.equal(state.subjects[0].topics.find((topic) => topic.id === "done").done, true);
});

test("caps an oversized fallback sprint at the daily budget without changing saved estimates", () => {
  const subjects = [{ id: "math", name: "Math", color: "", note: "", topics: [
    { id: "large", title: "Long topic", minutes: 90, done: false, priority: "high" },
  ] }];
  const plan = buildDailyPlan(subjects, 25);
  assert.equal(plan[0].minutes, 25);
  assert.equal(subjects[0].topics[0].minutes, 90);
  assert.deepEqual(buildDailyPlan(subjects, 0), []);
});

test("exports a quoted daily plan and neutralizes spreadsheet formulas", () => {
  const plan = buildDailyPlan([{ id: "math", name: "Math, Advanced", color: "", note: "", topics: [
    { id: "x", title: '=IMPORT("bad")', minutes: 25, done: false, priority: "high" },
  ] }], 25);
  assert.equal(buildDailyPlanCsv(plan), '"Subject","Topic","Minutes","Priority"\r\n"Math, Advanced","\'=IMPORT(""bad"")","25","high"');
});

test("completed focus sessions update local study days and a consecutive streak only", () => {
  const state = parseSavedState(JSON.stringify({ subjects: [], focusSessions: 4, studyDays: ["2026-04-09"] }));
  const next = recordFocusSession(state, "2026-04-10");
  const today = new Date(2026, 3, 10, 12).getTime();
  assert.equal(next.focusSessions, 5);
  assert.deepEqual(next.studyDays, ["2026-04-09", "2026-04-10"]);
  assert.equal(currentStudyStreak(next.studyDays, today), 2);
  assert.equal(recentStudyWeek(next.studyDays, today).filter((day) => day.studied).length, 2);
  assert.equal(currentStudyStreak(next.studyDays, new Date(2026, 3, 12, 12).getTime()), 0);
  assert.equal(recordFocusSession(next, "not-a-date"), next);
});

test("tracks completed focus minutes per day without mutating prior state", () => {
  const state = parseSavedState(JSON.stringify({ subjects: [], focusSessions: 4, studyDays: [] }));
  const first = recordFocusSession(state, "2026-04-10", 15);
  const next = recordFocusSession(first, "2026-04-10", 25);
  assert.equal(focusMinutesForDay(next, "2026-04-10"), 40);
  assert.equal(focusMinutesForDay(state, "2026-04-10"), 0);
  assert.equal(next.focusSessions, 6);
  assert.equal(recordFocusSession(next, "2026-04-10", 0), next);
  assert.equal(recordFocusSession(next, "2026-04-10", 300).focusMinutesByDay[0].minutes, 160);
});

test("migrates older backups and safely normalizes daily focus history", () => {
  const old = parseSavedState(JSON.stringify({ subjects: [] }));
  assert.deepEqual(old.focusMinutesByDay, []);
  const restored = parseSavedState(JSON.stringify({ subjects: [], focusMinutesByDay: [
    { date: "2026-04-10", minutes: 20 },
    { date: "2026-04-10", minutes: 35 },
    { date: "2026-02-31", minutes: 99 },
    { date: "2026-04-11", minutes: -2 },
  ] }));
  assert.equal(focusMinutesForDay(restored, "2026-04-10"), 55);
  assert.equal(restored.focusMinutesByDay.length, 1);
});

test("repairs duplicate subject and topic ids in imported backups", () => {
  const restored = parseSavedState(JSON.stringify({
    subjects: [
      { id: "same", name: "Math", topics: [{ id: "same-topic", title: "Algebra" }] },
      { id: "same", name: "Science", topics: [
        { id: "same-topic", title: "Cells" },
        { id: "same-topic", title: "Energy" },
      ] },
    ],
  }));

  assert.equal(new Set(restored.subjects.map((subject) => subject.id)).size, 2);
  for (const subject of restored.subjects) {
    assert.equal(new Set(subject.topics.map((topic) => topic.id)).size, subject.topics.length);
  }
});

test("validates versioned study backups and summarizes replacement contents", () => {
  const backup = {
    format: "last-minute-study-backup",
    version: 1,
    state: { subjects: [{ id: "math", name: "Math", note: "Review", topics: [{ id: "algebra", title: "Algebra" }] }] },
  };
  const state = readStudyBackup(backup);

  assert.ok(state);
  assert.equal(summarizeStudyBackup(state), "1 subject, 1 topic, 1 note");
  assert.equal(readStudyBackup({ ...backup, version: 2 }), null);
  assert.equal(readStudyBackup({ ...backup, state: { subjects: "not a list" } }), null);
  assert.equal(readStudyBackup(null), null);
});

test("previews quoted syllabus CSV, defaults blank priorities, and skips existing and repeated topics", () => {
  const state = parseSavedState(JSON.stringify({ subjects: [{ id: "math", name: "Math", topics: [{ id: "existing", title: "Existing topic" }] }] }));
  const csv = [
    "Subject,Topic,Minutes,Priority",
    'Math,"Limits, continuity",25,high',
    "Chemistry,Bonding,15,",
    'Math,"limits, continuity",25,high',
    "Math,Existing topic,20,low",
    "Math,Too short,2,high",
    "Math,Extra columns,20,high,ignored",
  ].join("\r\n");
  const preview = previewSyllabusCsv(csv, state.subjects);

  assert.deepEqual(preview.items.map(({ subject, title, priority }) => [subject, title, priority]), [
    ["Math", "Limits, continuity", "high"],
    ["Chemistry", "Bonding", "medium"],
  ]);
  assert.equal(preview.duplicates, 2);
  assert.equal(preview.invalidRows, 2);
  assert.match(preview.issues[1], /four columns/);
});

test("rejects malformed headers, malformed quotes, oversized files, and excessive rows", () => {
  const empty = [];
  assert.match(previewSyllabusCsv("Subject,Topic\nMath,Algebra", empty).error, /columns in order/);
  assert.match(previewSyllabusCsv('Subject,Topic,Minutes,Priority\nMath,"Broken,20,high', empty).error, /format is invalid/);
  assert.match(previewSyllabusCsv("x".repeat(1_000_001), empty).error, /1 MB/);
  const rows = ["Subject,Topic,Minutes,Priority", ...Array.from({ length: 501 }, (_, index) => `S,Topic ${index},20,medium`)];
  assert.match(previewSyllabusCsv(rows.join("\n"), empty).error, /500 topic rows/);
});

test("enforces subject and topic caps during preview and merge", () => {
  const fullSubjects = Array.from({ length: 12 }, (_, index) => ({
    id: `subject-${index}`,
    name: `Subject ${index}`,
    color: "",
    topics: Array.from({ length: index === 0 ? 40 : 0 }, (_, topic) => ({
      id: `topic-${topic}`, title: `Existing ${topic}`, minutes: 25, done: false, priority: "medium",
    })),
    note: "",
  }));
  const csv = ["Subject,Topic,Minutes,Priority", "Subject 0,Another,25,high", "New subject,First,25,low"].join("\n");
  const preview = previewSyllabusCsv(csv, fullSubjects);
  assert.equal(preview.items.length, 0);
  assert.equal(preview.invalidRows, 2);

  const merged = mergeImportedTopics(parseSavedState(JSON.stringify({ subjects: [{ id: "math", name: "Math", note: "Keep this", topics: [{ id: "done", title: "Done topic", done: true }] }] })), [
    { subject: "Math", title: "New topic", minutes: 30, priority: "high" },
    { subject: "Science", title: "Cells", minutes: 20, priority: "medium" },
  ]);
  assert.equal(merged.subjects[0].note, "Keep this");
  assert.equal(merged.subjects[0].topics[0].done, true);
  assert.deepEqual(merged.subjects.map((subject) => [subject.name, subject.topics.length]), [["Math", 2], ["Science", 1]]);
  assert.equal(new Set(merged.subjects.map((subject) => subject.id)).size, 2);
});
