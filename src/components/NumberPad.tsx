import { X } from "lucide-react";
import type { Board, GameMode } from "../engine/types";

interface NumberPadProps {
  mode: GameMode;
  board: Board;
  onFill: (num: number) => void;
  onErase: () => void;
}

export function NumberPad({ mode, board, onFill, onErase }: NumberPadProps) {
  const digitCounts = new Array(7).fill(0);
  for (const row of board) {
    for (const cell of row) {
      if (cell >= 1 && cell <= 6) {
        digitCounts[cell]++;
      }
    }
  }

  return (
    <div className="flex items-center justify-center gap-1.5 sm:gap-2.5">
      {[1, 2, 3, 4, 5, 6].map((num) => {
        const remaining = 6 - digitCounts[num];
        const isComplete = mode === "play" && remaining === 0;
        return (
          <button
            key={num}
            type="button"
            onClick={() => onFill(num)}
            disabled={isComplete}
            className={`
              w-[44px] h-[44px] sm:w-14 sm:h-14 rounded-xl text-xl sm:text-2xl font-bold
              flex flex-col items-center justify-center
              transition-all duration-100 select-none
              ${
                isComplete
                  ? "bg-slate-100 text-slate-300 cursor-not-allowed"
                  : "bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700 cursor-pointer shadow-sm"
              }
            `}
          >
            <span>{num}</span>
            {mode === "play" && !isComplete && (
              <span className="text-[9px] sm:text-[10px] font-normal opacity-70">
                {remaining}
              </span>
            )}
          </button>
        );
      })}
      <button
        type="button"
        onClick={onErase}
        data-testid="erase-button"
        className="w-[44px] h-[44px] sm:w-14 sm:h-14 rounded-xl text-xl sm:text-2xl
          bg-slate-100 text-slate-500 hover:bg-slate-200 active:bg-slate-300
          flex items-center justify-center transition-colors duration-100
          select-none cursor-pointer"
      >
        <X size={20} />
      </button>
    </div>
  );
}
