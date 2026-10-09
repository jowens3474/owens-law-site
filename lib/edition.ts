// Today's date as the masthead prints it, in the newsroom's time zone. The
// servers run on UTC, which is five or six hours ahead of Jackson; without
// the time zone the masthead flipped to tomorrow every evening.
export function editionDate(now = new Date()): string {
  return now.toLocaleDateString("en-US", {
    timeZone: "America/Chicago",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
