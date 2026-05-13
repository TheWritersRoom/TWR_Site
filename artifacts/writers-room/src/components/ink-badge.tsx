import { Droplets } from "lucide-react";

type Props = {
  balance: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
};

export function InkBadge({ balance, size = "md", showLabel = true }: Props) {
  const formatted = balance.toLocaleString();

  if (size === "sm") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#1A1614]">
        <Droplets className="w-3 h-3 text-[#E8B84B]" />
        <span className="text-[10px] font-bold text-[#F9F6EE] tracking-[0.06em]">{formatted}</span>
        {showLabel && (
          <span className="text-[9px] uppercase tracking-[0.12em] text-[#E8B84B] font-bold">ink</span>
        )}
      </span>
    );
  }

  if (size === "lg") {
    return (
      <div className="flex flex-col items-center gap-0.5">
        <div className="flex items-center gap-1.5">
          <Droplets className="w-5 h-5 text-[#E8B84B]" />
          <span className="text-3xl font-serif font-bold text-[#1A1614]">{formatted}</span>
        </div>
        {showLabel && (
          <p className="text-[9px] uppercase tracking-[0.22em] font-bold text-[#7A6B5E]">Ink Balance</p>
        )}
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1A1614]">
      <Droplets className="w-3.5 h-3.5 text-[#E8B84B]" />
      <span className="text-sm font-bold text-[#F9F6EE]">{formatted}</span>
      {showLabel && (
        <span className="text-[9px] uppercase tracking-[0.14em] font-bold text-[#E8B84B]">ink</span>
      )}
    </div>
  );
}
