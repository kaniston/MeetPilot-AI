import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  FileText,
  GitBranch,
  GitCompareArrows,
  Link2,
  ListChecks,
  Scale,
  ShieldAlert,
  Sparkles,
  Users,
} from 'lucide-react';
import { api } from '../services/api.js';
import PageHeader from '../components/ui/PageHeader.jsx';
import Card, { CardHeader } from '../components/ui/Card.jsx';
import Badge from '../components/ui/Badge.jsx';
import Alert from '../components/ui/Alert.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import LoadingState from '../components/ui/LoadingState.jsx';
import { reviewMeta } from '../utils/decisionMeta.js';
import {
  displayDeadline,
  displayOwner,
  formatDate,
  formatRelativeTime,
  getInitials,
  titleCaseStatus,
} from '../utils/format.js';

const ITEM_KEYS = [
  'text',
  'point',
  'question',
  'description',
  'risk',
  'dependency',
  'title',
  'summary',
];

function textOf(item) {
  if (typeof item === 'string') return item;
  if (!item || typeof item !== 'object') return 'Not specified';

  for (const key of ITEM_KEYS) {
    if (typeof item[key] === 'string' && item[key].trim()) return item[key];
  }

  return 'Not specified';
}

function secondaryOf(item, keys) {
  if (!item || typeof item !== 'object') return '';
  for (const key of keys) {
    if (typeof item[key] === 'string' && item[key].trim()) return item[key];
  }
  return '';
}

function evidenceOf(item) {
  if (!item || typeof item !== 'object') return '';
  return typeof item.evidence === 'string' ? item.evidence : '';
}

function Evidence({ text }) {
  if (!text) return null;
  return <p className="evidence-inline">“{text}”</p>;
}

function AnalysisList({ items, emptyText, secondaryKeys = [], numbered = false }) {
  if (!items.length) return <p className="section-empty">{emptyText}</p>;

  return (
    <ul className="analysis-list">
      {items.map((item, index) => (
        <li key={`${textOf(item)}-${index}`}>
          <span className={numbered ? 'list-index' : 'list-bullet'} aria-hidden="true">
            {numbered ? String(index + 1).padStart(2, '0') : null}
          </span>
          <div className="analysis-item-copy">
            <p>{textOf(item)}</p>
            {secondaryOf(item, secondaryKeys) ? (
              <p className="analysis-secondary">{secondaryOf(item, secondaryKeys)}</p>
            ) : null}
            <Evidence text={evidenceOf(item)} />
          </div>
        </li>
      ))}
    </ul>
  );
}

const STATUS_TONES = {
  pending: 'warning',
  in_progress: 'blue',
  completed: 'success',
};

export default function MeetingReport() {
  const { id } = useParams();
  const location = useLocation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const justSaved = Boolean(location.state?.justSaved);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function loadMeeting() {
      setLoading(true);
      setError('');

      try {
        const result = await api.getMeeting(id, controller.signal);
        if (active) setData(result);
      } catch (loadError) {
        if (!active || loadError.name === 'AbortError') return;
        setError(loadError.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadMeeting();

    return () => {
      active = false;
      controller.abort();
    };
  }, [id]);

  const report = useMemo(() => {
    if (!data) return null;

    const { meeting, tasks = [], decisions = [], conflicts = [] } = data;
    const analysis = meeting.analysis || {};

    const keyDiscussionPoints = Array.isArray(analysis.keyDiscussionPoints)
      ? analysis.keyDiscussionPoints
      : [];
    const suggestedDecisions = Array.isArray(analysis.suggestedDecisions)
      ? analysis.suggestedDecisions
      : [];
    const unresolvedQuestions = Array.isArray(analysis.unresolvedQuestions)
      ? analysis.unresolvedQuestions
      : [];
    const dependencies = Array.isArray(analysis.dependencies) ? analysis.dependencies : [];
    const risks = Array.isArray(analysis.risks) ? analysis.risks : [];

    const completedTasks = tasks.filter((task) => task.status === 'completed').length;
    const owners = [
      ...new Set(tasks.map((task) => displayOwner(task.assignedTo)).filter((name) => name !== 'Unassigned')),
    ];

    return {
      meeting,
      tasks,
      decisions,
      conflicts,
      analysis,
      keyDiscussionPoints,
      suggestedDecisions,
      unresolvedQuestions,
      dependencies,
      risks,
      completedTasks,
      owners,
      completionRate: tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0,
    };
  }, [data]);

  if (loading) {
    return (
      <div>
        <PageHeader eyebrow="Meeting report" title="Loading meeting report…" />
        <LoadingState />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div>
        <PageHeader
          eyebrow="Meeting report"
          title="Report unavailable"
          actions={
            <Link to="/meetings" className="btn btn-secondary">
              <ArrowLeft size={16} />
              <span>Back to meetings</span>
            </Link>
          }
        />
        <EmptyState
          icon={FileText}
          title="We could not open this meeting"
          description={error || 'The meeting may have been removed from your workspace.'}
          action={
            <Link to="/meetings" className="btn btn-primary btn-sm">
              View meeting history
            </Link>
          }
        />
      </div>
    );
  }

  const {
    meeting,
    tasks,
    decisions,
    conflicts,
    keyDiscussionPoints,
    suggestedDecisions,
    unresolvedQuestions,
    dependencies,
    risks,
    completedTasks,
    owners,
    completionRate,
  } = report;

  return (
    <div>
      <div className="report-back-row">
        <Link to="/meetings" className="back-link">
          <ArrowLeft size={15} />
          All meetings
        </Link>
        <Badge tone="success" dot>Saved report</Badge>
      </div>

      {justSaved ? (
        <Alert tone="success" title="Report saved">
          {decisions.length} {decisions.length === 1 ? 'decision' : 'decisions'} and{' '}
          {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} were added to your workspace
          {conflicts.length
            ? `, along with ${conflicts.length} possible ${conflicts.length === 1 ? 'change' : 'changes'} for review.`
            : '.'}
        </Alert>
      ) : null}

      <PageHeader
        eyebrow={`Meeting report · ${formatDate(meeting.meetingDate)}`}
        title={meeting.title}
        description={`Saved ${formatRelativeTime(meeting.createdAt)} · ${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'} · ${decisions.length} confirmed ${decisions.length === 1 ? 'decision' : 'decisions'}`}
        actions={
          <Link to="/tasks" className="btn btn-secondary">
            <ListChecks size={16} />
            <span>View all tasks</span>
          </Link>
        }
      />

      <div className="report-layout">
        <div className="stack">
          <Card className="summary-card">
            <CardHeader
              title="Executive summary"
              subtitle="A concise record of what this meeting covered."
              icon={Sparkles}
            />
            <p className="summary-text">
              {meeting.analysis?.executiveSummary || meeting.summary || 'No summary was provided.'}
            </p>
          </Card>

          <Card>
            <CardHeader
              title="Key discussion points"
              subtitle="The topics that shaped the conversation."
              icon={FileText}
            />
            <AnalysisList
              items={keyDiscussionPoints}
              numbered
              emptyText="No discussion points were captured for this meeting."
            />
          </Card>

          <Card>
            <CardHeader
              title="Decisions"
              subtitle="Confirmed agreements are kept separate from AI suggestions."
              icon={Scale}
            />

            <div className="decision-section">
              <div className="decision-section-head">
                <span className="section-label section-label-confirmed">
                  <CheckCircle2 size={14} /> Confirmed decisions
                </span>
                <Badge tone="success">{decisions.length}</Badge>
              </div>
              {decisions.length ? (
                <ul className="decision-report-list">
                  {decisions.map((decision) => (
                    <li key={decision.id}>
                      <span className="decision-check" aria-hidden="true">
                        <CheckCircle2 size={15} />
                      </span>
                      <div>
                        <p>{decision.decisionText}</p>
                        <Evidence text={decision.evidence} />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="section-empty">No decisions were confirmed for this meeting.</p>
              )}
            </div>

            <div className="decision-section">
              <div className="decision-section-head">
                <span className="section-label section-label-suggested">
                  <Sparkles size={14} /> Suggested by AI
                </span>
                <Badge tone="warning">{suggestedDecisions.length}</Badge>
              </div>
              {suggestedDecisions.length ? (
                <>
                  <p className="section-note">
                    These were inferred but not confirmed. They are not part of your decision
                    ledger.
                  </p>
                  <AnalysisList
                    items={suggestedDecisions}
                    secondaryKeys={['rationale']}
                    emptyText="No suggested decisions."
                  />
                </>
              ) : (
                <p className="section-empty">No suggested decisions for this meeting.</p>
              )}
            </div>
          </Card>

          {conflicts.length ? (
            <Card className="conflict-panel report-conflict-card">
              <CardHeader
                title="Decision changes flagged"
                subtitle="This meeting may revise or contradict decisions saved earlier. Previous decisions are untouched."
                icon={GitCompareArrows}
                action={<Badge tone="warning">{conflicts.length}</Badge>}
              />
              <div className="conflict-list">
                {conflicts.map((conflict) => {
                  const review = reviewMeta(conflict.reviewStatus);

                  return (
                    <article className="conflict-card" key={conflict.id}>
                      <div className="conflict-head">
                        <Badge tone="warning">Possible change</Badge>
                        <Badge tone={review.tone}>{review.label}</Badge>
                      </div>
                      <div className="conflict-compare">
                        <div className="conflict-side">
                          <span className="conflict-label">Previous decision</span>
                          <p>
                            {conflict.previousDecision?.decisionText || 'Decision unavailable'}
                          </p>
                          <span className="conflict-meta">
                            {conflict.previousDecision?.meetingTitle} ·{' '}
                            {formatDate(conflict.previousDecision?.meetingDate)}
                          </span>
                        </div>
                        <ArrowRight size={18} className="conflict-arrow" aria-hidden="true" />
                        <div className="conflict-side">
                          <span className="conflict-label">New decision</span>
                          <p>{conflict.newDecision?.decisionText || 'Decision unavailable'}</p>
                          <span className="conflict-meta">
                            {conflict.newDecision?.meetingTitle} ·{' '}
                            {formatDate(conflict.newDecision?.meetingDate)}
                          </span>
                        </div>
                      </div>
                      <p className="conflict-explanation">
                        <strong>Why this was flagged:</strong> {conflict.explanation}
                      </p>
                    </article>
                  );
                })}
              </div>
              <Link to="/decisions" className="text-link report-conflict-link">
                Review and classify in the decision ledger <ChevronRight size={14} />
              </Link>
            </Card>
          ) : null}

          <Card>
            <CardHeader
              title="Action items"
              subtitle="Confirmed tasks connected to this meeting."
              icon={ListChecks}
              action={<Badge tone="violet">{tasks.length}</Badge>}
            />
            {tasks.length ? (
              <div className="table-wrap">
                <table className="data-table compact-table">
                  <thead>
                    <tr>
                      <th scope="col">Task</th>
                      <th scope="col">Owner</th>
                      <th scope="col">Deadline</th>
                      <th scope="col">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task) => (
                      <tr key={task.id}>
                        <td data-label="Task">
                          <span className="task-title">{task.title}</span>
                          {task.description ? (
                            <span className="task-description">{task.description}</span>
                          ) : null}
                        </td>
                        <td data-label="Owner">{displayOwner(task.assignedTo)}</td>
                        <td data-label="Deadline">{displayDeadline(task.deadline)}</td>
                        <td data-label="Status">
                          <Badge tone={STATUS_TONES[task.status] || 'neutral'}>
                            {titleCaseStatus(task.status)}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                compact
                icon={ListChecks}
                title="No confirmed tasks"
                description="Action items confirmed during review will be tracked here."
              />
            )}
          </Card>

          <div className="report-two-column">
            <Card>
              <CardHeader
                title="Unresolved questions"
                subtitle="Still open after the meeting."
                icon={CircleHelp}
              />
              <AnalysisList
                items={unresolvedQuestions}
                secondaryKeys={['context', 'owner']}
                emptyText="No unresolved questions were identified."
              />
            </Card>

            <Card>
              <CardHeader
                title="Dependencies"
                subtitle="Work that relies on something else."
                icon={Link2}
              />
              <AnalysisList
                items={dependencies}
                secondaryKeys={['impact', 'owner']}
                emptyText="No dependencies were identified."
              />
            </Card>
          </div>

          <Card>
            <CardHeader
              title="Risks & blockers"
              subtitle="What could stop the agreed work from moving."
              icon={ShieldAlert}
            />
            <AnalysisList
              items={risks}
              secondaryKeys={['impact', 'mitigation']}
              emptyText="No risks or blockers were identified."
            />
          </Card>

          <Card>
            <details className="transcript-details">
              <summary>
                <span>
                  <FileText size={15} /> Original transcript
                </span>
                <span className="transcript-count">
                  {meeting.transcript.trim().split(/\s+/).filter(Boolean).length} words
                </span>
              </summary>
              <pre>{meeting.transcript}</pre>
            </details>
          </Card>
        </div>

        <div className="stack report-aside">
          <Card>
            <CardHeader title="Meeting details" icon={CalendarDays} />
            <div className="aside-rows">
              <div className="aside-row">
                <span>Meeting date</span>
                <strong>{formatDate(meeting.meetingDate)}</strong>
              </div>
              <div className="aside-row">
                <span>Saved</span>
                <strong>{formatRelativeTime(meeting.createdAt)}</strong>
              </div>
              <div className="aside-row">
                <span>Source</span>
                <strong>Gemini analysis</strong>
              </div>
              <div className="aside-row">
                <span>Transcript</span>
                <strong>
                  {meeting.transcript.trim().split(/\s+/).filter(Boolean).length} words
                </strong>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Task progress" icon={ListChecks} />
            <div className="completion-block completion-block-first">
              <div className="completion-head">
                <span>
                  {completedTasks} of {tasks.length} completed
                </span>
                <strong>{completionRate}%</strong>
              </div>
              <div
                className="progress-track"
                role="progressbar"
                aria-valuenow={completionRate}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <span className="progress-fill" style={{ width: `${completionRate}%` }} />
              </div>
            </div>
            <Link to="/tasks" className="text-link aside-link">
              Open task board <ChevronRight size={14} />
            </Link>
          </Card>

          <Card>
            <CardHeader title="People with tasks" icon={Users} />
            {owners.length ? (
              <ul className="owner-list">
                {owners.map((owner) => (
                  <li key={owner}>
                    <span className="avatar-sm" aria-hidden="true">{getInitials(owner)}</span>
                    <span>{owner}</span>
                    <span className="owner-task-count">
                      {tasks.filter((task) => displayOwner(task.assignedTo) === owner).length}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="section-empty">No task owners were assigned.</p>
            )}
          </Card>

          <Card className="tip-card">
            <p className="tip-title"><GitBranch size={15} /> Part of your meeting memory</p>
            <p className="tip-copy">
              This report stays linked to its tasks and decisions. Future analyses can use it as
              context to detect changes.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
