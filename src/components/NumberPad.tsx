import { X, PenLine } from "lucide-react";
import type { Board, GameMode } from "../engine/types";

interface NumberPadProps {
  mode: GameMode;
  board: Board;
  isNotesMode: boolean;
  onFill: (num: number) => void;
  onErase: () => void;
  onToggleNote: (row: number, col: number, num: number) => void;
  selectedCell: [number, number] | null;
}

export function NumberPad({
  mode,
  board,
  isNotesMode,
  onFill,
  onErase,
  onToggleNote,
  selectedCell,
}: NumberPadProps) {
  const digitCounts = new Array(7).fill(0);
  for (const row of board) {
    for (const cell of row) {
      if (cell >= 1 && cell <= 6) {
        digitCounts[cell]++;
      }
    }
  }

  const handleNumClick = (num: number) => {
    if (isNotesMode && selectedCell) {
      onToggleNote(selectedCell[0], selectedCell[1], num);
    } else {
      onFill(num);
    }
  };

  return (
    <div className="flex items-center justify-center gap-1.5 sm:gap-2.5">
      {[1, 2, 3, 4, 5, 6].map((num) => {
        const remaining = 6 - digitCounts[num];
        const isComplete = mode === "play" && remaining === 0;
        return (
          <button
            key={num}
            type="button"
            onClick={() => handleNumClick(num)}
            disabled={isComplete && !isNotesMode}
            className={`
              w-[44px] h-[44px] sm:w-14 sm:h-14 rounded-xl text-xl sm:text-2xl font-bold
              flex flex-col items-center justify-center
              transition-all duration-100 select-none
              ${
                isComplete && !isNotesMode
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed"
                  : isNotesMode
                    ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50 active:bg-amber-300 cursor-pointer shadow-sm border-2 border-dashed border-amber-400 dark:border-amber-600"
                    : "bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700 cursor-pointer shadow-sm"
              }
            `}
          >
            <span>{num}</span>
            {mode === "play" && !isComplete && !isNotesMode && (
              <span className="text-[9px] sm:text-[10px] font-normal opacity-70">
                {remaining}
              </span>
            )}
            {isNotesMode && <PenLine size={10} className="opacity-60" />}
          </button>
        );
      })}
      <button
        type="button"
        onClick={onErase}
        data-testid="erase-button"
        className="w-[44px] h-[44px] sm:w-14 sm:h-14 rounded-xl text-xl sm:text-2xl
          bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 active:bg-slate-300 dark:active:bg-slate-600
          flex items-center justify-center transition-colors duration-100
          select-none cursor-pointer"
      >
        <X size={20} />
      </button>
    </div>
  );
}
