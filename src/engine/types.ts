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
