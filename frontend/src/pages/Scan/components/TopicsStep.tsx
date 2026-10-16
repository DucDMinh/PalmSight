import React from "react";
import {
  ReadingSchool,
  READING_SCHOOLS,
  LIFE_ASPECTS,
} from "@palmsight/shared";

interface TopicsStepProps {
  school: ReadingSchool;
  isAllTopics: boolean;
  selectedSections: string[];
  selectedAspects: string[];
  onChange: (isAll: boolean, sections: string[], aspects: string[]) => void;
}

export const TopicsStep: React.FC<TopicsStepProps> = ({
  school,
  isAllTopics,
  selectedSections,
  selectedAspects,
  onChange,
}) => {
  const currentSchool = READING_SCHOOLS[school];
  const allSectionKeys = currentSchool.sections.map((s) => s.key);
  const allAspectKeys = LIFE_ASPECTS.map((a) => a.key);

  const totalPossible = allSectionKeys.length + allAspectKeys.length;
  const currentSelectedCount = isAllTopics
    ? totalPossible
    : selectedSections.length + selectedAspects.length;

  const handleToggleAll = () => {
    if (isAllTopics) {
      // User is unchecking "Bói toàn bộ": uncheck the last aspect so they can customize
      const newAspects = allAspectKeys.slice(0, -1);
      onChange(false, allSectionKeys, newAspects);
    } else {
      // User is checking "Bói toàn bộ"
      onChange(true, allSectionKeys, [...allAspectKeys]);
    }
  };

  const handleToggleSection = (key: string) => {
    let nextSections: string[];
    const nextAspects = isAllTopics ? [...allAspectKeys] : [...selectedAspects];

    if (isAllTopics) {
      // If was all, now unchecking this section
      nextSections = allSectionKeys.filter((k) => k !== key);
    } else {
      if (selectedSections.includes(key)) {
        nextSections = selectedSections.filter((k) => k !== key);
      } else {
        nextSections = [...selectedSections, key];
      }
    }

    const isAllNow =
      nextSections.length === allSectionKeys.length &&
      nextAspects.length === allAspectKeys.length;

    onChange(isAllNow, nextSections, nextAspects);
  };

  const handleToggleAspect = (key: string) => {
    const nextSections = isAllTopics ? [...allSectionKeys] : [...selectedSections];
    let nextAspects: string[];

    if (isAllTopics) {
      // If was all, now unchecking this aspect
      nextAspects = allAspectKeys.filter((k) => k !== key);
    } else {
      if (selectedAspects.includes(key)) {
        nextAspects = selectedAspects.filter((k) => k !== key);
      } else {
        nextAspects = [...selectedAspects, key];
      }
    }

    const isAllNow =
      nextSections.length === allSectionKeys.length &&
      nextAspects.length === allAspectKeys.length;

    onChange(isAllNow, nextSections, nextAspects);
  };

  const isSectionSelected = (key: string) =>
    isAllTopics || selectedSections.includes(key);

  const isAspectSelected = (key: string) =>
    isAllTopics || selectedAspects.includes(key);

  return (
    <div className="flex flex-col mb-8">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-hairline">
        <h2 className="font-heading-md text-heading-md text-ink m-0 font-bold">
          2. Mục muốn bói
        </h2>
        <span className="font-code-sm text-code-sm text-mute font-mono">SYS::OPT_02</span>
      </div>

      {/* Checkbox Bói toàn bộ */}
      <button
        type="button"
        onClick={handleToggleAll}
        className="font-heading-md text-heading-md text-ink py-1 flex items-center gap-2 cursor-pointer select-none text-left focus:outline-none"
        data-testid="toggle-all-topics"
      >
        <span className="font-mono">{isAllTopics ? "[x] " : "[ ] "}</span>
        <span>Bói toàn bộ</span>
      </button>

      {/* Nhóm 1: Đường chỉ & dấu hiệu theo trường phái */}
      <div className="font-body-sm text-body-sm text-mute mt-3 mb-2 font-medium">
        Đường chỉ & dấu hiệu ({currentSchool.name.replace("Chỉ tay ", "").toLowerCase()})
      </div>
      <div className="flex flex-col space-y-1">
        {currentSchool.sections.map((section) => {
          const checked = isSectionSelected(section.key);
          return (
            <button
              key={section.key}
              type="button"
              onClick={() => handleToggleSection(section.key)}
              className={`py-0.5 text-left text-sm flex items-center gap-2 cursor-pointer select-none font-mono focus:outline-none transition-colors ${
                isAllTopics ? "text-ash hover:text-ink" : checked ? "text-ink font-medium" : "text-mute hover:text-ink"
              }`}
              data-testid={`topic-section-${section.key}`}
            >
              <span>{checked ? "[x]" : "[ ]"}</span>
              <span className="font-sans text-sm">{section.title}</span>
            </button>
          );
        })}
      </div>

      {/* Nhóm 2: Khía cạnh cuộc sống */}
      <div className="font-body-sm text-body-sm text-mute mt-4 mb-2 font-medium">
        Khía cạnh cuộc sống
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {LIFE_ASPECTS.map((aspect) => {
          const checked = isAspectSelected(aspect.key);
          return (
            <button
              key={aspect.key}
              type="button"
              onClick={() => handleToggleAspect(aspect.key)}
              className={`py-0.5 text-left text-sm flex items-center gap-2 cursor-pointer select-none font-mono focus:outline-none transition-colors ${
                isAllTopics ? "text-ash hover:text-ink" : checked ? "text-ink font-medium" : "text-mute hover:text-ink"
              }`}
              data-testid={`topic-aspect-${aspect.key}`}
            >
              <span>{checked ? "[x]" : "[ ]"}</span>
              <span className="font-sans text-sm">{aspect.label}</span>
            </button>
          );
        })}
      </div>

      {currentSelectedCount === 0 && (
        <p className="font-body-sm text-danger text-sm mt-3" data-testid="no-topics-warning">
          [!] Chọn ít nhất 1 mục
        </p>
      )}
    </div>
  );
};

export default TopicsStep;
