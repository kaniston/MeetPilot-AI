import { Loader2 } from 'lucide-react';

export default function LoadingState({ label = 'Loading workspace…', compact = false }) {
  return (
    <div className={`loading-state ${compact ? 'loading-state-compact' : ''}`.trim()} role="status">
      <Loader2 className="spin" size={20} strokeWidth={2} aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
