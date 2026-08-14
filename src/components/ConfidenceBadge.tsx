export default function ConfidenceBadge({ score }: { score: number }) {
  let label: string;
  let color: string;

  if (score >= 70) {
    label = "High";
    color = "text-trust-green bg-green-50 border-green-200";
  } else if (score >= 40) {
    label = "Medium";
    color = "text-trust-yellow bg-yellow-50 border-yellow-200";
  } else {
    label = "Low";
    color = "text-trust-gray bg-slate-50 border-slate-200";
  }

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${color}`}>
      Evidence confidence: {label}
    </span>
  );
}
