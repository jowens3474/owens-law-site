import { site } from "@/lib/site";

// Decorative stand-in for article art. No external images, so each story gets a
// deterministic tinted "plate" with the publication monogram, like a newspaper
// placeholder cut.
const TINTS: [string, string][] = [
  ["#2b2b3a", "#4a4a63"],
  ["#3a2226", "#7a2d34"],
  ["#22332e", "#3c5a4e"],
  ["#33291c", "#5e4a30"],
  ["#1f2a33", "#37505f"],
  ["#2e2433", "#4f3c5a"],
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
            className="font-serif font-black text-white/80 select-none"
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
        <span className="absolute bottom-2 left-2 bg-black/45 px-2 py-0.5 text-[0.7rem] font-semibold uppercase tracking-widest text-white">
          {label}
        </span>
      )}
    </div>
  );
}
