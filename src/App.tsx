import { useEffect, useCallback } from "react";
import { Play, Pencil, Sun, Moon, Share2 } from "lucide-react";
import { useSudoku } from "./hooks/useSudoku";
import { useTheme } from "./hooks/useTheme";
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

  const { theme, toggleTheme } = useTheme();

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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 flex flex-col items-center px-3 py-3 sm:px-4 sm:py-6">
      {/* === Header === */}
      <div className="w-full max-w-[400px] flex items-center justify-between mb-3 sm:mb-4">
        <h1 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100">
          六宫格数独
        </h1>

        {/* Mode tabs + compact icons */}
        <div className="flex items-center gap-1.5">
          {/* Mode switch */}
          <div className="flex gap-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => switchMode("play")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                mode === "play"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              <Play size={12} />
              游玩
            </button>
            <button
              type="button"
              onClick={() => switchMode("create")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                mode === "create"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              <Pencil size={12} />
              出题
            </button>
          </div>

          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={theme === "dark" ? "亮色模式" : "暗色模式"}
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Share */}
          <button
            type="button"
            onClick={handleShare}
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="分享"
          >
            <Share2 size={16} />
          </button>
        </div>
      </div>

      {/* === Main content === */}
      <div className="flex flex-col gap-3 sm:gap-4 w-full max-w-[400px]">
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

      <p className="mt-4 text-xs text-slate-400 dark:text-slate-500 text-center hidden sm:block">
        键盘：方向键移动 · 数字键填入 · Backspace 擦除 · Ctrl+Z 撤销
      </p>
    </div>
  );
}

export default App;
