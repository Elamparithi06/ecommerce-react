export default function RatingStars({ value }) {
  const full = Math.round(value);
  return (
    <div className="flex text-amber-400">
      {Array.from({ length: 5 }).map((_, index) => (
        <span key={index} className={index < full ? "opacity-100" : "opacity-25"}>
          ★
        </span>
      ))}
    </div>
  );
}
