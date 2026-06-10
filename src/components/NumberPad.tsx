import type { Board } from "../engine/types";

interface NumberPadProps {
  board: Board;
  onFill: (num: number) => void;
  onErase: () => void;
}

export function NumberPad({ board, onFill, onErase }: NumberPadProps) {
  // Count how many of each digit are already placed
  const digitCounts = new Array(7).fill(0); // index 0 unused
  for (const row of board) {
    for (const cell of row) {
      if (cell >= 1 && cell <= 6) {
        digitCounts[cell]++;
      }
    }
  }

  return (
    <div className="flex items-center justify-center gap-2 flex-wrap">
      {[1, 2, 3, 4, 5, 6].map((num) => {
        const remaining = 6 - digitCounts[num];
        const isComplete = remaining === 0;
        return (
          <button
            key={num}
            type="button"
            onClick={() => onFill(num)}
            disabled={isComplete}
            className={`
              w-12 h-12 sm:w-14 sm:h-14 rounded-xl text-xl sm:text-2xl font-bold
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
            {!isComplete && (
              <span className="text-[10px] font-normal opacity-70">
                {remaining}
              </span>
            )}
          </button>
        );
      })}
      <button
        type="button"
        onClick={onErase}
        className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl text-xl sm:text-2xl
          bg-slate-100 text-slate-500 hover:bg-slate-200 active:bg-slate-300
          flex items-center justify-center transition-colors duration-100
          select-none cursor-pointer"
      >
        ✕
      </button>
    </div>
  );
}
