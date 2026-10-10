import { unstable_cache } from "next/cache";

// Caps how long the not-found render of a `revalidate = false` page is cached,
// by lowering that render's revalidate to an hour. Await it only for scheduled
// (future-dated) slugs, so junk URLs keep the long cache and are not
// re-rendered hourly. unstable_cache is used because this project has not
// opted into Cache Components (lib/pro-live.ts uses it the same way); if the
// project ever opts in, replace it with `use cache` and cacheLife.
export const capNotFoundLife = unstable_cache(async () => true, ["cap-not-found-life"], { revalidate: 3600 });
