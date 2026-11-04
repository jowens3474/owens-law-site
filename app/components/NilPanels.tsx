import Link from "next/link";
import { courtShort, outcomeLabel } from "@/lib/rulings";
import { formatDate } from "@/lib/posts";
import {
  getNilLaws,
  getNilRulings,
  NIL_CASES,
  NIL_DISCLAIMER,
  NIL_GUIDE,
} from "@/lib/nil";

const h2 =
  "border-b border-ink pb-1 font-sans text-xs font-bold uppercase tracking-widest text-ink";
const empty = "py-4 font-sans text-muted";

// The NIL blocks under the stories on /sports/nil: laws, court rulings, cases
// to know, and a teaser for the guide once it has content.
export default function NilPanels() {
  const laws = getNilLaws();
  const rulings = getNilRulings();

  return (
    <div className="mt-10 space-y-10">
      <section aria-labelledby="nil-laws">
        <h2 id="nil-laws" className={h2}>
          NIL laws
        </h2>
        {laws.length === 0 ? (
          <p className={empty}>No NIL laws explained yet. Check back soon.</p>
        ) : (
          <>
            <ol className="divide-y divide-rule">
              {laws.map((law) => (
                <li key={law.slug} className="py-5">
                  <p className="font-sans text-[0.72rem] font-bold uppercase tracking-wider text-crimson">
                    {law.bill}
                  </p>
                  <h3 className="mt-1 font-serif text-2xl font-bold leading-tight">
                    <Link href={`/laws/${law.slug}`} className="headline-link">
                      {law.title}
                    </Link>
                  </h3>
                  <p className="mt-2 font-sans text-base leading-relaxed text-muted">
                    {law.oneSentence}
                  </p>
                </li>
              ))}
            </ol>
            <p className="font-sans text-sm">
              <Link
                href="/laws?topic=Sports%20and%20NIL"
                className="font-semibold text-crimson"
              >
                All NIL laws
              </Link>
            </p>
          </>
        )}
      </section>

      <section aria-labelledby="nil-rulings">
        <h2 id="nil-rulings" className={h2}>
          NIL court rulings
        </h2>
        {rulings.length === 0 ? (
          <p className={empty}>No NIL court rulings explained yet. Check back soon.</p>
        ) : (
          <ol className="divide-y divide-rule">
            {rulings.map((ruling) => (
              <li key={ruling.slug} className="py-5">
                <p className="font-sans text-[0.72rem] font-bold uppercase tracking-wider text-crimson">
                  {courtShort(ruling.court)}
                  <span className="font-medium text-muted">
                    {" "}
                    · {ruling.docket} · Decided {formatDate(ruling.decided)}
                  </span>
                </p>
                <h3 className="mt-1 font-serif text-2xl font-bold leading-tight">
                  <Link href={`/rulings/${ruling.slug}`} className="headline-link">
                    {ruling.title}
                  </Link>
                </h3>
                <p className="mt-2 font-sans text-base leading-relaxed text-muted">
                  {ruling.oneSentence}
                </p>
                <p className="mt-2 font-sans text-sm text-ink">
                  <span className="text-[0.7rem] font-bold uppercase tracking-wider text-muted">
                    Result:
                  </span>{" "}
                  <span className="font-semibold">{outcomeLabel(ruling.outcome)}</span>
                </p>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section aria-labelledby="nil-cases">
        <h2 id="nil-cases" className={h2}>
          Cases to know
        </h2>
        {NIL_CASES.length === 0 ? (
          <p className={empty}>No cases listed yet. Check back soon.</p>
        ) : (
          <ol className="divide-y divide-rule">
            {NIL_CASES.map((c) => (
              <li key={c.name} className="py-5">
                <p className="font-sans text-[0.72rem] font-bold uppercase tracking-wider text-crimson">
                  {c.court}
                  <span className="font-medium text-muted">
                    {" "}
                    · {formatDate(c.date)}
                  </span>
                </p>
                <h3 className="mt-1 font-serif text-2xl font-bold leading-tight">
                  <a
                    href={c.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="headline-link"
                  >
                    {c.name}
                  </a>
                </h3>
                <p className="mt-2 font-sans text-base leading-relaxed text-muted">
                  {c.oneSentence}
                </p>
                <p className="mt-2 font-sans text-sm text-ink">
                  <span className="text-[0.7rem] font-bold uppercase tracking-wider text-muted">
                    Status:
                  </span>{" "}
                  <span className="font-semibold">{c.status}</span>
                </p>
              </li>
            ))}
          </ol>
        )}
      </section>

      {NIL_GUIDE.sections.length > 0 && (
        <section aria-labelledby="nil-guide">
          <h2 id="nil-guide" className={h2}>
            The NIL guide
          </h2>
          <p className="py-4 font-sans text-base leading-relaxed text-muted">
            {NIL_GUIDE.intro}{" "}
            <Link href="/sports/nil/guide" className="font-semibold text-crimson">
              Read the guide
            </Link>
          </p>
        </section>
      )}

      <p className="border-t border-rule pt-4 font-sans text-sm leading-relaxed text-muted">
        {NIL_DISCLAIMER}
      </p>
    </div>
  );
}
