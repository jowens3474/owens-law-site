import { site } from "./site";

export const absoluteUrl = (path = "/"): string =>
  new URL(path, site.url).toString();
