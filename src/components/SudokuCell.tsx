interface SudokuCellProps {
  value: number;
  isInitial: boolean;
  isSelected: boolean;
  isHighlighted: boolean;
  isSameNumber: boolean;
  isError: boolean;
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
  row,
  col,
  onClick,
}: SudokuCellProps) {
  // Determine border thickness for box separation (2x3 grid)
  const borderRight = col === 2 || col === 5 ? "border-r-[3px]" : "";
  const borderBottom = row === 1 || row === 3 ? "border-b-[3px]" : "";
  const borderLeft = col === 0 ? "border-l-[3px]" : "";
  const borderTop = row === 0 ? "border-t-[3px]" : "";
  const borderRightLast = col === 5 ? "border-r-[3px]" : "";
  const borderBottomLast = row === 5 ? "border-b-[3px]" : "";

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

  let textClass = "text-slate-800";
  if (isError) {
    textClass = "text-red-500 font-bold";
  } else if (isInitial) {
    textClass = "text-slate-900 font-semibold";
  } else {
    textClass = "text-blue-600 font-medium";
  }

  return (
    <button
      type="button"
      className={`
        aspect-square flex items-center justify-center
        text-xl sm:text-2xl select-none cursor-pointer
        border border-slate-300
        ${borderTop} ${borderBottom} ${borderBottomLast}
        ${borderLeft} ${borderRight} ${borderRightLast}
        ${bgClass} ${textClass}
        transition-colors duration-100
        hover:bg-blue-50 active:bg-blue-100
      `}
      onClick={() => onClick(row, col)}
    >
      {value !== 0 ? value : ""}
    </button>
  );
}
