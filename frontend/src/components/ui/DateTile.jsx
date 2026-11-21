import { formatDay, formatMonth } from '../../utils/format.js';

export default function DateTile({ date, tone = 'default' }) {
  return (
    <span className={`date-tile date-tile-${tone}`} aria-label={date || 'No date'}>
      <span className="date-tile-month">{formatMonth(date)}</span>
      <span className="date-tile-day">{formatDay(date)}</span>
    </span>
  );
}
