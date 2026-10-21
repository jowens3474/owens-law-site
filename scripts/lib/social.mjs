// The Wire's public social links, for scripts that link to them (the
// newsletter so far). The URLs live in lib/social.json, which the website also
// reads, so a change such as a new Page username is a one-line edit there.
// Never hard-code one of these URLs in a script.
import { readFileSync } from "node:fs";

const { facebook } = JSON.parse(
  readFileSync(new URL("../../lib/social.json", import.meta.url), "utf8"),
);
if (typeof facebook !== "string" || !/^https:\/\/\S+$/.test(facebook)) {
  throw new Error("lib/social.json must hold an https:// URL in \"facebook\".");
}

export const FACEBOOK_URL = facebook;
