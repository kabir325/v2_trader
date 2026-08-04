import React, { useState } from "react";
import { HelpCircle } from "lucide-react";

interface InfoTooltipProps {
  text: string;
  title?: string;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({ text, title }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-flex items-center ml-1 z-20">
      <button
        type="button"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={() => setIsOpen(!isOpen)}
        className="text-slate-500 hover:text-emerald-400 focus:outline-none transition-colors p-0.5 rounded"
        aria-label="Info"
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-900 border border-slate-700 rounded-xl shadow-xl text-xs text-slate-200 z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
          {title && <p className="font-bold text-emerald-400 mb-1 text-[11px]">{title}</p>}
          <p className="text-[11px] leading-relaxed text-slate-300 font-sans">{text}</p>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-700" />
        </div>
      )}
    </div>
  );
};
