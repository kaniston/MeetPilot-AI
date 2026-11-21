import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-react';

const ICONS = {
  info: Info,
  success: CheckCircle2,
  warning: TriangleAlert,
  danger: AlertCircle,
};

export default function Alert({ tone = 'info', title, children, action = null }) {
  const Icon = ICONS[tone] || Info;

  return (
    <div className={`alert alert-${tone}`} role={tone === 'danger' ? 'alert' : 'status'}>
      <Icon size={18} strokeWidth={2} className="alert-icon" aria-hidden="true" />
      <div className="alert-copy">
        {title ? <p className="alert-title">{title}</p> : null}
        {children ? <div className="alert-body">{children}</div> : null}
      </div>
      {action ? <div className="alert-action">{action}</div> : null}
    </div>
  );
}
