import { useState, useCallback, useRef, useEffect } from "react";
import { SixSudoku } from "../engine/SixSudoku";
import type {
  Board,
  Difficulty,
  Hint,
  SaveData,
  GameStats,
} from "../engine/types";
import { loadSave, saveSave, loadStats, saveStats } from "../utils/storage";

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

// --- URL hash helpers for share ---

function decodePuzzleFromHash(): Board | null {
  const hash = window.location.hash;
  if (!hash.startsWith("#p=")) return null;
  const encoded = hash.slice(3);
  if (encoded.length !== 36) return null;
  const board: Board = [];
  for (let r = 0; r < 6; r++) {
    const row: number[] = [];
    for (let c = 0; c < 6; c++) {
      const ch = encoded[r * 6 + c];
      const n = parseInt(ch, 10);
      if (isNaN(n) || n < 0 || n > 6) return null;
      row.push(n);
    }
    board.push(row);
  }
  return board;
}

function encodePuzzle(puzzle: Board): string {
  return puzzle.flat().join("");
}

function getPuzzleFromBoard(puzzleBoard: Board): GameState {
  // Try to solve the puzzle to get the solution
  const copied = puzzleBoard.map((row) => [...row]);
  const solution = engine.solve(copied);
  if (!solution) {
    // Fallback: generate a new game if puzzle is unsolvable
    return createNewGame("easy");
  }
  return {
    board: puzzleBoard.map((row) => [...row]),
    puzzle: puzzleBoard.map((row) => [...row]),
    solution,
  };
}

// --- Hook ---

export function useSudoku() {
  const [gameState, setGameState] = useState<GameState>(() => {
    // Priority: URL hash > localStorage > new game
    const hashPuzzle = decodePuzzleFromHash();
    if (hashPuzzle) {
      // Clear the hash so refresh starts fresh
      window.history.replaceState(null, "", window.location.pathname);
      return getPuzzleFromBoard(hashPuzzle);
    }
    const saved = loadSave();
    if (saved) {
      return {
        board: saved.board,
        puzzle: saved.puzzle,
        solution: saved.solution,
      };
    }
    return createNewGame("easy");
  });

  const [difficulty, setDifficulty] = useState<Difficulty>(() => {
    const saved = loadSave();
    return saved?.difficulty ?? "easy";
  });

  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(
    null,
  );
  const [isCompleted, setIsCompleted] = useState<boolean>(() => {
    const saved = loadSave();
    return saved?.isCompleted ?? false;
  });
  const [historyVersion, setHistoryVersion] = useState(0);

  // Track whether the current game was already counted as "played"
  const [gameCounted, setGameCounted] = useState(() => {
    const saved = loadSave();
    return saved !== null;
  });

  const [stats, setStats] = useState<GameStats>(() => loadStats());

  const undoStack = useRef<Board[]>([]);
  const redoStack = useRef<Board[]>([]);

  // Restore stacks from save on first load
  useEffect(() => {
    const saved = loadSave();
    if (saved) {
      undoStack.current = saved.undoStack;
      redoStack.current = saved.redoStack;
    }
  }, []);

  // Reading ref.current during render is intentional here — the value is
  // derived from historyVersion which changes synchronously with the stacks.
  // eslint-disable-next-line react-hooks/refs
  const canUndo = undoStack.current.length > 0;
  // eslint-disable-next-line react-hooks/refs
  const canRedo = redoStack.current.length > 0;

  const { board, puzzle, solution } = gameState;

  // Persist to localStorage whenever board changes
  useEffect(() => {
    const data: SaveData = {
      board,
      puzzle,
      solution,
      difficulty,
      undoStack: undoStack.current,
      redoStack: redoStack.current,
      isCompleted,
    };
    saveSave(data);
  }, [board, puzzle, solution, difficulty, isCompleted]);

  // Error cells
  const errorCells = new Set<string>();
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 6; c++) {
      if (
        puzzle[r][c] === 0 &&
        board[r][c] !== 0 &&
        board[r][c] !== solution[r][c]
      ) {
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
      if (!selectedCell || isCompleted) return;
      const [r, c] = selectedCell;
      if (puzzle[r][c] !== 0) return;
      if (board[r][c] === num) return;

      pushHistory(board);

      const newBoard = board.map((row) => [...row]);
      newBoard[r][c] = num;

      const completed = engine.isCompleted(newBoard);
      setGameState((prev) => ({ ...prev, board: newBoard }));
      setIsCompleted(completed);

      if (completed) {
        setStats((prev) => {
          const next = {
            ...prev,
            totalCompleted: prev.totalCompleted + 1,
            currentStreak: prev.currentStreak + 1,
            bestStreak: Math.max(prev.bestStreak, prev.currentStreak + 1),
          };
          if (difficulty === "easy") next.easyCompleted++;
          else if (difficulty === "medium") next.mediumCompleted++;
          else next.hardCompleted++;
          saveStats(next);
          return next;
        });
      }
    },
    [selectedCell, puzzle, board, pushHistory, isCompleted, difficulty],
  );

  const eraseNumber = useCallback(() => {
    if (!selectedCell || isCompleted) return;
    const [r, c] = selectedCell;
    if (puzzle[r][c] !== 0 || board[r][c] === 0) return;

    pushHistory(board);

    const newBoard = board.map((row) => [...row]);
    newBoard[r][c] = 0;
    setGameState((prev) => ({ ...prev, board: newBoard }));
  }, [selectedCell, puzzle, board, pushHistory, isCompleted]);

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
    if (isCompleted) return null;
    const hint = engine.getHint(board);
    if (!hint) return null;

    pushHistory(board);
    const newBoard = board.map((row) => [...row]);
    newBoard[hint.row][hint.col] = hint.value;
    setGameState((prev) => ({ ...prev, board: newBoard }));
    setSelectedCell([hint.row, hint.col]);

    const completed = engine.isCompleted(newBoard);
    setIsCompleted(completed);

    if (completed) {
      setStats((prev) => {
        const next = {
          ...prev,
          totalCompleted: prev.totalCompleted + 1,
          currentStreak: prev.currentStreak + 1,
          bestStreak: Math.max(prev.bestStreak, prev.currentStreak + 1),
        };
        if (difficulty === "easy") next.easyCompleted++;
        else if (difficulty === "medium") next.mediumCompleted++;
        else next.hardCompleted++;
        saveStats(next);
        return next;
      });
    }

    return hint;
  }, [board, pushHistory, isCompleted, difficulty]);

  const newGame = useCallback(
    (diff?: Difficulty) => {
      const d = diff ?? difficulty;

      // If current game was not completed, break streak
      if (gameCounted && !isCompleted) {
        setStats((prev) => {
          const next = { ...prev, currentStreak: 0 };
          saveStats(next);
          return next;
        });
      }

      setGameState(createNewGame(d));
      setSelectedCell(null);
      setIsCompleted(false);
      undoStack.current = [];
      redoStack.current = [];
      setHistoryVersion((v) => v + 1);
      if (diff) setDifficulty(diff);

      // Count as a new game played
      setStats((prev) => {
        const next = { ...prev, totalPlayed: prev.totalPlayed + 1 };
        saveStats(next);
        return next;
      });
      setGameCounted(true);
    },
    [difficulty, gameCounted, isCompleted],
  );

  const sharePuzzle = useCallback((): string => {
    const encoded = encodePuzzle(puzzle);
    const base = window.location.origin + window.location.pathname;
    return `${base}#p=${encoded}`;
  }, [puzzle]);

  return {
    board,
    puzzle,
    solution,
    selectedCell,
    difficulty,
    isCompleted,
    errorCells,
    canUndo,
    canRedo,
    historyVersion,
    stats,
    selectCell,
    fillNumber,
    eraseNumber,
    undo,
    redo,
    getHint,
    newGame,
    sharePuzzle,
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
