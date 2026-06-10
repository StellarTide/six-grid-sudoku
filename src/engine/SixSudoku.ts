import type { Board, Difficulty, Hint, GenerateResult } from "./types";

export type { Board, Difficulty, Hint, GenerateResult };

export class SixSudoku {
  readonly size = 6;
  readonly boxRows = 2;
  readonly boxCols = 3;
  readonly digits = [1, 2, 3, 4, 5, 6];

  generate(emptyCount = 18, unique = true): GenerateResult {
    const solution = this.generateFullBoard();
    const puzzle = this.digHoles(solution, emptyCount, unique);

    return {
      puzzle,
      solution,
    };
  }

  generateFullBoard(): Board {
    const pattern = (r: number, c: number): number => {
      return (
        this.boxCols * (r % this.boxRows) +
        Math.floor(r / this.boxRows) +
        c
      ) % this.size;
    };

    const nums = this.shuffle([...this.digits]);

    const rowGroups = this.shuffle(
      Array.from({ length: this.size / this.boxRows }, (_, i) => i),
    );

    const rows: number[] = [];

    for (const g of rowGroups) {
      const inside = this.shuffle(
        Array.from({ length: this.boxRows }, (_, i) => i),
      );

      for (const r of inside) {
        rows.push(g * this.boxRows + r);
      }
    }

    const colGroups = this.shuffle(
      Array.from({ length: this.size / this.boxCols }, (_, i) => i),
    );

    const cols: number[] = [];

    for (const g of colGroups) {
      const inside = this.shuffle(
        Array.from({ length: this.boxCols }, (_, i) => i),
      );

      for (const c of inside) {
        cols.push(g * this.boxCols + c);
      }
    }

    return rows.map((r) => {
      return cols.map((c) => {
        return nums[pattern(r, c)];
      });
    });
  }

  solve(board: Board): Board | null {
    const copied = this.cloneBoard(board);

    if (this.solveInPlace(copied)) {
      return copied;
    }

    return null;
  }

  isSolvable(board: Board): boolean {
    return this.solve(board) !== null;
  }

  isUnique(board: Board): boolean {
    return this.countSolutions(board, 2) === 1;
  }

  countSolutions(board: Board, limit = 2): number {
    const copied = this.cloneBoard(board);
    let count = 0;

    const dfs = (): void => {
      if (count >= limit) return;

      const cell = this.findBestEmpty(copied);

      if (cell === null) {
        count += 1;
        return;
      }

      const [r, c] = cell;

      for (const num of this.candidates(copied, r, c)) {
        copied[r][c] = num;
        dfs();
        copied[r][c] = 0;
      }
    };

    dfs();

    return count;
  }

  candidates(board: Board, row: number, col: number): number[] {
    if (board[row][col] !== 0) {
      return [];
    }

    const used = new Set<number>();

    for (let c = 0; c < this.size; c++) {
      used.add(board[row][c]);
    }

    for (let r = 0; r < this.size; r++) {
      used.add(board[r][col]);
    }

    const br = Math.floor(row / this.boxRows) * this.boxRows;
    const bc = Math.floor(col / this.boxCols) * this.boxCols;

    for (let r = br; r < br + this.boxRows; r++) {
      for (let c = bc; c < bc + this.boxCols; c++) {
        used.add(board[r][c]);
      }
    }

    return this.digits.filter((n) => !used.has(n));
  }

  checkMove(
    board: Board,
    row: number,
    col: number,
    value: number,
  ): boolean {
    if (board[row][col] !== 0) {
      return false;
    }

    return this.candidates(board, row, col).includes(value);
  }

  getHint(board: Board): Hint | null {
    const naked = this.nakedSingle(board);

    if (naked !== null) {
      return naked;
    }

    const hidden = this.hiddenSingle(board);

    if (hidden !== null) {
      return hidden;
    }

    return null;
  }

  isCompleted(board: Board): boolean {
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (board[r][c] === 0) {
          return false;
        }
      }
    }

    return this.isValidCompletedBoard(board);
  }

  rateDifficulty(board: Board): Difficulty {
    const copied = this.cloneBoard(board);

    let hiddenCount = 0;

    while (true) {
      const hint = this.getHint(copied);

      if (hint === null) {
        break;
      }

      copied[hint.row][hint.col] = hint.value;

      if (hint.strategy === "hidden_single") {
        hiddenCount += 1;
      }
    }

    if (hiddenCount === 0) {
      return "easy";
    }

    if (hiddenCount <= 4) {
      return "medium";
    }

    return "hard";
  }

  boardToString(board: Board): string {
    const lines: string[] = [];

    for (let r = 0; r < this.size; r++) {
      if (r > 0 && r % this.boxRows === 0) {
        lines.push("-".repeat(17));
      }

      const parts: string[] = [];

      for (let c = 0; c < this.size; c++) {
        if (c > 0 && c % this.boxCols === 0) {
          parts.push("|");
        }

        parts.push(board[r][c] === 0 ? "." : String(board[r][c]));
      }

      lines.push(parts.join(" "));
    }

    return lines.join("\n");
  }

  private solveInPlace(board: Board): boolean {
    const cell = this.findBestEmpty(board);

    if (cell === null) {
      return true;
    }

    const [r, c] = cell;

    for (const num of this.candidates(board, r, c)) {
      board[r][c] = num;

      if (this.solveInPlace(board)) {
        return true;
      }

      board[r][c] = 0;
    }

    return false;
  }

  private findBestEmpty(board: Board): [number, number] | null {
    let best: [number, number] | null = null;
    let bestSize = Infinity;

    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (board[r][c] !== 0) {
          continue;
        }

        const candidateSize = this.candidates(board, r, c).length;

        if (candidateSize < bestSize) {
          bestSize = candidateSize;
          best = [r, c];
        }
      }
    }

    return best;
  }

  private nakedSingle(board: Board): Hint | null {
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (board[r][c] !== 0) {
          continue;
        }

        const cand = this.candidates(board, r, c);

        if (cand.length === 1) {
          return {
            strategy: "naked_single",
            row: r,
            col: c,
            value: cand[0],
            reason: "Only candidate",
          };
        }
      }
    }

    return null;
  }

  private hiddenSingle(board: Board): Hint | null {
    const rowHint = this.hiddenSingleInRows(board);

    if (rowHint !== null) {
      return rowHint;
    }

    const colHint = this.hiddenSingleInColumns(board);

    if (colHint !== null) {
      return colHint;
    }

    const boxHint = this.hiddenSingleInBoxes(board);

    if (boxHint !== null) {
      return boxHint;
    }

    return null;
  }

  private hiddenSingleInRows(board: Board): Hint | null {
    for (let r = 0; r < this.size; r++) {
      const positions = new Map<number, Array<[number, number]>>();

      for (let c = 0; c < this.size; c++) {
        if (board[r][c] !== 0) {
          continue;
        }

        for (const v of this.candidates(board, r, c)) {
          const list = positions.get(v) ?? [];
          list.push([r, c]);
          positions.set(v, list);
        }
      }

      for (const [value, cells] of positions) {
        if (cells.length === 1) {
          const [row, col] = cells[0];

          return {
            strategy: "hidden_single",
            row,
            col,
            value,
            reason: "Only place in row",
          };
        }
      }
    }

    return null;
  }

  private hiddenSingleInColumns(board: Board): Hint | null {
    for (let c = 0; c < this.size; c++) {
      const positions = new Map<number, Array<[number, number]>>();

      for (let r = 0; r < this.size; r++) {
        if (board[r][c] !== 0) {
          continue;
        }

        for (const v of this.candidates(board, r, c)) {
          const list = positions.get(v) ?? [];
          list.push([r, c]);
          positions.set(v, list);
        }
      }

      for (const [value, cells] of positions) {
        if (cells.length === 1) {
          const [row, col] = cells[0];

          return {
            strategy: "hidden_single",
            row,
            col,
            value,
            reason: "Only place in column",
          };
        }
      }
    }

    return null;
  }

  private hiddenSingleInBoxes(board: Board): Hint | null {
    for (let br = 0; br < this.size; br += this.boxRows) {
      for (let bc = 0; bc < this.size; bc += this.boxCols) {
        const positions = new Map<number, Array<[number, number]>>();

        for (let r = br; r < br + this.boxRows; r++) {
          for (let c = bc; c < bc + this.boxCols; c++) {
            if (board[r][c] !== 0) {
              continue;
            }

            for (const v of this.candidates(board, r, c)) {
              const list = positions.get(v) ?? [];
              list.push([r, c]);
              positions.set(v, list);
            }
          }
        }

        for (const [value, cells] of positions) {
          if (cells.length === 1) {
            const [row, col] = cells[0];

            return {
              strategy: "hidden_single",
              row,
              col,
              value,
              reason: "Only place in box",
            };
          }
        }
      }
    }

    return null;
  }

  private isValidCompletedBoard(board: Board): boolean {
    const target = new Set(this.digits);

    for (let r = 0; r < this.size; r++) {
      if (!this.sameSet(new Set(board[r]), target)) {
        return false;
      }
    }

    for (let c = 0; c < this.size; c++) {
      const col = new Set<number>();

      for (let r = 0; r < this.size; r++) {
        col.add(board[r][c]);
      }

      if (!this.sameSet(col, target)) {
        return false;
      }
    }

    for (let br = 0; br < this.size; br += this.boxRows) {
      for (let bc = 0; bc < this.size; bc += this.boxCols) {
        const box = new Set<number>();

        for (let r = br; r < br + this.boxRows; r++) {
          for (let c = bc; c < bc + this.boxCols; c++) {
            box.add(board[r][c]);
          }
        }

        if (!this.sameSet(box, target)) {
          return false;
        }
      }
    }

    return true;
  }

  private digHoles(
    solution: Board,
    emptyCount: number,
    unique: boolean,
  ): Board {
    const puzzle = this.cloneBoard(solution);

    const cells: Array<[number, number]> = [];

    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        cells.push([r, c]);
      }
    }

    this.shuffleInPlace(cells);

    let removed = 0;

    for (const [r, c] of cells) {
      if (removed >= emptyCount) {
        break;
      }

      const backup = puzzle[r][c];
      puzzle[r][c] = 0;

      if (unique && !this.isUnique(puzzle)) {
        puzzle[r][c] = backup;
        continue;
      }

      removed += 1;
    }

    return puzzle;
  }

  private cloneBoard(board: Board): Board {
    return board.map((row) => [...row]);
  }

  private shuffle<T>(items: T[]): T[] {
    const copied = [...items];
    this.shuffleInPlace(copied);
    return copied;
  }

  private shuffleInPlace<T>(items: T[]): void {
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
  }

  private sameSet<T>(a: Set<T>, b: Set<T>): boolean {
    if (a.size !== b.size) {
      return false;
    }

    for (const x of a) {
      if (!b.has(x)) {
        return false;
      }
    }

    return true;
  }
}