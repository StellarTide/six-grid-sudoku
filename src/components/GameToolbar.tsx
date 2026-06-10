import { useState, type ReactNode } from "react";
import {
  Undo2,
  Redo2,
  Lightbulb,
  RefreshCw,
  BarChart3,
  Link2,
  CheckCircle2,
  PartyPopper,
  Play,
  Eraser,
  CircleCheck,
  PenLine,
  X,
  Lightbulb as HintIcon,
} from "lucide-react";
import type {
  Board,
  Difficulty,
  Hint,
  GameStats,
  GameMode,
  ValidateResult,
} from "../engine/types";

interface GameToolbarProps {
  mode: GameMode;
  difficulty: Difficulty;
  isCompleted: boolean;
  canUndo: boolean;
  canRedo: boolean;
  stats: GameStats;
  showCompletionModal: boolean;
  validateResult: ValidateResult | null;
  board: Board;
  puzzle: Board;
  isNotesMode: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onHint: () => Hint | null;
  onNewGame: () => void;
  onDifficultyChange: (d: Difficulty) => void;
  onShare: () => void;
  onValidateCreate: () => void;
  onStartFromCreate: () => void;
  onClearCreateBoard: () => void;
  onToggleNotesMode: () => void;
}

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: "easy", label: "简单" },
  { value: "medium", label: "中等" },
  { value: "hard", label: "困难" },
];

export function GameToolbar({
  mode,
  difficulty,
  isCompleted,
  canUndo,
  canRedo,
  stats,
  showCompletionModal,
  validateResult,
  board,
  puzzle,
  isNotesMode,
  onUndo,
  onRedo,
  onHint,
  onNewGame,
  onDifficultyChange,
  onShare,
  onValidateCreate,
  onStartFromCreate,
  onClearCreateBoard,
  onToggleNotesMode,
}: GameToolbarProps) {
  const [showStats, setShowStats] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [hintToast, setHintToast] = useState<Hint | null>(null);

  const handleHint = () => {
    const result = onHint();
    if (result) {
      setHintToast(result);
      setTimeout(() => setHintToast(null), 5000);
    }
  };

  const handleValidateClick = () => {
    onValidateCreate();
    setShowValidation(true);
  };

  const handleStartNewGame = () => onNewGame();

  return (
    <div className="flex flex-col gap-3 items-center">
      {/* Difficulty selector — play mode only */}
      {mode === "play" && (
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => onDifficultyChange(d.value)}
              className={`
                px-4 py-1.5 rounded-md text-sm font-medium transition-colors duration-100
                ${
                  difficulty === d.value
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }
              `}
            >
              {d.label}
            </button>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
        <ToolButton
          onClick={onUndo}
          disabled={!canUndo}
          label="撤销"
          icon={<Undo2 size={18} />}
        />
        <ToolButton
          onClick={onRedo}
          disabled={!canRedo}
          label="重做"
          icon={<Redo2 size={18} />}
        />
        {mode === "play" && (
          <>
            <ToolButton
              onClick={handleHint}
              disabled={isCompleted}
              label="提示"
              icon={<Lightbulb size={18} />}
            />
            <ToolButton
              onClick={onToggleNotesMode}
              label="笔记"
              icon={<PenLine size={18} />}
              active={isNotesMode}
            />
            <ToolButton
              onClick={onNewGame}
              label="新游戏"
              icon={<RefreshCw size={18} />}
            />
          </>
        )}
        {mode === "create" && (
          <>
            <ToolButton
              onClick={handleValidateClick}
              label="验证"
              icon={<CircleCheck size={18} />}
            />
            <ToolButton
              onClick={onClearCreateBoard}
              label="清空"
              icon={<Eraser size={18} />}
            />
          </>
        )}
        <ToolButton
          onClick={() => setShowStats(true)}
          label="统计"
          icon={<BarChart3 size={18} />}
        />
      </div>

      {/* === TOASTS (fixed top, no layout impact) === */}

      {/* Hint toast */}
      {hintToast && (
        <Toast variant="amber">
          <HintIcon size={14} className="shrink-0" />
          <span className="font-medium">
            第{hintToast.row + 1}行第{hintToast.col + 1}列 → {hintToast.value}
          </span>
          <span className="text-amber-500">({hintToast.reason})</span>
        </Toast>
      )}

      {/* === MODALS (fixed center overlay) === */}

      {/* Stats modal */}
      {showStats && (
        <Modal onClose={() => setShowStats(false)}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
              <BarChart3 size={14} />
              游戏统计
            </h3>
            <button
              type="button"
              onClick={() => setShowStats(false)}
              className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <StatItem label="已玩" value={stats.totalPlayed} />
            <StatItem label="完成" value={stats.totalCompleted} />
            <StatItem label="连胜" value={stats.currentStreak} />
            <StatItem label="简单" value={stats.easyCompleted} />
            <StatItem label="中等" value={stats.mediumCompleted} />
            <StatItem label="困难" value={stats.hardCompleted} />
          </div>
          <div className="mt-3 text-center">
            <span className="text-xs text-slate-400 dark:text-slate-500">
              最佳连胜：{stats.bestStreak}
            </span>
          </div>
        </Modal>
      )}

      {/* Validation result modal — create mode */}
      {showValidation && validateResult && (
        <Modal onClose={() => setShowValidation(false)} narrow>
          {validateResult.solvable ? (
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 size={20} />
                <span className="text-base font-semibold">题目可解！</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowValidation(false);
                  onStartFromCreate();
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
              >
                <Play size={16} />
                开始游戏
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-red-600">
              <X size={20} />
              <span className="text-base font-semibold">
                此题无解，请修改后重试
              </span>
            </div>
          )}
        </Modal>
      )}

      {/* Completion modal — play mode */}
      {showCompletionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-5 mx-4 w-full max-w-[300px] text-center">
            {/* Celebration header */}
            <div className="flex items-center justify-center gap-2 mb-1">
              <PartyPopper size={28} className="text-amber-500" />
              <PartyPopper size={28} className="text-amber-500" />
            </div>
            <h2 className="text-xl font-bold text-green-600 dark:text-green-400 mb-1">
              恭喜完成！
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              {difficulty === "easy"
                ? "简单"
                : difficulty === "medium"
                  ? "中等"
                  : "困难"}
              难度
            </p>

            {/* Mini completed board */}
            <div className="mb-4">
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">终盘结果</p>
              <div className="inline-grid grid-cols-6 border-2 border-slate-700 rounded-lg overflow-hidden">
                {board.map((row, r) =>
                  row.map((value, c) => {
                    const isInitial = puzzle[r][c] !== 0;
                    const thickRight = c === 2 || c === 5;
                    const thickBottom = r === 1 || r === 3;
                    return (
                      <div
                        key={`${r}-${c}`}
                        className={`
                          w-7 h-7 flex items-center justify-center text-xs font-medium
                          border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700
                          ${r === 0 ? "border-t-2 border-t-slate-700 dark:border-t-slate-300" : ""}
                          ${r === 5 ? "border-b-2 border-b-slate-700 dark:border-b-slate-300" : ""}
                          ${c === 0 ? "border-l-2 border-l-slate-700 dark:border-l-slate-300" : ""}
                          ${c === 5 ? "border-r-2 border-r-slate-700 dark:border-r-slate-300" : ""}
                          ${thickRight ? "border-r-2 border-r-slate-700 dark:border-r-slate-300" : ""}
                          ${thickBottom ? "border-b-2 border-b-slate-700 dark:border-b-slate-300" : ""}
                          ${isInitial ? "text-slate-900 dark:text-slate-200 font-semibold" : "text-blue-600 dark:text-blue-400 font-bold"}
                        `}
                      >
                        {value}
                      </div>
                    );
                  }),
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleStartNewGame}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <RefreshCw size={16} />
                再来一局
              </button>
              <button
                type="button"
                onClick={onShare}
                className="flex items-center justify-center gap-1.5 px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors"
              >
                <Link2 size={16} />
                分享战绩
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-2 py-2">
      <div className="text-lg font-bold text-slate-800 dark:text-slate-200">{value}</div>
      <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
    </div>
  );
}

function ToolButton({
  onClick,
  disabled,
  label,
  icon,
  active,
}: {
  onClick: () => void;
  disabled?: boolean;
  label: string;
  icon: ReactNode;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        flex flex-col items-center gap-0.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs
        transition-colors duration-100 select-none min-w-[48px] sm:min-w-[52px]
        ${
          disabled
            ? "text-slate-300 dark:text-slate-600 cursor-not-allowed"
            : active
              ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 cursor-pointer"
              : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 active:bg-slate-200 dark:active:bg-slate-700 cursor-pointer"
        }
      `}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

// Reusable Toast — fixed at top-center
function Toast({
  children,
  variant = "green",
}: {
  children: ReactNode;
  variant?: "green" | "amber";
}) {
  const colors =
    variant === "amber"
      ? "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800"
      : "text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800";

  return (
    <div
      className={`fixed top-4 sm:top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 text-sm border rounded-lg px-4 py-2 shadow-lg max-w-[calc(100vw-2rem)] ${colors}`}
    >
      {children}
    </div>
  );
}

// Reusable Modal — centered overlay
function Modal({
  children,
  onClose,
  narrow,
}: {
  children: ReactNode;
  onClose: () => void;
  narrow?: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className={`bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-5 mx-4 w-full max-h-[90vh] overflow-y-auto ${
          narrow ? "max-w-[280px] text-center" : "max-w-[320px]"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
