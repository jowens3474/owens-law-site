import { test } from "node:test";
import assert from "node:assert/strict";
import { midSignupAfter, MID_SIGNUP_MIN_PARAGRAPHS } from "./mid-signup.ts";

const plain = (n) => Array.from({ length: n }, (_, i) => `Paragraph ${i + 1} of the story.`);

test("short stories get no mid-story box", () => {
  for (let n = 0; n < MID_SIGNUP_MIN_PARAGRAPHS; n++) {
    assert.equal(midSignupAfter(plain(n)), null, `${n} paragraphs`);
  }
});

test("a story at the minimum length gets the box after paragraph three", () => {
  assert.equal(midSignupAfter(plain(MID_SIGNUP_MIN_PARAGRAPHS)), 3);
  assert.equal(midSignupAfter(plain(12)), 3);
});

test("a third paragraph ending in a colon moves the box up", () => {
  const body = plain(8);
  body[2] = "The board listed three conditions:";
  assert.equal(midSignupAfter(body), 2);
});

test("a count lead-in at the end of paragraph three moves the box up", () => {
  const body = plain(8);
  body[2] = "The hearing ran two hours. A few things worth noting from the call.";
  assert.equal(midSignupAfter(body), 2);
});

test("a count in the middle of paragraph three does not move the box", () => {
  const body = plain(8);
  body[2] = "Three things changed in the budget last year. The council voted Tuesday to keep them.";
  assert.equal(midSignupAfter(body), 3);
});

test("a First, Second run across the slot gets no box when both slots would split it", () => {
  const body = plain(8);
  body[1] = "The ruling did two things for the defense.";
  body[2] = "First, it kept the entrapment claim alive.";
  body[3] = "Second, it left the central legal question open.";
  // Slot 3 would sit between First and Second; slot 2 between the lead-in and First.
  assert.equal(midSignupAfter(body), null);
});

test("a run that starts at paragraph four moves the box above the lead-in", () => {
  const body = plain(9);
  body[2] = "The judge gave several reasons.";
  body[3] = "First, the statute is plain.";
  assert.equal(midSignupAfter(body), 2);
});

test("ordinary words that begin like ordinals do not count", () => {
  const body = plain(8);
  body[3] = "Firstly-named streets were repaved, the city said.";
  assert.equal(midSignupAfter(body), 3);
  body[3] = "Secondary roads were next.";
  assert.equal(midSignupAfter(body), 3);
});
