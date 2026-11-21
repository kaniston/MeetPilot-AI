import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, ChevronRight, Plus, Search } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader.jsx';
import Card from '../components/ui/Card.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import DateTile from '../components/ui/DateTile.jsx';
import Badge from '../components/ui/Badge.jsx';
import LoadingState from '../components/ui/LoadingState.jsx';
import { useWorkspace } from '../context/WorkspaceContext.jsx';
import { formatRelativeTime } from '../utils/format.js';

export default function Meetings() {
  const { meetings, loading } = useWorkspace();
  const [query, setQuery] = useState('');

  const filteredMeetings = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return meetings;

    return meetings.filter((meeting) => {
      return (
        meeting.title.toLowerCase().includes(needle) ||
        (meeting.summary || '').toLowerCase().includes(needle)
      );
    });
  }, [meetings, query]);

  return (
    <div>
      <PageHeader
        eyebrow="Meeting memory"
        title="Every conversation, remembered."
        description="Open any saved meeting to revisit its summary, decisions, tasks, and open questions."
        actions={
          <Link to="/meetings/new" className="btn btn-primary">
            <Plus size={16} />
            <span>New meeting</span>
          </Link>
        }
      />

      {loading ? (
        <LoadingState label="Loading meeting history…" />
      ) : (
        <Card className="list-card">
          <div className="toolbar">
            <label className="search-field">
              <Search size={16} aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search meetings by title or summary"
                aria-label="Search meetings"
              />
            </label>
            <span className="result-count">
              {filteredMeetings.length} {filteredMeetings.length === 1 ? 'meeting' : 'meetings'}
            </span>
          </div>

          {meetings.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No meetings saved yet"
              description="Analyse your first transcript and MeetPilot will build a searchable meeting memory for you."
              action={
                <Link to="/meetings/new" className="btn btn-primary btn-sm">
                  <Plus size={14} />
                  <span>Analyse a meeting</span>
                </Link>
              }
            />
          ) : filteredMeetings.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No meetings match your search"
              description={`Nothing found for “${query}”. Try a different title or keyword.`}
              action={
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setQuery('')}>
                  Clear search
                </button>
              }
            />
          ) : (
            <div className="meeting-list">
              {filteredMeetings.map((meeting) => (
                <Link
                  to={`/meetings/${meeting.id}`}
                  className="meeting-card"
                  key={meeting.id}
                >
                  <DateTile date={meeting.meetingDate} />
                  <div className="meeting-card-main">
                    <div className="meeting-card-top">
                      <h2 className="meeting-card-title">{meeting.title}</h2>
                      <ChevronRight size={17} className="meeting-card-chevron" aria-hidden="true" />
                    </div>
                    <p className="meeting-card-summary">
                      {meeting.summary || 'No executive summary is available for this meeting.'}
                    </p>
                    <div className="meeting-card-meta">
                      <Badge tone="blue" dot>
                        {meeting.decisionCount} {meeting.decisionCount === 1 ? 'decision' : 'decisions'}
                      </Badge>
                      <Badge tone="violet" dot>
                        {meeting.taskCount} {meeting.taskCount === 1 ? 'task' : 'tasks'}
                      </Badge>
                      <span className="meta-text">Saved {formatRelativeTime(meeting.createdAt)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
