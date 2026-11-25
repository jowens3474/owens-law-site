import Link from "next/link";
import { GUIDES } from "@/lib/guides";

// The "More Jackson Guides" box at the foot of each guide page: every guide in
// lib/guides.ts except the one being read.
export default function MoreGuides({
  current,
  headingClassName,
}: {
  // The href of the page this box sits on, so it does not link to itself.
  current: string;
  headingClassName: string;
}) {
  const others = GUIDES.filter((g) => g.href !== current);
  if (others.length === 0) return null;
  return (
    <section className="mt-14">
      <h2 className={headingClassName}>More Jackson Guides</h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {others.map((g) => (
          <li key={g.href} className="border border-rule bg-paper p-4">
            <Link
              href={g.href}
              className="font-serif text-base font-bold hover:text-crimson"
            >
              {g.crossLabel}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
