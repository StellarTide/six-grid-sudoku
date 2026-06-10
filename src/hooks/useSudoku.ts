import { useState, useCallback, useRef } from "react";
import { SixSudoku } from "../engine/SixSudoku";
import type { Board, Difficulty, Hint } from "../engine/types";

const DIFFICULTY_EMPTY_COUNT: Record<Difficulty, number> = {
  easy: 10,
  medium: 16,
  hard: 22,
};

const engine = new SixSudoku();

interface GameState {
  board: Board;
  puzzle: Board;
  solution: Board;
}

export function useSudoku() {
  const [gameState, setGameState] = useState<GameState>(() =>
    createNewGame("easy"),
  );
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(
    null,
  );
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [isCompleted, setIsCompleted] = useState(false);
  // Incremented on every history-affecting action so the UI can read stack lengths
  const [historyVersion, setHistoryVersion] = useState(0);

  const undoStack = useRef<Board[]>([]);
  const redoStack = useRef<Board[]>([]);

  const { board, puzzle, solution } = gameState;

  // Compute error cells: user-filled cells that don't match solution
  const errorCells = new Set<string>();
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 6; c++) {
      if (puzzle[r][c] === 0 && board[r][c] !== 0 && board[r][c] !== solution[r][c]) {
        errorCells.add(`${r}-${c}`);
      }
    }
  }

  const pushHistory = useCallback((currentBoard: Board) => {
    undoStack.current.push(currentBoard.map((row) => [...row]));
    redoStack.current = [];
    setHistoryVersion((v) => v + 1);
  }, []);

  const selectCell = useCallback((row: number, col: number) => {
    setSelectedCell([row, col]);
  }, []);

  const fillNumber = useCallback(
    (num: number) => {
      if (!selectedCell) return;
      const [r, c] = selectedCell;
      if (puzzle[r][c] !== 0) return;
      if (board[r][c] === num) return;

      pushHistory(board);

      const newBoard = board.map((row) => [...row]);
      newBoard[r][c] = num;

      const completed = engine.isCompleted(newBoard);
      setGameState((prev) => ({ ...prev, board: newBoard }));
      setIsCompleted(completed);
    },
    [selectedCell, puzzle, board, pushHistory],
  );

  const eraseNumber = useCallback(() => {
    if (!selectedCell) return;
    const [r, c] = selectedCell;
    if (puzzle[r][c] !== 0 || board[r][c] === 0) return;

    pushHistory(board);

    const newBoard = board.map((row) => [...row]);
    newBoard[r][c] = 0;
    setGameState((prev) => ({ ...prev, board: newBoard }));
    setIsCompleted(false);
  }, [selectedCell, puzzle, board, pushHistory]);

  const undo = useCallback(() => {
    if (undoStack.current.length === 0) return;
    const prev = undoStack.current.pop()!;
    redoStack.current.push(board.map((row) => [...row]));
    setGameState((state) => ({ ...state, board: prev }));
    setIsCompleted(false);
    setHistoryVersion((v) => v + 1);
  }, [board]);

  const redo = useCallback(() => {
    if (redoStack.current.length === 0) return;
    const next = redoStack.current.pop()!;
    undoStack.current.push(board.map((row) => [...row]));
    setGameState((state) => ({ ...state, board: next }));
    const completed = engine.isCompleted(next);
    setIsCompleted(completed);
    setHistoryVersion((v) => v + 1);
  }, [board]);

  const getHint = useCallback((): Hint | null => {
    const hint = engine.getHint(board);
    if (!hint) return null;

    pushHistory(board);
    const newBoard = board.map((row) => [...row]);
    newBoard[hint.row][hint.col] = hint.value;
    setGameState((prev) => ({ ...prev, board: newBoard }));
    setSelectedCell([hint.row, hint.col]);

    const completed = engine.isCompleted(newBoard);
    setIsCompleted(completed);

    return hint;
  }, [board, pushHistory]);

  const newGame = useCallback(
    (diff?: Difficulty) => {
      const d = diff ?? difficulty;
      setGameState(createNewGame(d));
      setSelectedCell(null);
      setIsCompleted(false);
      undoStack.current = [];
      redoStack.current = [];
      setHistoryVersion((v) => v + 1);
      if (diff) setDifficulty(diff);
    },
    [difficulty],
  );

  return {
    board,
    puzzle,
    solution,
    selectedCell,
    difficulty,
    isCompleted,
    errorCells,
    canUndo: undoStack.current.length > 0,
    canRedo: redoStack.current.length > 0,
    // Include historyVersion so the returned canUndo/canRedo values
    // are recomputed reactively whenever the stacks change.
    historyVersion,
    selectCell,
    fillNumber,
    eraseNumber,
    undo,
    redo,
    getHint,
    newGame,
  };
}

function createNewGame(difficulty: Difficulty): GameState {
  const { puzzle, solution } = engine.generate(
    DIFFICULTY_EMPTY_COUNT[difficulty],
    true,
  );
  return {
    board: puzzle.map((row) => [...row]),
    puzzle: puzzle.map((row) => [...row]),
    solution,
  };
}
