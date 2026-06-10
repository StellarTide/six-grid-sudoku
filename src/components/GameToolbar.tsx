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
  lastHint: Hint | null;
  stats: GameStats;
  validateResult: ValidateResult | null;
  onUndo: () => void;
  onRedo: () => void;
  onHint: () => void;
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
  lastHint,
  stats,
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
  const [shareToast, setShareToast] = useState(false);

  const handleShare = () => {
    onShare();
    setShareToast(true);
    setTimeout(() => setShareToast(false), 2000);
  };

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
              onClick={onHint}
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
              onClick={onValidateCreate}
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
          onClick={() => setShowStats((s) => !s)}
          label="统计"
          icon={<BarChart3 size={18} />}
        />
        <ToolButton
          onClick={handleShare}
          label="分享"
          icon={<Link2 size={18} />}
        />
      </div>

      {/* Share toast */}
      {shareToast && (
        <div className="flex items-center gap-1.5 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
          <CheckCircle2 size={14} />
          链接已复制到剪贴板
        </div>
      )}

      {/* Validation result — create mode */}
      {mode === "create" && validateResult && (
        <div
          className={`flex flex-col items-center gap-2 text-sm rounded-lg px-4 py-3 border ${
            validateResult.solvable
              ? "text-green-700 bg-green-50 border-green-200"
              : "text-red-700 bg-red-50 border-red-200"
          }`}
        >
          {validateResult.solvable ? (
            <>
              <span className="flex items-center gap-1">
                <CheckCircle2 size={14} />
                题目可解！
              </span>
              <button
                type="button"
                onClick={onStartFromCreate}
                className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-md text-xs font-medium hover:bg-green-700 transition-colors"
              >
                <Play size={14} />
                开始游戏
              </button>
            </>
          ) : (
            <span>此题无解，请修改后重试</span>
          )}
        </div>
      )}

      {/* Hint message — play mode */}
      {mode === "play" && lastHint && (
        <div className="flex items-center gap-1.5 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 max-w-xs text-center">
          <HintIcon size={14} className="shrink-0" />
          <span className="font-medium">
            第{lastHint.row + 1}行第{lastHint.col + 1}列 → {lastHint.value}
          </span>
          <span className="text-amber-500">({lastHint.reason})</span>
        </div>
      )}

      {/* Stats modal */}
      {showStats && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowStats(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl p-5 mx-4 w-full max-w-[300px]"
            onClick={(e) => e.stopPropagation()}
          >
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
          </div>
        </div>
      )}

      {/* Completion message — play mode */}
      {mode === "play" && isCompleted && (
        <div className="flex items-center gap-2 text-lg font-bold text-green-600 bg-green-50 border border-green-200 rounded-lg px-5 py-3">
          <PartyPopper size={20} />
          恭喜完成！
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
