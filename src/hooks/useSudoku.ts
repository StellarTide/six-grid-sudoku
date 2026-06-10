import { useState, useCallback, useRef, useEffect } from "react";
import { SixSudoku } from "../engine/SixSudoku";
import type {
  Board,
  Difficulty,
  Hint,
  Notes,
  SaveData,
  GameStats,
  GameMode,
  ValidateResult,
} from "../engine/types";
import { loadSave, saveSave, loadStats, saveStats } from "../utils/storage";

const DIFFICULTY_EMPTY_COUNT: Record<Difficulty, number> = {
  easy: 10,
  medium: 16,
  hard: 22,
};

const engine = new SixSudoku();

function emptyBoard(): Board {
  return Array.from({ length: 6 }, () => Array(6).fill(0));
}

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
  const copied = puzzleBoard.map((row) => [...row]);
  const solution = engine.solve(copied);
  if (!solution) {
    return createNewGame("medium");
  }
  return {
    board: puzzleBoard.map((row) => [...row]),
    puzzle: puzzleBoard.map((row) => [...row]),
    solution,
  };
}

// --- Hook ---

export function useSudoku() {
  const [mode, setMode] = useState<GameMode>("play");

  const [gameState, setGameState] = useState<GameState>(() => {
    const hashPuzzle = decodePuzzleFromHash();
    if (hashPuzzle) {
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
    return createNewGame("medium");
  });

  const [difficulty, setDifficulty] = useState<Difficulty>(() => {
    const saved = loadSave();
    return saved?.difficulty ?? "medium";
  });

  const [createBoard, setCreateBoard] = useState<Board>(() => emptyBoard());
  const [validateResult, setValidateResult] = useState<ValidateResult | null>(
    null,
  );

  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(
    null,
  );
  const [isCompleted, setIsCompleted] = useState<boolean>(() => {
    const saved = loadSave();
    return saved?.isCompleted ?? false;
  });
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [notes, setNotes] = useState<Notes>({});
  const [isNotesMode, setIsNotesMode] = useState(false);
  const [historyVersion, setHistoryVersion] = useState(0);
  const [gameCounted, setGameCounted] = useState(() => {
    const saved = loadSave();
    return saved !== null;
  });

  const [stats, setStats] = useState<GameStats>(() => loadStats());

  const undoStack = useRef<Board[]>([]);
  const redoStack = useRef<Board[]>([]);

  useEffect(() => {
    const saved = loadSave();
    if (saved) {
      undoStack.current = saved.undoStack;
      redoStack.current = saved.redoStack;
    }
  }, []);

  // eslint-disable-next-line react-hooks/refs
  const canUndo = undoStack.current.length > 0;
  // eslint-disable-next-line react-hooks/refs
  const canRedo = redoStack.current.length > 0;

  const { board, puzzle, solution } = gameState;

  // Persist play mode to localStorage
  useEffect(() => {
    if (mode !== "play") return;
    const data: SaveData = {
      board,
      puzzle,
      solution,
      notes,
      difficulty,
      undoStack: undoStack.current,
      redoStack: redoStack.current,
      isCompleted,
    };
    saveSave(data);
  }, [board, puzzle, solution, notes, difficulty, isCompleted, mode]);

  // Error cells (play mode only)
  const errorCells = new Set<string>();
  if (mode === "play") {
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
  }

  const pushHistory = useCallback((currentBoard: Board) => {
    undoStack.current.push(currentBoard.map((row) => [...row]));
    redoStack.current = [];
    setHistoryVersion((v) => v + 1);
  }, []);

  const selectCell = useCallback((row: number, col: number) => {
    setSelectedCell([row, col]);
  }, []);

  // --- Notes helpers ---
  const clearCellNotes = useCallback((row: number, col: number) => {
    setNotes((prev) => {
      const key = `${row}-${col}`;
      if (!(key in prev)) return prev;
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
  }, []);

  const removeNumFromRelatedNotes = useCallback(
    (row: number, col: number, num: number) => {
      setNotes((prev) => {
        const updated = { ...prev };
        for (let c = 0; c < 6; c++) removedNote(updated, `${row}-${c}`, num);
        for (let r = 0; r < 6; r++) removedNote(updated, `${r}-${col}`, num);
        const br = Math.floor(row / 2) * 2;
        const bc = Math.floor(col / 3) * 3;
        for (let r = br; r < br + 2; r++) {
          for (let c = bc; c < bc + 3; c++) {
            removedNote(updated, `${r}-${c}`, num);
          }
        }
        return updated;
      });
    },
    [],
  );

  // --- fillNumber: differs by mode ---
  const fillNumber = useCallback(
    (num: number) => {
      if (!selectedCell) return;

      if (mode === "create") {
        const [r, c] = selectedCell;
        const current = createBoard[r][c];
        if (current === num) return;

        pushHistory(createBoard);
        const next = createBoard.map((row) => [...row]);
        next[r][c] = num;
        setCreateBoard(next);
        setValidateResult(null);
        return;
      }

      // Play mode
      if (isCompleted) return;
      const [r, c] = selectedCell;
      if (puzzle[r][c] !== 0) return;
      if (board[r][c] === num) return;

      pushHistory(board);

      const newBoard = board.map((row) => [...row]);
      newBoard[r][c] = num;

      const completed = engine.isCompleted(newBoard);
      setGameState((prev) => ({ ...prev, board: newBoard }));
      setIsCompleted(completed);

      // Clear notes for this cell and remove num from related cells
      clearCellNotes(r, c);
      removeNumFromRelatedNotes(r, c, num);

      if (completed) {
        setShowCompletionModal(true);
        setStats(bumpStatsCompleted(difficulty));
      }
    },
    [
      mode,
      selectedCell,
      createBoard,
      board,
      puzzle,
      isCompleted,
      difficulty,
      pushHistory,
      clearCellNotes,
      removeNumFromRelatedNotes,
    ],
  );

  // --- eraseNumber ---
  const eraseNumber = useCallback(() => {
    if (!selectedCell) return;

    if (mode === "create") {
      const [r, c] = selectedCell;
      if (createBoard[r][c] === 0) return;

      pushHistory(createBoard);
      const next = createBoard.map((row) => [...row]);
      next[r][c] = 0;
      setCreateBoard(next);
      setValidateResult(null);
      return;
    }

    // Play mode
    if (isCompleted) return;
    const [r, c] = selectedCell;
    if (puzzle[r][c] !== 0 || board[r][c] === 0) return;

    pushHistory(board);
    const newBoard = board.map((row) => [...row]);
    newBoard[r][c] = 0;
    setGameState((prev) => ({ ...prev, board: newBoard }));
  }, [
    mode,
    selectedCell,
    createBoard,
    board,
    puzzle,
    isCompleted,
    pushHistory,
  ]);

  // --- undo ---
  const undo = useCallback(() => {
    if (undoStack.current.length === 0) return;

    if (mode === "create") {
      const prev = undoStack.current.pop()!;
      redoStack.current.push(createBoard.map((row) => [...row]));
      setCreateBoard(prev);
      setValidateResult(null);
      setHistoryVersion((v) => v + 1);
      return;
    }

    const prev = undoStack.current.pop()!;
    redoStack.current.push(board.map((row) => [...row]));
    setGameState((state) => ({ ...state, board: prev }));
    setIsCompleted(false);
    setHistoryVersion((v) => v + 1);
  }, [mode, createBoard, board]);

  // --- redo ---
  const redo = useCallback(() => {
    if (redoStack.current.length === 0) return;

    if (mode === "create") {
      const next = redoStack.current.pop()!;
      undoStack.current.push(createBoard.map((row) => [...row]));
      setCreateBoard(next);
      setHistoryVersion((v) => v + 1);
      return;
    }

    const next = redoStack.current.pop()!;
    undoStack.current.push(board.map((row) => [...row]));
    setGameState((state) => ({ ...state, board: next }));
    setIsCompleted(engine.isCompleted(next));
    setHistoryVersion((v) => v + 1);
  }, [mode, createBoard, board]);

  // --- play-mode only ---
  const getHint = useCallback((): Hint | null => {
    if (mode !== "play" || isCompleted) return null;
    const hint = engine.getHint(board);
    if (!hint) return null;

    pushHistory(board);
    const newBoard = board.map((row) => [...row]);
    newBoard[hint.row][hint.col] = hint.value;
    setGameState((prev) => ({ ...prev, board: newBoard }));
    setSelectedCell([hint.row, hint.col]);

    clearCellNotes(hint.row, hint.col);
    removeNumFromRelatedNotes(hint.row, hint.col, hint.value);

    const completed = engine.isCompleted(newBoard);
    setIsCompleted(completed);
    if (completed) {
      setShowCompletionModal(true);
      setStats(bumpStatsCompleted(difficulty));
    }

    return hint;
  }, [
    mode,
    isCompleted,
    board,
    pushHistory,
    difficulty,
    clearCellNotes,
    removeNumFromRelatedNotes,
  ]);

  const newGame = useCallback(
    (diff?: Difficulty) => {
      const d = diff ?? difficulty;

      if (gameCounted && !isCompleted) {
        setStats((prev) => {
          const next = { ...prev, currentStreak: 0 };
          saveStats(next);
          return next;
        });
      }

      setMode("play");
      setGameState(createNewGame(d));
      setSelectedCell(null);
      setIsCompleted(false);
      setShowCompletionModal(false);
      setNotes({});
      setIsNotesMode(false);
      undoStack.current = [];
      redoStack.current = [];
      setHistoryVersion((v) => v + 1);
      if (diff) setDifficulty(diff);

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
    const target = mode === "create" ? createBoard : puzzle;
    const encoded = encodePuzzle(target);
    const base = window.location.origin + window.location.pathname;
    return `${base}#p=${encoded}`;
  }, [mode, createBoard, puzzle]);

  // --- Create-mode actions ---
  const startFromCreate = useCallback(() => {
    const puz = createBoard.map((row) => [...row]);
    const sol = engine.solve(puz);
    if (!sol) return;

    setGameState({
      board: puz.map((row) => [...row]),
      puzzle: puz,
      solution: sol,
    });
    setMode("play");
    setSelectedCell(null);
    setIsCompleted(false);
    setNotes({});
    setIsNotesMode(false);
    undoStack.current = [];
    redoStack.current = [];
    setHistoryVersion((v) => v + 1);
    setValidateResult(null);
    setDifficulty("easy"); // user-created puzzles don't have difficulty
  }, [createBoard]);

  const validateCreate = useCallback(() => {
    const solvable = engine.isSolvable(createBoard);
    setValidateResult({ solvable });
  }, [createBoard]);

  const clearCreateBoard = useCallback(() => {
    pushHistory(createBoard);
    setCreateBoard(emptyBoard());
    setValidateResult(null);
  }, [createBoard, pushHistory]);

  const switchMode = useCallback(
    (newMode: GameMode) => {
      if (newMode === mode) return;
      setMode(newMode);
      setSelectedCell(null);
      setIsCompleted(false);
      setNotes({});
      setIsNotesMode(false);
      undoStack.current = [];
      redoStack.current = [];
      setHistoryVersion((v) => v + 1);

      if (newMode === "create") {
        setCreateBoard(emptyBoard());
        setValidateResult(null);
      }
    },
    [mode],
  );

  // --- Notes (public API) ---
  const toggleNotesMode = useCallback(() => {
    setIsNotesMode((prev) => !prev);
  }, []);

  const toggleNote = useCallback(
    (row: number, col: number, num: number) => {
      if (mode !== "play" || isCompleted) return;
      if (puzzle[row][col] !== 0) return;
      const key = `${row}-${col}`;
      setNotes((prev) => {
        const cur = prev[key] ?? [];
        const next = cur.includes(num)
          ? cur.filter((n) => n !== num)
          : [...cur, num].sort((a, b) => a - b);
        const updated = { ...prev };
        if (next.length === 0) {
          delete updated[key];
        } else {
          updated[key] = next;
        }
        return updated;
      });
    },
    [mode, isCompleted, puzzle],
  );

  // Which board to display
  const displayBoard = mode === "create" ? createBoard : board;
  const displayPuzzle = mode === "create" ? createBoard : puzzle;

  return {
    mode,
    board: displayBoard,
    puzzle: displayPuzzle,
    solution,
    selectedCell,
    difficulty,
    isCompleted,
    errorCells,
    canUndo,
    canRedo,
    historyVersion,
    stats,
    validateResult,
    showCompletionModal,
    notes,
    isNotesMode,
    selectCell,
    fillNumber,
    eraseNumber,
    undo,
    redo,
    getHint,
    newGame,
    sharePuzzle,
    switchMode,
    validateCreate,
    startFromCreate,
    clearCreateBoard,
    toggleNotesMode,
    toggleNote,
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

function removedNote(notes: Notes, key: string, num: number) {
  const cur = notes[key];
  if (!cur) return;
  const next = cur.filter((n) => n !== num);
  if (next.length === 0) {
    delete notes[key];
  } else {
    notes[key] = next;
  }
}

function bumpStatsCompleted(difficulty: Difficulty) {
  return (prev: GameStats) => {
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
  };
}
