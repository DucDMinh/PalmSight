import React from "react";
import { LIFE_ASPECTS_MAP, LifeAspect } from "@palmsight/shared";

interface AspectsBlockProps {
  aspects?: Record<string, string> | null;
}

export const AspectsBlock: React.FC<AspectsBlockProps> = ({ aspects }) => {
  if (!aspects || Object.keys(aspects).length === 0) return null;

  return (
    <section className="pt-6 pb-6 border-b border-hairline text-left" data-testid="reading-aspects-block">
      <h3 className="font-heading-md text-heading-md text-ink pb-1 mb-4 border-b border-hairline font-bold">
        Khía cạnh cuộc sống
      </h3>
      <div className="space-y-3">
        {Object.entries(aspects).map(([key, content]) => {
          const aspectConfig = LIFE_ASPECTS_MAP[key as LifeAspect];
          const label = aspectConfig ? aspectConfig.label : key;

          return (
            <p key={key} className="font-body-md text-body-md text-body leading-relaxed m-0" data-testid={`aspect-${key}`}>
              <span className="font-heading-md text-heading-md text-ink font-bold font-mono">
                [+] {label}{" "}
              </span>
              {content}
            </p>
          );
        })}
      </div>
    </section>
  );
};

export default AspectsBlock;
