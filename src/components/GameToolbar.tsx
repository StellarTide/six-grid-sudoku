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
  Lightbulb as HintIcon,
} from "lucide-react";
import type { Difficulty, Hint, GameStats } from "../engine/types";

interface GameToolbarProps {
  difficulty: Difficulty;
  isCompleted: boolean;
  canUndo: boolean;
  canRedo: boolean;
  lastHint: Hint | null;
  stats: GameStats;
  onUndo: () => void;
  onRedo: () => void;
  onHint: () => void;
  onNewGame: () => void;
  onDifficultyChange: (d: Difficulty) => void;
  onShare: () => void;
}

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: "easy", label: "简单" },
  { value: "medium", label: "中等" },
  { value: "hard", label: "困难" },
];

export function GameToolbar({
  difficulty,
  isCompleted,
  canUndo,
  canRedo,
  lastHint,
  stats,
  onUndo,
  onRedo,
  onHint,
  onNewGame,
  onDifficultyChange,
  onShare,
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
      {/* Difficulty selector */}
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

      {/* Hint message */}
      {lastHint && (
        <div className="flex items-center gap-1.5 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 max-w-xs text-center">
          <HintIcon size={14} className="shrink-0" />
          <span className="font-medium">
            第{lastHint.row + 1}行第{lastHint.col + 1}列 → {lastHint.value}
          </span>
          <span className="text-amber-500">({lastHint.reason})</span>
        </div>
      )}

      {/* Stats panel */}
      {showStats && (
        <div className="w-full bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <h3 className="flex items-center justify-center gap-1.5 text-sm font-semibold text-slate-700 mb-3">
            <BarChart3 size={14} />
            游戏统计
          </h3>
          <div className="grid grid-cols-3 gap-2 text-center">
            <StatItem label="已玩" value={stats.totalPlayed} />
            <StatItem label="完成" value={stats.totalCompleted} />
            <StatItem label="连胜" value={stats.currentStreak} />
            <StatItem label="简单" value={stats.easyCompleted} />
            <StatItem label="中等" value={stats.mediumCompleted} />
            <StatItem label="困难" value={stats.hardCompleted} />
          </div>
          <div className="mt-2 text-center">
            <span className="text-xs text-slate-400">
              最佳连胜：{stats.bestStreak}
            </span>
          </div>
        </div>
      )}

      {/* Completion message */}
      {isCompleted && (
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
