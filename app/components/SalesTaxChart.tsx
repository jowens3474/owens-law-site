"use client";

import { useState } from "react";

export interface ChartPoint {
  month: string; // yyyy-mm
  amount: number;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function short(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return `${MONTHS[m - 1]} '${String(y).slice(2)}`;
}
function long(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return `${["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][m - 1]} ${y}`;
}
function compact(n: number): string {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1)}M`;
  if (n >= 1e3) return `$${Math.round(n / 1e3)}K`;
  return `$${Math.round(n)}`;
}
function full(n: number): string {
  return "$" + Math.round(n).toLocaleString("en-US");
}

/**
 * Single-series column chart: one city's monthly diversion, oldest to
 * newest. Thin columns with a rounded data end and a square baseline,
 * hairline gridlines, direct labels on the latest and highest columns,
 * and a hover/focus tooltip on every column. The table below the chart is
 * the accessible view of the same numbers.
 */
export default function SalesTaxChart({ points, city }: { points: ChartPoint[]; city: string }) {
  const [active, setActive] = useState<number | null>(null);
  if (points.length === 0) return null;

  const W = 720;
  const H = 260;
  const padL = 52;
  const padR = 12;
  const padT = 28;
  const padB = 34;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const max = Math.max(...points.map((p) => p.amount));
  // Round the axis top up to a clean step.
  const step = niceStep(max / 4);
  const top = Math.ceil(max / step) * step;
  const band = plotW / points.length;
  const barW = Math.min(24, band * 0.7);
  const x = (i: number) => padL + band * i + (band - barW) / 2;
  const y = (v: number) => padT + plotH - (v / top) * plotH;
  const lastIdx = points.length - 1;
  // Label the latest column and the highest one, unless they are neighbors
  // (the labels would collide) or the same column.
  const rawMaxIdx = points.findIndex((p) => p.amount === max);
  const maxIdx = Math.abs(rawMaxIdx - lastIdx) < 3 ? lastIdx : rawMaxIdx;
  const ticks = [0, 1, 2, 3, 4].map((k) => (top / 4) * k);
  const labelEvery = points.length > 14 ? 3 : points.length > 8 ? 2 : 1;
  const priorOf = (i: number) => points.find((p) => p.month === shift(points[i].month, -12));

  return (
    <figure className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`${city} monthly sales tax diversions, ${long(points[0].month)} to ${long(points[lastIdx].month)}. Latest ${full(points[lastIdx].amount)}.`}
        className="h-auto w-full font-sans"
        onMouseLeave={() => setActive(null)}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} stroke="var(--color-rule)" strokeWidth="1" />
            <text x={padL - 6} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--color-muted)">
              {compact(t)}
            </text>
          </g>
        ))}
        {points.map((p, i) => {
          const h = Math.max(0, y(0) - y(p.amount));
          const r = Math.min(4, barW / 2, h);
          const isActive = active === i;
          const labeled = i === lastIdx || i === maxIdx;
          return (
            <g key={p.month}>
              {/* Hit target wider than the mark */}
              <rect
                x={padL + band * i}
                y={padT}
                width={band}
                height={plotH}
                fill="transparent"
                tabIndex={0}
                aria-label={`${long(p.month)}: ${full(p.amount)}`}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
              />
              <path
                d={`M${x(i)},${y(0)} L${x(i)},${y(p.amount) + r} Q${x(i)},${y(p.amount)} ${x(i) + r},${y(p.amount)} L${x(i) + barW - r},${y(p.amount)} Q${x(i) + barW},${y(p.amount)} ${x(i) + barW},${y(p.amount) + r} L${x(i) + barW},${y(0)} Z`}
                fill="var(--color-crimson)"
                opacity={active === null || isActive ? 1 : 0.55}
                pointerEvents="none"
              />
              {labeled && !isActive && (
                <text x={x(i) + barW / 2} y={y(p.amount) - 6} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--color-ink)">
                  {compact(p.amount)}
                </text>
              )}
              {i % labelEvery === 0 && (
                <text x={x(i) + barW / 2} y={H - padB + 16} textAnchor="middle" fontSize="11" fill="var(--color-muted)">
                  {short(p.month)}
                </text>
              )}
            </g>
          );
        })}
        <line x1={padL} x2={W - padR} y1={y(0)} y2={y(0)} stroke="var(--color-ink)" strokeWidth="1" />
      </svg>
      {active !== null && (
        <div
          role="status"
          className="pointer-events-none absolute left-1/2 top-2 -translate-x-1/2 border border-ink bg-newsprint px-3 py-2 font-sans text-xs shadow-sm"
        >
          <span className="font-bold">{long(points[active].month)}</span>: {full(points[active].amount)}
          {(() => {
            const prior = priorOf(active);
            if (!prior) return null;
            const ch = ((points[active].amount - prior.amount) / prior.amount) * 100;
            return (
              <span className="text-muted">
                {" "}
                · {ch >= 0 ? "+" : ""}
                {ch.toFixed(1)}% vs a year earlier
              </span>
            );
          })()}
        </div>
      )}
      <figcaption className="mt-2 font-sans text-xs text-muted">
        {city}, monthly sales tax diversion paid by the state, oldest to newest. Hover or tab to a column for the figure.
      </figcaption>
    </figure>
  );
}

function niceStep(raw: number): number {
  const pow = Math.pow(10, Math.floor(Math.log10(raw || 1)));
  const n = raw / pow;
  const s = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return s * pow;
}

function shift(ym: string, n: number): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}
