export default function Stars({ rating = 5 }: { rating?: number }) {
  return (
    <span
      className="text-gold"
      aria-label={`${rating} out of 5 stars`}
      role="img"
    >
      {"★".repeat(rating)}
      <span className="text-rule">{"★".repeat(Math.max(0, 5 - rating))}</span>
    </span>
  );
}
