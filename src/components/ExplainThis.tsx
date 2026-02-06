import React, { useState } from 'react';
import { Info, ChevronDown, ChevronUp } from 'lucide-react';

interface ExplainThisProps {
  bullets: string[];
}

export const ExplainThis: React.FC<ExplainThisProps> = ({ bullets }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mb-6 overflow-hidden rounded-xl border border-brand-primary/20 bg-brand-primary/5">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-brand-primary/10"
      >
        <div className="flex items-center gap-2 text-sm font-bold text-brand-primary">
          <Info className="h-4 w-4" />
          <span>Explain this</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-brand-primary" />
        ) : (
          <ChevronDown className="h-4 w-4 text-brand-primary" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-200">
          <ul className="space-y-2">
            {bullets.map((bullet, index) => (
              <li key={index} className="flex gap-2 text-sm text-neutral-300">
                <span className="text-brand-primary mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand-primary" />
                {bullet}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
