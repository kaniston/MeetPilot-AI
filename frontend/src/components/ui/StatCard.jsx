export default function StatCard({ label, value, icon: Icon, tone = 'blue', footer, loading = false }) {
  return (
    <article className={`stat-card stat-tone-${tone}`}>
      <div className="stat-card-top">
        <span className="stat-label">{label}</span>
        <span className="stat-icon" aria-hidden="true">
          <Icon size={18} strokeWidth={1.9} />
        </span>
      </div>
      <div className="stat-value">{loading ? '—' : value}</div>
      {footer ? <p className="stat-footer">{footer}</p> : null}
    </article>
  );
}
