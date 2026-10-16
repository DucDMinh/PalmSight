import React from "react";
import type { ReadingSectionResult } from "@palmsight/shared";

interface SectionBlockProps {
  sections?: ReadingSectionResult[] | null;
}

export const SectionBlock: React.FC<SectionBlockProps> = ({ sections }) => {
  if (!sections || sections.length === 0) return null;

  return (
    <div data-testid="reading-sections-block">
      {sections.map((section) => (
        <section
          key={section.key || section.title}
          className="pt-6 pb-6 border-b border-hairline text-left"
          data-testid={`section-${section.key}`}
        >
          <h3 className="font-heading-md text-heading-md text-ink pb-1 mb-2 border-b border-hairline font-bold">
            {section.title}
          </h3>
          <div className="space-y-2">
            <p className="font-body-md text-body-md text-body leading-relaxed m-0">
              <span className="font-heading-md text-heading-md text-ink font-bold font-mono">
                [+] Quan sát{" "}
              </span>
              {section.observation}
            </p>
            <p className="font-body-md text-body-md text-body leading-relaxed m-0">
              <span className="font-heading-md text-heading-md text-ink font-bold font-mono">
                [+] Ý nghĩa{" "}
              </span>
              {section.meaning}
            </p>
          </div>
        </section>
      ))}
    </div>
  );
};

export default SectionBlock;
