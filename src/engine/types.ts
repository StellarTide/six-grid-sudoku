export type Board = number[][];

export type Difficulty = "easy" | "medium" | "hard";

export interface Hint {
  strategy: "naked_single" | "hidden_single";
  row: number;
  col: number;
  value: number;
  reason: string;
}

export interface GenerateResult {
  puzzle: Board;
  solution: Board;
}

export interface SaveData {
  board: Board;
  puzzle: Board;
  solution: Board;
  difficulty: Difficulty;
  undoStack: Board[];
  redoStack: Board[];
  isCompleted: boolean;
}

export type GameMode = "play" | "create";

export interface ValidateResult {
  solvable: boolean;
}

export interface GameStats {
  totalPlayed: number;
  totalCompleted: number;
  easyCompleted: number;
  mediumCompleted: number;
  hardCompleted: number;
  currentStreak: number;
  bestStreak: number;
}
