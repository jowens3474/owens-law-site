// The editor's assignment list for the news desk, and the pure queue logic
// around it. The list is data/assignments.json, an array of
//   { id, topic, angle, type, sources, addedBy, addedAt, skips }
// The autopilot works the first usable item before it picks a topic of its
// own. A finished item is removed. A skipped item moves to the back with
// skips raised by one and is dropped on its second skip, the way the laws
// desk rotates a queue entry that keeps failing.
//
// This lives apart from scripts/autopilot.mjs because that file runs its
// main() the moment it is imported, which would make these functions
// impossible to test alone. Nothing here changes the list it is handed: each
// function returns a new one.

import { readFileSync, writeFileSync } from "node:fs";

export const ASSIGNMENTS_FILE = "data/assignments.json";
// An item skipped this many times is dropped.
export const MAX_SKIPS = 2;

// The five story types, with the plain-words meaning the prompt shows beside
// each. They match the tie-breaker line in the autopilot's TOPIC SELECTION.
export const ASSIGNMENT_TYPES = {
  opening: "what is opening, closing, or being built",
  money: "money out of readers' pockets: bills, taxes, fees",
  explainer: "a plain explainer people search for",
  sale: "who bought what",
  vote: "a vote before it happens",
};

const text = (v) => (typeof v === "string" ? v.trim() : "");
const skipsOf = (item) =>
  Number.isInteger(item?.skips) && item.skips > 0 ? item.skips : 0;
const indexOfId = (items, id) => items.findIndex((a) => a && a.id === id);

// Reason text goes into the log and the commit message, so keep it to one
// short line with no dashes (the house style, and the model sometimes adds
// them).
function tidy(s, max = 120) {
  // En dash and em dash, by code point so this file contains neither.
  const dashes = String.fromCharCode(0x2013, 0x2014);
  let plain = "";
  for (const c of String(s ?? "")) plain += dashes.includes(c) ? ", " : c;
  return plain.replace(/\s+,/g, ",").replace(/\s+/g, " ").trim().slice(0, max);
}

// Returns { items, problem }. A missing file is an empty list. A file that
// cannot be read, or is not a JSON array, also gives an empty list with the
// reason in `problem`, so a typo in the list never stops the desk from
// publishing. The autopilot writes the file back only after it has picked an
// item from it, so a broken file is left alone for the editor to fix.
export function readAssignments(file = ASSIGNMENTS_FILE) {
  let raw;
  try {
    raw = readFileSync(file, "utf8");
  } catch (e) {
    if (e?.code === "ENOENT") return { items: [], problem: null };
    return { items: [], problem: `could not read ${file}: ${e.message}` };
  }
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return { items: [], problem: `${file} is not a JSON array` };
    }
    return { items: parsed, problem: null };
  } catch (e) {
    return { items: [], problem: `${file} is not valid JSON: ${e.message}` };
  }
}

export function writeAssignments(items, file = ASSIGNMENTS_FILE) {
  writeFileSync(file, JSON.stringify(items, null, 2) + "\n");
}

// An item the desk can work has an id (so it can be found again) and a topic.
// Anything else is left in the list untouched for the editor to fix.
function isUsable(item) {
  return (
    !!item &&
    typeof item === "object" &&
    text(item.id) !== "" &&
    text(item.topic) !== ""
  );
}

// The first usable item, or null when there is nothing to work.
export function pickAssignment(items) {
  if (!Array.isArray(items)) return null;
  return items.find(isUsable) ?? null;
}

// The item is done: remove it.
export function completeAssignment(items, id) {
  const i = indexOfId(items, id);
  return i === -1 ? [...items] : items.filter((_, j) => j !== i);
}

// Move the item to the back of the list, applying `changes` to it.
export function rotateAssignment(items, id, changes = {}) {
  const i = indexOfId(items, id);
  if (i === -1) return [...items];
  return [...items.filter((_, j) => j !== i), { ...items[i], ...changes }];
}

// The item was set aside: raise skips by one and move it to the back, or drop
// it once it has been skipped MAX_SKIPS times. Returns { items, skips,
// dropped }.
export function skipAssignment(items, id) {
  const i = indexOfId(items, id);
  if (i === -1) return { items: [...items], skips: 0, dropped: false };
  const skips = skipsOf(items[i]) + 1;
  if (skips >= MAX_SKIPS) {
    return { items: completeAssignment(items, id), skips, dropped: true };
  }
  return { items: rotateAssignment(items, id, { skips }), skips, dropped: false };
}

// Reads the model's assignmentOutcome. "done" means the story was written;
// "skipped: <reason>" means it was set aside. A missing or unclear outcome
// counts as a skip, so a story that may not be the assignment never removes
// it from the list.
export function parseOutcome(raw) {
  const s = typeof raw === "string" ? raw.trim() : "";
  if (/^done\b/i.test(s)) return { status: "done", reason: "" };
  const m = s.match(/^skipped\b[:\s]*(.*)$/i);
  if (m) return { status: "skipped", reason: tidy(m[1]) || "no reason given" };
  return {
    status: "skipped",
    reason: s ? `unclear outcome: ${tidy(s, 80)}` : "no outcome reported",
  };
}

// Applies the model's outcome to the list. status is "done", "skipped" (moved
// to the back), or "dropped" (second skip).
export function applyOutcome(items, id, rawOutcome) {
  const outcome = parseOutcome(rawOutcome);
  if (outcome.status === "done") {
    return {
      items: completeAssignment(items, id),
      status: "done",
      reason: "",
      skips: 0,
    };
  }
  const r = skipAssignment(items, id);
  return {
    items: r.items,
    status: r.dropped ? "dropped" : "skipped",
    reason: outcome.reason,
    skips: r.skips,
  };
}

// One line for the log and the commit message body.
export function describeOutcome(id, result) {
  if (result.status === "done") {
    return `Assignment ${id}: done. Removed from ${ASSIGNMENTS_FILE}.`;
  }
  const count = `skipped (${result.skips} of ${MAX_SKIPS})`;
  const where =
    result.status === "dropped"
      ? `Dropped from ${ASSIGNMENTS_FILE}.`
      : `Moved to the back of ${ASSIGNMENTS_FILE}.`;
  return `Assignment ${id}: ${count}. ${where} Reason: ${result.reason}`;
}

// The labeled block added to the autopilot's user prompt. The sources are
// starting points, not proof, and the fact rules, the rotation rule, and the
// caps all apply to the assignment exactly as they do to any other story.
export function assignmentPrompt(item) {
  const type = text(item.type);
  const hint = Object.hasOwn(ASSIGNMENT_TYPES, type) ? ASSIGNMENT_TYPES[type] : "";
  const sources = (Array.isArray(item.sources) ? item.sources : [])
    .map(text)
    .filter((s) => /^https?:\/\//i.test(s));
  return [
    "TODAY'S ASSIGNMENT",
    "The editor put this story on the desk's list. Work it before the open-ended research order above.",
    `Topic: ${text(item.topic)}`,
    `Angle: ${text(item.angle) || "none given"}`,
    `Type: ${type ? (hint ? `${type} (${hint})` : type) : "not given"}`,
    "Sources to open first (fetch_url):",
    ...(sources.length ? sources.map((s) => `- ${s}`) : ["- none listed"]),
    "",
    "How to work it:",
    "1. Open the sources, then find the underlying document: the agenda, filing, notice, permit, contract, or dataset. The sources are where to start, not proof. Every concrete claim must still trace to a tool result you saw in this conversation, and every fact rule above applies unchanged.",
    '2. If the documents support a new, verifiable story on this assignment, write it and set assignmentOutcome to "done".',
    '3. If they do not (nothing new on the record, the key document does not exist yet, a recent Wire story already covers it, or the rotation rule or a cap above bars it today), do not force it. Choose a story by normal TOPIC SELECTION and set assignmentOutcome to "skipped: <short reason>".',
    "4. The beat rotation rules above, including the corruption-case and Politics caps, apply to this assignment like any other story.",
  ].join("\n");
}
