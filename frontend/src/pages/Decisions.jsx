import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, FileText, Loader2, Plus, Scale, Search } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader.jsx';
import Card, { CardHeader } from '../components/ui/Card.jsx';
import Badge from '../components/ui/Badge.jsx';
import Alert from '../components/ui/Alert.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import LoadingState from '../components/ui/LoadingState.jsx';
import { useWorkspace } from '../context/WorkspaceContext.jsx';
import { REVIEW_OPTIONS, reviewMeta } from '../utils/decisionMeta.js';
import { formatDate } from '../utils/format.js';

export default function Decisions() {
  const { decisions, conflicts, loading, updateConflict } = useWorkspace();
  const [query, setQuery] = useState('');
  const [updatingId, setUpdatingId] = useState('');
  const [conflictError, setConflictError] = useState('');

  const filteredDecisions = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return decisions;

    return decisions.filter((decision) => {
      return (
        decision.decisionText.toLowerCase().includes(needle) ||
        (decision.meetingTitle || '').toLowerCase().includes(needle)
      );
    });
  }, [decisions, query]);

  async function handleClassification(conflictId, reviewStatus) {
    setUpdatingId(conflictId);
    setConflictError('');

    try {
      await updateConflict(conflictId, reviewStatus);
    } catch (updateError) {
      setConflictError(updateError.message);
    } finally {
      setUpdatingId('');
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Decision ledger"
        title="What was agreed, and what changed."
        description="Confirmed decisions are recorded with their source meeting. Nothing is overwritten automatically."
        actions={
          <Link to="/meetings/new" className="btn btn-primary">
            <Plus size={16} />
            <span>New meeting</span>
          </Link>
        }
      />

      {loading ? (
        <LoadingState label="Loading decisions…" />
      ) : (
        <>
          {conflicts.length > 0 ? (
            <Card className="conflict-panel">
              <CardHeader
                title="Decision changes to review"
                subtitle="MeetPilot flags possible contradictions between saved decisions. You decide what each change means."
                icon={Scale}
              />

              {conflictError ? (
                <Alert tone="danger" title="Could not save the classification">
                  {conflictError}
                </Alert>
              ) : null}

              <div className="conflict-list">
                {conflicts.map((conflict) => {
                  const review = reviewMeta(conflict.reviewStatus);
                  const suggested = reviewMeta(conflict.suggestedClassification);
                  const updating = updatingId === conflict.id;

                  return (
                    <article className="conflict-card" key={conflict.id}>
                      <div className="conflict-head">
                        <Badge tone="warning">Possible change</Badge>
                        <Badge tone={review.tone}>{review.label}</Badge>
                      </div>
                      <div className="conflict-compare">
                        <div className="conflict-side">
                          <span className="conflict-label">Previous decision</span>
                          <p>{conflict.previousDecision?.decisionText || 'Decision unavailable'}</p>
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

                      <div className="conflict-review">
                        <div className="conflict-review-suggestion">
                          <span className="conflict-label">AI suggested</span>
                          <Badge tone={suggested.tone}>{suggested.label}</Badge>
                        </div>
                        <label className="conflict-classify">
                          <span className="conflict-label">Your classification</span>
                          <select
                            className="select"
                            value={conflict.reviewStatus}
                            onChange={(event) =>
                              handleClassification(conflict.id, event.target.value)
                            }
                            disabled={updating}
                            aria-label="Classify this decision change"
                          >
                            {REVIEW_OPTIONS.map((option) => (
                              <option value={option.value} key={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        {updating ? (
                          <span className="conflict-saving">
                            <Loader2 size={13} className="spin" /> Saving…
                          </span>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            </Card>
          ) : null}

          <Card className="list-card">
            <div className="toolbar">
              <label className="search-field">
                <Search size={16} aria-hidden="true" />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search decisions or meetings"
                  aria-label="Search decisions"
                />
              </label>
              <span className="result-count">
                {filteredDecisions.length}{' '}
                {filteredDecisions.length === 1 ? 'decision' : 'decisions'}
              </span>
            </div>

            {decisions.length === 0 ? (
              <EmptyState
                icon={Scale}
                title="No confirmed decisions yet"
                description="When you confirm a decision in a meeting report, it is recorded here with its source and transcript evidence."
                action={
                  <Link to="/meetings/new" className="btn btn-primary btn-sm">
                    <Plus size={14} />
                    <span>Analyse a meeting</span>
                  </Link>
                }
              />
            ) : filteredDecisions.length === 0 ? (
              <EmptyState
                icon={Search}
                title="No decisions match your search"
                description={`Nothing found for “${query}”. Try another keyword.`}
                action={
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setQuery('')}>
                    Clear search
                  </button>
                }
              />
            ) : (
              <div className="decision-list">
                {filteredDecisions.map((decision) => (
                  <article className="decision-card" key={decision.id}>
                    <div className="decision-card-top">
                      <span className="decision-card-icon" aria-hidden="true">
                        <Scale size={17} />
                      </span>
                      <div className="decision-card-meta">
                        <Link to={`/meetings/${decision.meetingId}`} className="table-link">
                          {decision.meetingTitle}
                        </Link>
                        <span>{formatDate(decision.meetingDate)}</span>
                      </div>
                      <Badge tone="success" dot>
                        Confirmed
                      </Badge>
                    </div>
                    <p className="decision-card-text">{decision.decisionText}</p>
                    {decision.evidence ? (
                      <div className="evidence-block">
                        <span className="evidence-label">
                          <FileText size={12} /> Transcript evidence
                        </span>
                        <p>“{decision.evidence}”</p>
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
