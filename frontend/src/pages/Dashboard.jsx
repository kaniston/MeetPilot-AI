import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  Clock,
  ListChecks,
  Plus,
  Scale,
  Sparkles,
  UserRoundX,
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader.jsx';
import Card, { CardHeader } from '../components/ui/Card.jsx';
import StatCard from '../components/ui/StatCard.jsx';
import Badge from '../components/ui/Badge.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import DateTile from '../components/ui/DateTile.jsx';
import LoadingState from '../components/ui/LoadingState.jsx';
import { useWorkspace } from '../context/WorkspaceContext.jsx';
import { getWorkspaceStats } from '../utils/stats.js';
import { daysUntil, displayOwner, formatDate, isTaskDueToday } from '../utils/format.js';

function deadlineBadge(task) {
  if (isTaskDueToday(task)) return <Badge tone="warning">Due today</Badge>;

  const days = daysUntil(task.deadline);
  if (days === null) return <Badge tone="neutral">No deadline</Badge>;
  if (days === 1) return <Badge tone="blue">Tomorrow</Badge>;
  return <Badge tone="neutral">In {days} days</Badge>;
}

export default function Dashboard() {
  const { meetings, tasks, decisions, loading, error } = useWorkspace();
  const stats = getWorkspaceStats(meetings, tasks);

  const recentMeetings = meetings.slice(0, 4);
  const recentDecisions = decisions.slice(0, 4);
  const upcoming = stats.upcoming.slice(0, 4);

  return (
    <div>
      <PageHeader
        eyebrow="Workspace overview"
        title="Meeting intelligence at a glance."
        description="Decisions, owners, and deadlines from every conversation — kept in one place."
        actions={
          <>
            <Link to="/assistant" className="btn btn-secondary">
              <Sparkles size={16} />
              <span>Ask MeetPilot</span>
            </Link>
            <Link to="/meetings/new" className="btn btn-primary">
              <Plus size={16} />
              <span>Analyse meeting</span>
            </Link>
          </>
        }
      />

      {loading ? (
        <LoadingState />
      ) : (
        <>
          {!meetings.length && !error ? (
            <section className="onboarding-card">
              <div className="onboarding-copy">
                <span className="onboarding-eyebrow">
                  <Sparkles size={14} />
                  Your meeting memory starts here
                </span>
                <h2>Turn your next conversation into decisions and action.</h2>
                <p>
                  Paste a transcript once. MeetPilot extracts the summary, confirmed decisions,
                  action items, owners, and risks — then keeps track of what changes next.
                </p>
                <div className="onboarding-steps">
                  <span><strong>01</strong> Paste a transcript</span>
                  <span><strong>02</strong> Review AI findings</span>
                  <span><strong>03</strong> Track the follow-through</span>
                </div>
                <Link to="/meetings/new" className="btn btn-primary">
                  <Plus size={16} />
                  <span>Create your first meeting</span>
                </Link>
              </div>
              <div className="onboarding-art" aria-hidden="true">
                <div className="orbit orbit-one" />
                <div className="orbit orbit-two" />
                <span className="onboarding-art-icon">
                  <Sparkles size={30} strokeWidth={1.6} />
                </span>
                <span className="onboarding-chip onboarding-chip-one">
                  <CheckCircle2 size={13} /> Decision captured
                </span>
                <span className="onboarding-chip onboarding-chip-two">
                  <ListChecks size={13} /> Owner assigned
                </span>
              </div>
            </section>
          ) : null}

          <div className="stat-grid">
            <StatCard
              label="Total meetings"
              value={stats.meetings}
              icon={CalendarDays}
              tone="blue"
              footer={
                stats.meetings
                  ? `${stats.meetingsThisMonth} saved this month`
                  : 'No meetings saved yet'
              }
            />
            <StatCard
              label="Total tasks"
              value={stats.tasks}
              icon={ListChecks}
              tone="violet"
              footer={
                stats.tasks ? `${stats.pending + stats.inProgress} still open` : 'No tasks extracted yet'
              }
            />
            <StatCard
              label="Pending"
              value={stats.pending}
              icon={Clock}
              tone="amber"
              footer={stats.overdue ? `${stats.overdue} overdue` : 'Nothing overdue'}
            />
            <StatCard
              label="In progress"
              value={stats.inProgress}
              icon={CircleDashed}
              tone="cyan"
              footer={`${stats.completed} ${stats.completed === 1 ? 'task' : 'tasks'} completed`}
            />
            <StatCard
              label="Completed"
              value={stats.completed}
              icon={CheckCircle2}
              tone="green"
              footer={`${stats.completionRate}% completion rate`}
            />
          </div>

          <div className="dashboard-grid">
            <div className="stack">
              <Card>
                <CardHeader
                  title="Recent meetings"
                  subtitle="The latest conversations added to your workspace."
                  icon={CalendarDays}
                  action={
                    <Link to="/meetings" className="text-link">
                      View all <ChevronRight size={14} />
                    </Link>
                  }
                />
                {recentMeetings.length ? (
                  <div className="row-list">
                    {recentMeetings.map((meeting) => (
                      <Link
                        to={`/meetings/${meeting.id}`}
                        className="meeting-row"
                        key={meeting.id}
                      >
                        <DateTile date={meeting.meetingDate} />
                        <div className="row-main">
                          <p className="row-title">{meeting.title}</p>
                          <p className="row-meta">
                            {meeting.summary
                              ? meeting.summary.slice(0, 110)
                              : 'No summary available yet.'}
                          </p>
                          <div className="row-chips">
                            <span className="meta-chip">
                              {meeting.decisionCount}{' '}
                              {meeting.decisionCount === 1 ? 'decision' : 'decisions'}
                            </span>
                            <span className="meta-chip">
                              {meeting.taskCount} {meeting.taskCount === 1 ? 'task' : 'tasks'}
                            </span>
                          </div>
                        </div>
                        <ChevronRight size={16} className="row-chevron" aria-hidden="true" />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    compact
                    icon={CalendarDays}
                    title="No meetings yet"
                    description="Your analysed conversations will appear here."
                    action={
                      <Link to="/meetings/new" className="btn btn-secondary btn-sm">
                        <Plus size={14} />
                        <span>Add a meeting</span>
                      </Link>
                    }
                  />
                )}
              </Card>

              <Card>
                <CardHeader
                  title="Recent decisions"
                  subtitle="Confirmed decisions, separated from AI suggestions."
                  icon={Scale}
                  action={
                    <Link to="/decisions" className="text-link">
                      View all <ChevronRight size={14} />
                    </Link>
                  }
                />
                {recentDecisions.length ? (
                  <div className="row-list">
                    {recentDecisions.map((decision) => (
                      <Link
                        to={`/meetings/${decision.meetingId}`}
                        className="decision-row"
                        key={decision.id}
                      >
                        <span className="decision-marker" aria-hidden="true">
                          <Scale size={15} />
                        </span>
                        <div className="row-main">
                          <p className="decision-text">{decision.decisionText}</p>
                          <p className="row-meta">
                            {decision.meetingTitle} · {formatDate(decision.meetingDate)}
                          </p>
                        </div>
                        <Badge tone="success" dot>
                          Confirmed
                        </Badge>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    compact
                    icon={Scale}
                    title="No decisions recorded"
                    description="Confirm a decision in a meeting report to build your decision ledger."
                  />
                )}
              </Card>
            </div>

            <div className="stack">
              <Card>
                <CardHeader
                  title="Upcoming deadlines"
                  subtitle="Open tasks ordered by the closest deadline."
                  icon={CalendarClock}
                  action={
                    <Link to="/tasks" className="text-link">
                      All tasks <ChevronRight size={14} />
                    </Link>
                  }
                />
                {upcoming.length ? (
                  <div className="row-list">
                    {upcoming.map((task) => (
                      <Link to="/tasks" className="deadline-row" key={task.id}>
                        <span className="deadline-date">
                          <span>{formatDate(task.deadline, { year: undefined })}</span>
                          <span>{displayOwner(task.assignedTo)}</span>
                        </span>
                        <div className="row-main">
                          <p className="row-title row-title-small">{task.title}</p>
                          <p className="row-meta">{task.meetingTitle}</p>
                        </div>
                        {deadlineBadge(task)}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    compact
                    icon={CalendarClock}
                    title="No upcoming deadlines"
                    description="Tasks with due dates will show up here."
                  />
                )}
              </Card>

              <Card>
                <CardHeader
                  title="Needs attention"
                  subtitle="Real signals from your current workspace."
                  icon={AlertTriangle}
                />
                <div className="attention-list">
                  <div className={`attention-row ${stats.overdue ? 'attention-danger' : ''}`}>
                    <span className="attention-icon"><Clock size={15} /></span>
                    <div className="attention-copy">
                      <p>Overdue tasks</p>
                      <span>{stats.overdue ? 'Past their deadline' : 'Nothing is overdue'}</span>
                    </div>
                    <span className="attention-value">{stats.overdue}</span>
                  </div>
                  <div className={`attention-row ${stats.missingOwners ? 'attention-warning' : ''}`}>
                    <span className="attention-icon"><UserRoundX size={15} /></span>
                    <div className="attention-copy">
                      <p>Missing owners</p>
                      <span>Tasks without an accountable person</span>
                    </div>
                    <span className="attention-value">{stats.missingOwners}</span>
                  </div>
                  <div className={`attention-row ${stats.missingDeadlines ? 'attention-warning' : ''}`}>
                    <span className="attention-icon"><CalendarClock size={15} /></span>
                    <div className="attention-copy">
                      <p>Missing deadlines</p>
                      <span>Tasks that still need a date</span>
                    </div>
                    <span className="attention-value">{stats.missingDeadlines}</span>
                  </div>
                </div>
                <div className="completion-block">
                  <div className="completion-head">
                    <span>Task completion</span>
                    <strong>{stats.completionRate}%</strong>
                  </div>
                  <div className="progress-track" role="progressbar" aria-valuenow={stats.completionRate} aria-valuemin={0} aria-valuemax={100}>
                    <span className="progress-fill" style={{ width: `${stats.completionRate}%` }} />
                  </div>
                </div>
                <Link to="/tasks" className="attention-link">
                  Review tasks <ArrowRight size={14} />
                </Link>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
