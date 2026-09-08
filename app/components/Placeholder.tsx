import { site } from "@/lib/site";

// Decorative stand-in for article art. No external images, so each story gets a
// deterministic tinted "plate" with the publication monogram, like a newspaper
// placeholder cut.
const TINTS: [string, string][] = [
  ["#f3f3f3", "#e6e6e6"],
  ["#f5efe9", "#e8dcd0"],
  ["#eef2f5", "#d9e2ea"],
  ["#f2efe6", "#e2dbc6"],
  ["#eef1ee", "#dbe4db"],
  ["#f1eef2", "#e2dbe4"],
];

function hash(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export default function Placeholder({
  seed,
  label,
  className = "",
  monogram = true,
}: {
  seed: string;
  label?: string;
  className?: string;
  monogram?: boolean;
}) {
  const [from, to] = TINTS[hash(seed) % TINTS.length];
  return (
    <div
      aria-hidden
      className={`relative overflow-hidden ${className}`}
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, #fff 0 1px, transparent 1px 9px)",
        }}
      />
      {monogram && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="font-serif font-black text-ink/60 select-none"
            style={{ fontSize: "clamp(2rem, 8vw, 4.5rem)" }}
          >
            {site.shortName
              .split(" ")
              .map((w) => w[0])
              .join("")}
          </span>
        </div>
      )}
      {label && (
        <span className="absolute bottom-2 left-2 bg-ink px-2 py-0.5 text-[0.7rem] font-semibold uppercase tracking-widest text-newsprint">
          {label}
        </span>
      )}
    </div>
  );
}
