import { site } from "@/lib/site";

// The publication's name as the masthead sets it, with the "s" in Jackson
// drawn as a dollar sign (.dollar-s in globals.css). Every letter stays plain
// text, so screen readers, search engines and copy and paste still get
// "The Jackson Wire".
export default function Wordmark() {
  const at = site.name.indexOf("Jackson");
  if (at === -1) return <>{site.name}</>;
  const s = at + "Jack".length;
  return (
    <>
      {site.name.slice(0, s)}
      <span className="dollar-s">s</span>
      {site.name.slice(s + 1)}
    </>
  );
}
