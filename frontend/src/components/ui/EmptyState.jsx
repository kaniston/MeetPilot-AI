export default function EmptyState({
  icon: Icon,
  title,
  description,
  action = null,
  compact = false,
  className = '',
}) {
  return (
    <div className={`empty-state ${compact ? 'empty-state-compact' : ''} ${className}`.trim()}>
      {Icon ? (
        <span className="empty-icon" aria-hidden="true">
          <Icon size={20} strokeWidth={1.8} />
        </span>
      ) : null}
      <h3 className="empty-title">{title}</h3>
      {description ? <p className="empty-description">{description}</p> : null}
      {action ? <div className="empty-action">{action}</div> : null}
    </div>
  );
}
