import type { Board, Notes } from "../engine/types";
import { SudokuCell } from "./SudokuCell";

interface SudokuBoardProps {
  board: Board;
  puzzle: Board;
  notes: Notes;
  selectedCell: [number, number] | null;
  errorCells: Set<string>;
  onCellClick: (row: number, col: number) => void;
}

export function SudokuBoard({
  board,
  puzzle,
  notes,
  selectedCell,
  errorCells,
  onCellClick,
}: SudokuBoardProps) {
  const [selRow, selCol] = selectedCell ?? [-1, -1];

  const selBoxRow = Math.floor(selRow / 2) * 2;
  const selBoxCol = Math.floor(selCol / 3) * 3;
  const selectedValue = selRow >= 0 ? board[selRow][selCol] : 0;

  return (
    <div className="grid grid-cols-6 border-[3px] border-slate-700 rounded-lg overflow-hidden w-full max-w-[360px] mx-auto">
      {board.map((row, r) =>
        row.map((value, c) => {
          const isSelected = r === selRow && c === selCol;
          const isHighlighted =
            selRow >= 0 &&
            !isSelected &&
            (r === selRow ||
              c === selCol ||
              (r >= selBoxRow &&
                r < selBoxRow + 2 &&
                c >= selBoxCol &&
                c < selBoxCol + 3));

          const isSameNumber =
            selectedValue !== 0 && value === selectedValue && !isSelected;
          const cellNotes = notes[`${r}-${c}`] ?? [];

          return (
            <SudokuCell
              key={`${r}-${c}`}
              value={value}
              isInitial={puzzle[r][c] !== 0}
              isSelected={isSelected}
              isHighlighted={isHighlighted}
              isSameNumber={isSameNumber}
              isError={errorCells.has(`${r}-${c}`)}
              notes={cellNotes}
              row={r}
              col={c}
              onClick={onCellClick}
            />
          );
        }),
      )}
    </div>
  );
}
