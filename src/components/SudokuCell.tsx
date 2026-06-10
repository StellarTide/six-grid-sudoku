interface SudokuCellProps {
  value: number;
  isInitial: boolean;
  isSelected: boolean;
  isHighlighted: boolean;
  isSameNumber: boolean;
  isError: boolean;
  notes: number[];
  row: number;
  col: number;
  onClick: (row: number, col: number) => void;
}

export function SudokuCell({
  value,
  isInitial,
  isSelected,
  isHighlighted,
  isSameNumber,
  isError,
  notes,
  row,
  col,
  onClick,
}: SudokuCellProps) {
  const thickRight = col === 2 || col === 5;
  const thickBottom = row === 1 || row === 3;
  const thickLeft = col === 0;
  const thickTop = row === 0;

  let bgClass = "bg-white";
  if (isSelected) {
    bgClass = "bg-blue-100";
  } else if (isError) {
    bgClass = "bg-red-50";
  } else if (isSameNumber && value !== 0) {
    bgClass = "bg-blue-50";
  } else if (isHighlighted) {
    bgClass = "bg-slate-50";
  }

  const textClass = isError
    ? "text-red-500 font-bold"
    : isInitial
      ? "text-slate-900 font-semibold"
      : "text-blue-600 font-medium";

  const hasNotes = notes.length > 0;

  return (
    <button
      type="button"
      className={`
        aspect-square flex items-center justify-center relative
        text-lg sm:text-2xl select-none cursor-pointer
        border border-slate-300
        ${thickTop ? "border-t-[3px]" : ""}
        ${thickBottom ? "border-b-[3px]" : ""}
        ${thickLeft ? "border-l-[3px]" : ""}
        ${thickRight ? "border-r-[3px]" : ""}
        ${bgClass} ${textClass}
        transition-colors duration-100
        hover:bg-blue-50 active:bg-blue-100
      `}
      onClick={() => onClick(row, col)}
    >
      {value !== 0 ? (
        value
      ) : hasNotes ? (
        <span className="grid grid-cols-3 gap-0 w-full h-full p-0.5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <span
              key={n}
              className="flex items-center justify-center text-[9px] sm:text-[10px] font-medium text-slate-500 leading-none"
            >
              {notes.includes(n) ? n : ""}
            </span>
          ))}
        </span>
      ) : (
        ""
      )}
    </button>
  );
}
