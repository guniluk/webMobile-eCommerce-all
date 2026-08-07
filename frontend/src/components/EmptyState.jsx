import { FolderOpen, Plus } from "lucide-react";

const EmptyState = ({
  icon: Icon = FolderOpen,
  title = "데이터가 존재하지 않습니다",
  description = "아직 등록된 정보가 없거나 조건에 맞는 결과가 없습니다.",
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-base-100 border border-base-300 rounded-3xl text-center shadow-xl space-y-4 my-4">
      <div className="p-4 bg-base-200 rounded-2xl border border-base-300 text-primary shadow-inner">
        <Icon className="w-10 h-10" />
      </div>

      <div className="max-w-sm space-y-1">
        <h4 className="text-base font-bold text-base-content">{title}</h4>
        <p className="text-xs text-base-content/70 leading-relaxed">{description}</p>
      </div>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-2 btn btn-primary text-primary-content font-bold text-xs rounded-xl shadow-lg gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
};

export default EmptyState;
