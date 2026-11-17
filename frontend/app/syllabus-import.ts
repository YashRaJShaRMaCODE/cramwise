import type { Subject, TopicPriority } from "./study-state";

export type SyllabusImportItem = { subject: string; title: string; minutes: number; priority: TopicPriority };
export type SyllabusImportPreview = {
  items: SyllabusImportItem[];
  invalidRows: number;
  duplicates: number;
  issues: string[];
  error: string;
};

const MAX_CSV_SIZE = 1_000_000;
const MAX_CSV_ROWS = 500;

function parseCsvRows(input: string): string[][] | null {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  let afterQuote = false;

  for (let index = 0; index < input.length; index++) {
    const char = input[index];
    if (quoted) {
      if (char === '"' && input[index + 1] === '"') {
        field += '"';
        index++;
      } else if (char === '"') {
        quoted = false;
        afterQuote = true;
      } else if (char === "\r" && input[index + 1] === "\n") {
        field += "\n";
        index++;
      } else field += char;
      continue;
    }

    if (afterQuote && char !== "," && char !== "\r" && char !== "\n" && !/\s/.test(char)) return null;
    if (char === '"') {
      if (field) return null;
      quoted = true;
    } else if (char === ",") {
      row.push(field.trim());
      field = "";
      afterQuote = false;
    } else if (char === "\r" || char === "\n") {
      if (char === "\r" && input[index + 1] === "\n") index++;
      row.push(field.trim());
      if (row.some((cell) => cell)) rows.push(row);
      row = [];
      field = "";
      afterQuote = false;
      if (rows.length > MAX_CSV_ROWS + 1) return null;
    } else {
      if (afterQuote && /\s/.test(char)) continue;
      field += char;
    }
  }

  if (quoted) return null;
  row.push(field.trim());
  if (row.some((cell) => cell)) rows.push(row);
  return rows.length <= MAX_CSV_ROWS + 1 ? rows : null;
}

export function previewSyllabusCsv(input: string, subjects: Subject[]): SyllabusImportPreview {
  const empty = (error = ""): SyllabusImportPreview => ({ items: [], invalidRows: 0, duplicates: 0, issues: [], error });
  if (input.length > MAX_CSV_SIZE) return empty("CSV files must be 1 MB or smaller.");
  const rows = parseCsvRows(input.replace(/^\uFEFF/, ""));
  if (!rows) return empty("CSV format is invalid or has more than 500 topic rows.");
  const header = rows[0]?.map((cell) => cell.toLowerCase());
  if (header?.join(",") !== "subject,topic,minutes,priority") {
    return empty("Use these columns in order: Subject, Topic, Minutes, Priority.");
  }

  const names = new Map<string, string>();
  const topicCounts = new Map<string, number>();
  const seenTopics = new Set<string>();
  for (const subject of subjects) {
    const key = subject.name.trim().toLowerCase();
    if (!names.has(key)) {
      names.set(key, subject.name);
      topicCounts.set(key, subject.topics.length);
    }
    for (const topic of subject.topics) seenTopics.add(`${key}\u0000${topic.title.trim().toLowerCase()}`);
  }

  const items: SyllabusImportItem[] = [];
  const issues: string[] = [];
  let invalidRows = 0;
  let duplicates = 0;
  for (let index = 1; index < rows.length; index++) {
    const cells = rows[index];
    const rowNumber = index + 1;
    const [subjectValue, topicValue, minutesValue, priorityValue] = cells;
    let reason = "";
    if (cells.length !== 4) reason = "Use four columns.";
    else if (!subjectValue || subjectValue.length > 48 || /[\r\n]/.test(subjectValue)) reason = "Subject must be one line and 48 characters or fewer.";
    else if (!topicValue || topicValue.length > 100 || /[\r\n]/.test(topicValue)) reason = "Topic must be one line and 100 characters or fewer.";
    const minutes = Number(minutesValue);
    if (!reason && (!Number.isInteger(minutes) || minutes < 5 || minutes > 120)) reason = "Minutes must be a whole number from 5 to 120.";
    const priority = (priorityValue || "medium").toLowerCase();
    if (!reason && !["high", "medium", "low"].includes(priority)) reason = "Priority must be high, medium, or low.";

    const subjectKey = subjectValue?.toLowerCase();
    if (!reason && !names.has(subjectKey) && names.size >= 12) reason = "This import would exceed the 12-subject limit.";
    if (!reason && (topicCounts.get(subjectKey) || 0) >= 40) reason = "This subject already has 40 topics.";
    if (reason) {
      invalidRows++;
      if (issues.length < 5) issues.push(`Row ${rowNumber}: ${reason}`);
      continue;
    }

    const duplicateKey = `${subjectKey}\u0000${topicValue.toLowerCase()}`;
    if (seenTopics.has(duplicateKey)) {
      duplicates++;
      continue;
    }
    if (!names.has(subjectKey)) names.set(subjectKey, subjectValue);
    topicCounts.set(subjectKey, (topicCounts.get(subjectKey) || 0) + 1);
    seenTopics.add(duplicateKey);
    items.push({ subject: names.get(subjectKey)!, title: topicValue, minutes, priority: priority as TopicPriority });
  }

  return { items, invalidRows, duplicates, issues, error: "" };
}
