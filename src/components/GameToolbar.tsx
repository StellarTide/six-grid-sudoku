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
  Pencil,
  Play,
  Eraser,
  CircleCheck,
  X,
  Lightbulb as HintIcon,
} from "lucide-react";
import type {
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
  onUndo: () => void;
  onRedo: () => void;
  onHint: () => Hint | null;
  onNewGame: () => void;
  onDifficultyChange: (d: Difficulty) => void;
  onShare: () => void;
  onSwitchMode: (m: GameMode) => void;
  onValidateCreate: () => void;
  onStartFromCreate: () => void;
  onClearCreateBoard: () => void;
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
  onUndo,
  onRedo,
  onHint,
  onNewGame,
  onDifficultyChange,
  onShare,
  onSwitchMode,
  onValidateCreate,
  onStartFromCreate,
  onClearCreateBoard,
}: GameToolbarProps) {
  const [showStats, setShowStats] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [shareToast, setShareToast] = useState(false);
  const [hintToast, setHintToast] = useState<Hint | null>(null);

  // Completion modal — not dismissable, user must click "再来一局"

  const handleShare = () => {
    onShare();
    setShareToast(true);
    setTimeout(() => setShareToast(false), 2000);
  };

  const handleHint = () => {
    const result = onHint();
    if (result) {
      setHintToast(result);
      setTimeout(() => setHintToast(null), 3000);
    }
  };

  const handleValidateClick = () => {
    onValidateCreate();
    setShowValidation(true);
  };

  const handleStartNewGame = () => onNewGame();

  return (
    <div className="flex flex-col gap-3 items-center">
      {/* Mode tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
        <button
          type="button"
          onClick={() => onSwitchMode("play")}
          className={`
            flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium
            transition-colors duration-100
            ${
              mode === "play"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }
          `}
        >
          <Play size={14} />
          游玩
        </button>
        <button
          type="button"
          onClick={() => onSwitchMode("create")}
          className={`
            flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium
            transition-colors duration-100
            ${
              mode === "create"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }
          `}
        >
          <Pencil size={14} />
          出题
        </button>
      </div>

      {/* Difficulty selector — play mode only */}
      {mode === "play" && (
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => onDifficultyChange(d.value)}
              className={`
                px-4 py-1.5 rounded-md text-sm font-medium transition-colors duration-100
                ${
                  difficulty === d.value
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
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
        <ToolButton
          onClick={handleShare}
          label="分享"
          icon={<Link2 size={18} />}
        />
      </div>

      {/* === TOASTS (fixed top, no layout impact) === */}

      {/* Share toast */}
      {shareToast && (
        <Toast>
          <CheckCircle2 size={14} />
          链接已复制到剪贴板
        </Toast>
      )}

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
            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
              <BarChart3 size={14} />
              游戏统计
            </h3>
            <button
              type="button"
              onClick={() => setShowStats(false)}
              className="text-slate-400 hover:text-slate-600 transition-colors"
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
            <span className="text-xs text-slate-400">
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

      {/* Completion modal — play mode, non-dismissable */}
      {showCompletionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-5 mx-4 w-full max-w-[280px] text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-2 text-green-600">
                <PartyPopper size={24} />
                <span className="text-xl font-bold">恭喜完成！</span>
                <PartyPopper size={24} />
              </div>
              <button
                type="button"
                onClick={handleStartNewGame}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <RefreshCw size={16} />
                再来一局
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
    <div className="bg-slate-50 rounded-lg px-2 py-2">
      <div className="text-lg font-bold text-slate-800">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}

function ToolButton({
  onClick,
  disabled,
  label,
  icon,
}: {
  onClick: () => void;
  disabled?: boolean;
  label: string;
  icon: ReactNode;
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
            ? "text-slate-300 cursor-not-allowed"
            : "text-slate-600 hover:bg-slate-100 active:bg-slate-200 cursor-pointer"
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
      ? "text-amber-700 bg-amber-50 border-amber-200"
      : "text-green-700 bg-green-50 border-green-200";

  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 text-sm border rounded-lg px-4 py-2 shadow-lg max-w-[calc(100vw-2rem)] ${colors}`}
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
        className={`bg-white rounded-2xl shadow-xl p-5 mx-4 w-full max-h-[90vh] overflow-y-auto ${
          narrow ? "max-w-[280px] text-center" : "max-w-[320px]"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
