import { site } from "@/lib/site";

// The publication's name as the masthead sets it, with the "s" in Jackson
// drawn as a dollar sign (.dollar-s in globals.css). Every letter stays plain
// text, so screen readers, search engines and copy and paste still get
// "The Jackson Wire".
export default function Wordmark() {
  const jacksonAt = site.name.indexOf("Jackson");
  if (jacksonAt === -1) return <>{site.name}</>;
  const sAt = jacksonAt + "Jack".length;
  return (
    <>
      {site.name.slice(0, sAt)}
      <span className="dollar-s">s</span>
      {site.name.slice(sAt + 1)}
    </>
  );
}
