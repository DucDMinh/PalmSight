import React from "react";
import { ReadingSchool, READING_SCHOOL_LIST } from "@palmsight/shared";

interface SchoolStepProps {
  selectedSchool: ReadingSchool;
  onSelectSchool: (school: ReadingSchool) => void;
}

export const SchoolStep: React.FC<SchoolStepProps> = ({
  selectedSchool,
  onSelectSchool,
}) => {
  return (
    <div className="flex flex-col mb-8">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-hairline">
        <h2 className="font-heading-md text-heading-md text-ink m-0 font-bold">
          1. Trường phái
        </h2>
        <span className="font-code-sm text-code-sm text-mute font-mono">SYS::OPT_01</span>
      </div>
      <div className="flex flex-col gap-2">
        {READING_SCHOOL_LIST.map((school) => {
          const isSelected = selectedSchool === school.id;
          return (
            <button
              key={school.id}
              type="button"
              onClick={() => onSelectSchool(school.id)}
              className={`w-full text-left p-3 rounded-lg border transition-colors focus:outline-none cursor-pointer ${
                isSelected
                  ? "border-ink bg-canvas shadow-none"
                  : "border-hairline bg-transparent hover:bg-surface-soft"
              }`}
            >
              <div className="font-heading-md text-heading-md text-ink leading-tight font-medium">
                {isSelected ? "(x) " : "( ) "}
                {school.name}
              </div>
              <div className="font-body-sm text-body-sm text-mute mt-1 leading-tight">
                {school.description}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SchoolStep;
