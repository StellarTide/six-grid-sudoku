import type { Difficulty } from "../engine/types";
import type { Hint } from "../engine/types";

interface GameToolbarProps {
  difficulty: Difficulty;
  isCompleted: boolean;
  canUndo: boolean;
  canRedo: boolean;
  lastHint: Hint | null;
  onUndo: () => void;
  onRedo: () => void;
  onHint: () => void;
  onNewGame: () => void;
  onDifficultyChange: (d: Difficulty) => void;
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
  onUndo,
  onRedo,
  onHint,
  onNewGame,
  onDifficultyChange,
}: GameToolbarProps) {
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
              px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-100
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
      <div className="flex gap-2">
        <ToolButton
          onClick={onUndo}
          disabled={!canUndo}
          label="撤销"
          icon="↩"
        />
        <ToolButton
          onClick={onRedo}
          disabled={!canRedo}
          label="重做"
          icon="↪"
        />
        <ToolButton
          onClick={onHint}
          disabled={isCompleted}
          label="提示"
          icon="💡"
        />
        <ToolButton onClick={onNewGame} label="新游戏" icon="🔄" />
      </div>

      {/* Hint message */}
      {lastHint && (
        <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 max-w-xs text-center">
          <span className="font-medium">
            第{lastHint.row + 1}行第{lastHint.col + 1}列 → {lastHint.value}
          </span>
          <span className="text-amber-500 ml-1">({lastHint.reason})</span>
        </div>
      )}

      {/* Completion message */}
      {isCompleted && (
        <div className="text-lg font-bold text-green-600 bg-green-50 border border-green-200 rounded-lg px-6 py-3">
          🎉 恭喜完成！
        </div>
      )}
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
  icon: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg text-xs
        transition-colors duration-100 select-none min-w-[56px]
        ${
          disabled
            ? "text-slate-300 cursor-not-allowed"
            : "text-slate-600 hover:bg-slate-100 active:bg-slate-200 cursor-pointer"
        }
      `}
    >
      <span className="text-lg">{icon}</span>
      <span>{label}</span>
    </button>
  );
}
