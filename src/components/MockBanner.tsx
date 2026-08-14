import { FlaskConical } from "lucide-react";

export default function MockBanner() {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 flex items-center gap-2 text-sm text-amber-700">
      <FlaskConical className="w-4 h-4" />
      <span>Demo analysis — detection provider not connected. Results are simulated.</span>
    </div>
  );
}
