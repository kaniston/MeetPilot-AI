export default function Card({ children, className = '', as: Tag = 'section' }) {
  return <Tag className={`card ${className}`.trim()}>{children}</Tag>;
}

export function CardHeader({ title, subtitle, action, icon: Icon }) {
  return (
    <div className="card-header">
      <div className="card-heading">
        <div className="card-title-row">
          {Icon ? (
            <span className="card-title-icon">
              <Icon size={15} strokeWidth={2} aria-hidden="true" />
            </span>
          ) : null}
          <h2 className="card-title">{title}</h2>
        </div>
        {subtitle ? <p className="card-subtitle">{subtitle}</p> : null}
      </div>
      {action ? <div className="card-action">{action}</div> : null}
    </div>
  );
}
