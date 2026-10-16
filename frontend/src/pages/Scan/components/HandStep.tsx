import React from "react";
import { HandOrientation, ReadingSchool } from "@palmsight/shared";

interface HandStepProps {
  school: ReadingSchool;
  hand: HandOrientation;
  onSelectHand: (hand: HandOrientation) => void;
}

export const HandStep: React.FC<HandStepProps> = ({
  school,
  hand,
  onSelectHand,
}) => {
  return (
    <div className="flex flex-col mb-6">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-hairline">
        <h2 className="font-heading-md text-heading-md text-ink m-0 font-bold">
          3. Tay
        </h2>
        <span className="font-code-sm text-code-sm text-mute font-mono">SYS::OPT_03</span>
      </div>

      <div className="flex items-center gap-6 font-body-strong text-body-strong text-ink">
        <button
          type="button"
          onClick={() => onSelectHand(HandOrientation.LEFT)}
          className="flex items-center gap-2 cursor-pointer select-none font-mono focus:outline-none"
          data-testid="hand-left"
        >
          <span>{hand === HandOrientation.LEFT ? "(x) " : "( ) "}</span>
          <span className="font-sans">Tay trái</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectHand(HandOrientation.RIGHT)}
          className="flex items-center gap-2 cursor-pointer select-none font-mono focus:outline-none"
          data-testid="hand-right"
        >
          <span>{hand === HandOrientation.RIGHT ? "(x) " : "( ) "}</span>
          <span className="font-sans">Tay phải</span>
        </button>
      </div>

      {school === ReadingSchool.EASTERN && (
        <div className="font-body-sm text-body-sm text-mute mt-3" data-testid="eastern-hand-hint">
          [i] Nam xem tay trái, nữ xem tay phải.
        </div>
      )}

      {/* Footer / Cost meta */}
      <div className="mt-6 pt-4 border-t border-hairline">
        <p className="font-body-sm text-body-sm text-mute m-0 leading-normal">
          [i] Giá 1 credit, dù chọn bao nhiêu mục
        </p>
      </div>
    </div>
  );
};

export default HandStep;
