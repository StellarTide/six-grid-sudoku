import { useEffect, useCallback, useState } from "react";
import { useSudoku } from "./hooks/useSudoku";
import { SudokuBoard } from "./components/SudokuBoard";
import { NumberPad } from "./components/NumberPad";
import { GameToolbar } from "./components/GameToolbar";
import type { Hint } from "./engine/types";

function App() {
  const {
    board,
    puzzle,
    selectedCell,
    difficulty,
    isCompleted,
    errorCells,
    canUndo,
    canRedo,
    stats,
    selectCell,
    fillNumber,
    eraseNumber,
    undo,
    redo,
    getHint,
    newGame,
    sharePuzzle,
  } = useSudoku();

  const [lastHint, setLastHint] = useState<Hint | null>(null);

  const handleUndo = useCallback(() => {
    undo();
    setLastHint(null);
  }, [undo]);

  const handleRedo = useCallback(() => {
    redo();
    setLastHint(null);
  }, [redo]);

  const handleHint = useCallback(() => {
    const hint = getHint();
    setLastHint(hint);
  }, [getHint]);

  const handleNewGame = useCallback(() => {
    newGame();
    setLastHint(null);
  }, [newGame]);

  const handleDifficultyChange = useCallback(
    (d: "easy" | "medium" | "hard") => {
      newGame(d);
      setLastHint(null);
    },
    [newGame],
  );

  const handleShare = useCallback(() => {
    const url = sharePuzzle();
    navigator.clipboard.writeText(url).catch(() => {});
  }, [sharePuzzle]);

  // Keyboard support
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key >= "1" && e.key <= "6") {
        e.preventDefault();
        fillNumber(parseInt(e.key));
        return;
      }

      if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        eraseNumber();
        return;
      }

      if (
        selectedCell &&
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)
      ) {
        e.preventDefault();
        const [r, c] = selectedCell;
        let nr = r;
        let nc = c;
        if (e.key === "ArrowUp") nr = Math.max(0, r - 1);
        if (e.key === "ArrowDown") nr = Math.min(5, r + 1);
        if (e.key === "ArrowLeft") nc = Math.max(0, c - 1);
        if (e.key === "ArrowRight") nc = Math.min(5, c + 1);
        selectCell(nr, nc);
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        handleRedo();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault();
        handleRedo();
        return;
      }
    },
    [selectedCell, fillNumber, eraseNumber, selectCell, handleUndo, handleRedo],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col items-center px-3 py-4 sm:px-4 sm:py-8">
      <h1 className="text-xl sm:text-3xl font-bold text-slate-800 mb-4 sm:mb-6">
        六宫格数独
      </h1>

      <div className="flex flex-col gap-3 sm:gap-5 w-full max-w-[400px]">
        <GameToolbar
          difficulty={difficulty}
          isCompleted={isCompleted}
          canUndo={canUndo}
          canRedo={canRedo}
          lastHint={lastHint}
          stats={stats}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onHint={handleHint}
          onNewGame={handleNewGame}
          onDifficultyChange={handleDifficultyChange}
          onShare={handleShare}
        />

        <SudokuBoard
          board={board}
          puzzle={puzzle}
          selectedCell={selectedCell}
          errorCells={errorCells}
          onCellClick={selectCell}
        />

        <NumberPad board={board} onFill={fillNumber} onErase={eraseNumber} />
      </div>

      <p className="mt-6 text-xs text-slate-400 text-center hidden sm:block">
        键盘：方向键移动 · 数字键填入 · Backspace 擦除 · Ctrl+Z 撤销
      </p>
    </div>
  );
}

export default App;
