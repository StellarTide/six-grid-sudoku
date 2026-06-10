import { useEffect, useCallback } from "react";
import { useSudoku } from "./hooks/useSudoku";
import { SudokuBoard } from "./components/SudokuBoard";
import { NumberPad } from "./components/NumberPad";
import { GameToolbar } from "./components/GameToolbar";

function App() {
  const {
    mode,
    board,
    puzzle,
    selectedCell,
    difficulty,
    isCompleted,
    errorCells,
    canUndo,
    canRedo,
    stats,
    showCompletionModal,
    validateResult,
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
  } = useSudoku();

  const handleHint = useCallback(() => {
    return getHint();
  }, [getHint]);

  const handleNewGame = useCallback(() => {
    newGame();
  }, [newGame]);

  const handleDifficultyChange = useCallback(
    (d: "easy" | "medium" | "hard") => {
      newGame(d);
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
        undo();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        redo();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault();
        redo();
        return;
      }
    },
    [selectedCell, fillNumber, eraseNumber, selectCell, undo, redo],
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
          mode={mode}
          difficulty={difficulty}
          isCompleted={isCompleted}
          canUndo={canUndo}
          canRedo={canRedo}
          stats={stats}
          validateResult={validateResult}
          showCompletionModal={showCompletionModal}
          board={board}
          puzzle={puzzle}
          isNotesMode={isNotesMode}
          onUndo={undo}
          onRedo={redo}
          onHint={handleHint}
          onNewGame={handleNewGame}
          onDifficultyChange={handleDifficultyChange}
          onShare={handleShare}
          onSwitchMode={switchMode}
          onValidateCreate={validateCreate}
          onStartFromCreate={startFromCreate}
          onClearCreateBoard={clearCreateBoard}
          onToggleNotesMode={toggleNotesMode}
        />

        <SudokuBoard
          board={board}
          puzzle={puzzle}
          notes={notes}
          selectedCell={selectedCell}
          errorCells={errorCells}
          onCellClick={selectCell}
        />

        <NumberPad
          mode={mode}
          board={board}
          isNotesMode={isNotesMode}
          onFill={fillNumber}
          onErase={eraseNumber}
          onToggleNote={toggleNote}
          selectedCell={selectedCell}
        />
      </div>

      <p className="mt-6 text-xs text-slate-400 text-center hidden sm:block">
        键盘：方向键移动 · 数字键填入 · Backspace 擦除 · Ctrl+Z 撤销
      </p>
    </div>
  );
}

export default App;
