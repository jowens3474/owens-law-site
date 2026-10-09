"use client";

import { useSyncExternalStore } from "react";
import { editionDate } from "@/lib/edition";

const subscribeNoop = () => () => {};

// The server renders the date it had at build or revalidation time; once the
// page is on a reader's screen the client takes over and shows today's date
// in Jackson, so a page built on Monday never greets a Friday reader with
// Monday's date.
export default function EditionDate({ initial }: { initial: string }) {
  const text = useSyncExternalStore(subscribeNoop, editionDate, () => initial);
  return <span>{text}</span>;
}
