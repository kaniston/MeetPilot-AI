import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CircleHelp,
  FileText,
  GitCompareArrows,
  Link2,
  ListChecks,
  Loader2,
  Plus,
  RefreshCw,
  Scale,
  ShieldAlert,
  Sparkles,
  Trash2,
} from 'lucide-react';
import PageHeader from '../ui/PageHeader.jsx';
import Card, { CardHeader } from '../ui/Card.jsx';
import Badge from '../ui/Badge.jsx';
import Alert from '../ui/Alert.jsx';
import { api } from '../../services/api.js';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import { REVIEW_OPTIONS, reviewMeta } from '../../utils/decisionMeta.js';
import { formatDate } from '../../utils/format.js';

let keyCounter = 0;

function makeKey() {
  keyCounter += 1;
  return `decision-${Date.now()}-${keyCounter}`;
}

function normaliseText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function guessDecisionKey(comparison, decisions) {
  if (!decisions.length) return '';

  const target = normaliseText(comparison.newDecision);
  if (!target) return decisions[0].key;

  const exact = decisions.find((decision) => normaliseText(decision.text) === target);
  if (exact) return exact.key;

  const contained = decisions.find((decision) => {
    const candidate = normaliseText(decision.text);
    return candidate && (candidate.includes(target) || target.includes(candidate));
  });
  if (contained) return contained.key;

  const targetWords = new Set(target.split(' ').filter((word) => word.length > 3));
  let bestKey = decisions[0].key;
  let bestScore = 0;

  for (const decision of decisions) {
    const candidateWords = new Set(
      normaliseText(decision.text)
        .split(' ')
        .filter((word) => word.length > 3),
    );
    let score = 0;
    for (const word of targetWords) {
      if (candidateWords.has(word)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      bestKey = decision.key;
    }
  }

  return bestKey;
}

function Field({ label, children }) {
  return (
    <label className="review-field">
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}

function ReviewCheck({ checked, onChange, label = 'Confirm' }) {
  return (
    <label className="review-check">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span>{label}</span>
    </label>
  );
}

function AddRowButton({ onClick, children }) {
  return (
    <button type="button" className="review-add" onClick={onClick}>
      <Plus size={14} />
      {children}
    </button>
  );
}

function RemoveButton({ onClick, label }) {
  return (
    <button type="button" className="icon-btn review-remove" onClick={onClick} aria-label={label}>
      <Trash2 size={14} />
    </button>
  );
}

export default function AnalysisReview({ initial, meeting, onBack }) {
  const navigate = useNavigate();
  const { refresh } = useWorkspace();
  const analysis = initial.analysis;

  const initialDecisions = useMemo(
    () =>
      (analysis.confirmedDecisions || []).map((decision, index) => ({
        ...decision,
        // Deterministic keys keep comparison links stable across StrictMode renders.
        key: `decision-${index}`,
        confirmed: true,
      })),
    [analysis.confirmedDecisions],
  );

  const [title, setTitle] = useState(meeting.title);
  const [meetingDate, setMeetingDate] = useState(meeting.meetingDate);
  const [summary, setSummary] = useState(analysis.executiveSummary || '');
  const [points, setPoints] = useState(
    (analysis.keyDiscussionPoints || []).map((item) => ({ ...item })),
  );
  const [decisions, setDecisions] = useState(initialDecisions);
  const [suggestions, setSuggestions] = useState(
    (analysis.suggestedDecisions || []).map((item) => ({ ...item })),
  );
  const [tasks, setTasks] = useState(
    (analysis.actionItems || []).map((item) => ({ ...item, confirmed: true })),
  );
  const [questions, setQuestions] = useState(
    (analysis.unresolvedQuestions || []).map((item) => ({ ...item })),
  );
  const [dependencies, setDependencies] = useState(
    (analysis.dependencies || []).map((item) => ({ ...item })),
  );
  const [risks, setRisks] = useState((analysis.risks || []).map((item) => ({ ...item })));
  const [comparisons, setComparisons] = useState(() =>
    (analysis.decisionComparisons || []).map((comparison) => ({
      ...comparison,
      decisionKey: guessDecisionKey(comparison, initialDecisions),
      reviewStatus: 'unreviewed',
    })),
  );
  const [saving, setSaving] = useState(false);
  const [rechecking, setRechecking] = useState(false);
  const [error, setError] = useState('');
  const [recheckNote, setRecheckNote] = useState('');

  const confirmedDecisions = decisions.filter(
    (decision) => decision.confirmed && decision.text.trim(),
  );
  const confirmedTasks = tasks.filter((task) => task.confirmed && task.title.trim());
  const wordCount = meeting.transcript.trim().split(/\s+/).filter(Boolean).length;

  function updateItem(setter, index, patch) {
    setter((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)),
    );
  }

  function removeItem(setter, index) {
    setter((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function promoteSuggestion(index) {
    const suggestion = suggestions[index];
    if (!suggestion) return;

    const newDecision = {
      key: makeKey(),
      text: suggestion.text,
      evidence: suggestion.evidence || '',
      confirmed: true,
    };

    setDecisions((current) => [...current, newDecision]);
    setSuggestions((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  async function handleRecheck() {
    if (!confirmedDecisions.length) {
      setError('Confirm at least one decision before checking for changes.');
      return;
    }

    setRechecking(true);
    setError('');
    setRecheckNote('');

    try {
      const result = await api.compareDecisions({
        meetingDate,
        decisions: confirmedDecisions.map((decision) => ({ text: decision.text })),
      });

      const nextComparisons = (result.comparisons || []).map((comparison) => ({
        ...comparison,
        decisionKey: guessDecisionKey(comparison, confirmedDecisions),
        reviewStatus: 'unreviewed',
      }));

      setComparisons(nextComparisons);
      setRecheckNote(
        nextComparisons.length
          ? `${nextComparisons.length} possible ${nextComparisons.length === 1 ? 'change' : 'changes'} found against saved decisions.`
          : 'No material changes were found against saved decisions.',
      );
    } catch (recheckError) {
      setError(recheckError.message);
    } finally {
      setRechecking(false);
    }
  }

  async function handleSave() {
    if (!title.trim() || !meetingDate) {
      setError('A meeting title and date are required before saving.');
      return;
    }

    if (!confirmedDecisions.length && !confirmedTasks.length) {
      setError('Confirm at least one decision or task before saving the report.');
      return;
    }

    const linkedKeys = new Set(confirmedDecisions.map((decision) => decision.key));
    if (comparisons.some((comparison) => !linkedKeys.has(comparison.decisionKey))) {
      setError(
        'Link every flagged decision change to a confirmed decision, or remove the change before saving.',
      );
      return;
    }

    setSaving(true);
    setError('');

    const confirmedDecisionPayload = confirmedDecisions.map((decision) => ({
      text: decision.text.trim(),
      evidence: decision.evidence || '',
    }));

    const conflictPayload = comparisons
      .map((comparison) => {
        const index = confirmedDecisions.findIndex(
          (decision) => decision.key === comparison.decisionKey,
        );

        if (index === -1) return null;

        return {
          previousDecisionId: comparison.previousDecisionId,
          newDecisionIndex: index,
          newDecision: confirmedDecisionPayload[index].text,
          explanation: comparison.explanation,
          suggestedClassification: comparison.suggestedClassification,
          reviewStatus: comparison.reviewStatus,
        };
      })
      .filter(Boolean);

    const analysisPayload = {
      executiveSummary: summary.trim() || 'Not specified',
      keyDiscussionPoints: points
        .filter((point) => point.point.trim())
        .map((point) => ({ point: point.point.trim(), evidence: point.evidence || '' })),
      confirmedDecisions: confirmedDecisionPayload,
      suggestedDecisions: [
        ...suggestions
          .filter((suggestion) => suggestion.text.trim())
          .map((suggestion) => ({
            text: suggestion.text.trim(),
            rationale: suggestion.rationale || '',
            evidence: suggestion.evidence || '',
          })),
        ...decisions
          .filter((decision) => !decision.confirmed && decision.text.trim())
          .map((decision) => ({
            text: decision.text.trim(),
            rationale: 'Extracted as a decision but not confirmed during review.',
            evidence: decision.evidence || '',
          })),
      ],
      actionItems: tasks
        .filter((task) => task.title.trim())
        .map((task) => ({
          title: task.title.trim(),
          description: task.description || '',
          assignedTo: task.assignedTo || '',
          deadline: task.deadline || null,
          evidence: task.evidence || '',
          confirmed: task.confirmed,
        })),
      unresolvedQuestions: questions
        .filter((question) => question.question.trim())
        .map((question) => ({
          question: question.question.trim(),
          context: question.context || '',
          owner: question.owner || '',
        })),
      dependencies: dependencies
        .filter((dependency) => dependency.dependency.trim())
        .map((dependency) => ({
          dependency: dependency.dependency.trim(),
          impact: dependency.impact || '',
          owner: dependency.owner || '',
        })),
      risks: risks
        .filter((risk) => risk.risk.trim())
        .map((risk) => ({
          risk: risk.risk.trim(),
          impact: risk.impact || '',
          mitigation: risk.mitigation || '',
        })),
      decisionComparisons: comparisons.map((comparison) => ({
        previousDecisionId: comparison.previousDecisionId,
        previousDecision: comparison.previousDecision,
        newDecision: comparison.newDecision,
        explanation: comparison.explanation,
        suggestedClassification: comparison.suggestedClassification,
      })),
    };

    try {
      const result = await api.createMeeting({
        title: title.trim(),
        meetingDate,
        transcript: meeting.transcript,
        analysis: analysisPayload,
        decisions: confirmedDecisionPayload,
        actionItems: confirmedTasks.map((task) => ({
          title: task.title.trim(),
          description: task.description || '',
          assignedTo: task.assignedTo || '',
          deadline: task.deadline || null,
          evidence: task.evidence || '',
        })),
        conflicts: conflictPayload,
      });

      refresh();
      navigate(`/meetings/${result.meeting.id}`, { state: { justSaved: true } });
    } catch (saveError) {
      setError(saveError.message);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Review analysis"
        title="Confirm what gets saved."
        description="Gemini extracted this from the transcript. Edit anything that is wrong, then confirm the decisions and tasks you want tracked."
        actions={
          <button type="button" className="btn btn-secondary" onClick={onBack} disabled={saving}>
            <ArrowLeft size={16} />
            <span>Edit transcript</span>
          </button>
        }
      />

      {error ? (
        <Alert tone="danger" title="Could not save the report">
          {error}
        </Alert>
      ) : null}

      <Alert tone="info" title="AI output is a draft">
        Nothing is saved until you press Save report. Unconfirmed decisions stay suggestions, and
        only confirmed action items become tracked tasks.
      </Alert>

      <div className="review-layout">
        <div className="review-main">
          <Card>
            <CardHeader
              title="Meeting overview"
              subtitle="Correct the title, date, or summary before saving."
              icon={Sparkles}
            />
            <div className="review-overview">
              <div className="form-row">
                <Field label="Meeting title">
                  <input
                    className="input"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    maxLength={180}
                  />
                </Field>
                <Field label="Meeting date">
                  <input
                    className="input"
                    type="date"
                    value={meetingDate}
                    onChange={(event) => setMeetingDate(event.target.value)}
                  />
                </Field>
              </div>
              <Field label="Executive summary">
                <textarea
                  className="input textarea review-summary"
                  value={summary}
                  onChange={(event) => setSummary(event.target.value)}
                  rows={5}
                  maxLength={6000}
                />
              </Field>
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Key discussion points"
              subtitle="Edit the points or remove anything the transcript does not support."
              icon={FileText}
              action={<Badge tone="blue">{points.length}</Badge>}
            />
            <div className="review-list">
              {points.map((point, index) => (
                <div className="review-row" key={`point-${index}`}>
                  <div className="review-row-top">
                    <span className="review-row-index">{String(index + 1).padStart(2, '0')}</span>
                    <input
                      className="input"
                      value={point.point}
                      onChange={(event) =>
                        updateItem(setPoints, index, { point: event.target.value })
                      }
                      aria-label={`Discussion point ${index + 1}`}
                    />
                    <RemoveButton
                      onClick={() => removeItem(setPoints, index)}
                      label={`Remove discussion point ${index + 1}`}
                    />
                  </div>
                  {point.evidence ? (
                    <p className="review-evidence">“{point.evidence}”</p>
                  ) : null}
                </div>
              ))}
            </div>
            <AddRowButton onClick={() => setPoints((current) => [...current, { point: '', evidence: '' }])}>
              Add discussion point
            </AddRowButton>
          </Card>

          <Card>
            <CardHeader
              title="Decisions"
              subtitle="Confirmed decisions enter your ledger. Suggestions stay separate."
              icon={Scale}
              action={<Badge tone="success">{confirmedDecisions.length} confirmed</Badge>}
            />
            <div className="review-list">
              {decisions.map((decision, index) => (
                <div
                  className={`review-row ${decision.confirmed ? 'review-row-confirmed' : ''}`}
                  key={decision.key}
                >
                  <div className="review-row-top">
                    <ReviewCheck
                      checked={decision.confirmed}
                      onChange={(event) =>
                        updateItem(setDecisions, index, { confirmed: event.target.checked })
                      }
                    />
                    <input
                      className="input"
                      value={decision.text}
                      onChange={(event) =>
                        updateItem(setDecisions, index, { text: event.target.value })
                      }
                      aria-label={`Decision ${index + 1}`}
                    />
                    <RemoveButton
                      onClick={() => removeItem(setDecisions, index)}
                      label={`Remove decision ${index + 1}`}
                    />
                  </div>
                  {decision.evidence ? (
                    <p className="review-evidence">“{decision.evidence}”</p>
                  ) : null}
                </div>
              ))}
            </div>
            <AddRowButton
              onClick={() =>
                setDecisions((current) => [
                  ...current,
                  { key: makeKey(), text: '', evidence: '', confirmed: true },
                ])
              }
            >
              Add decision
            </AddRowButton>

            {suggestions.length ? (
              <div className="review-subsection">
                <div className="review-subsection-head">
                  <span className="section-label section-label-suggested">
                    <Sparkles size={14} /> Suggested by AI
                  </span>
                  <Badge tone="warning">{suggestions.length}</Badge>
                </div>
                <p className="section-note">
                  These were not confirmed in the meeting. Promote one only if the transcript
                  supports it.
                </p>
                <div className="review-list">
                  {suggestions.map((suggestion, index) => (
                    <div className="review-row review-row-suggested" key={`suggestion-${index}`}>
                      <div className="review-row-top">
                        <input
                          className="input"
                          value={suggestion.text}
                          onChange={(event) =>
                            updateItem(setSuggestions, index, { text: event.target.value })
                          }
                          aria-label={`Suggested decision ${index + 1}`}
                        />
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => promoteSuggestion(index)}
                        >
                          <CheckCircle2 size={14} />
                          <span>Confirm</span>
                        </button>
                        <RemoveButton
                          onClick={() => removeItem(setSuggestions, index)}
                          label={`Remove suggested decision ${index + 1}`}
                        />
                      </div>
                      {suggestion.rationale ? (
                        <p className="review-rationale">{suggestion.rationale}</p>
                      ) : null}
                      {suggestion.evidence ? (
                        <p className="review-evidence">“{suggestion.evidence}”</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="review-subsection">
              <div className="review-subsection-head">
                <span className="section-label">
                  <GitCompareArrows size={14} /> Decision changes
                </span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleRecheck}
                  disabled={rechecking || !confirmedDecisions.length}
                >
                  {rechecking ? (
                    <Loader2 size={14} className="spin" />
                  ) : (
                    <RefreshCw size={14} />
                  )}
                  <span>{rechecking ? 'Checking…' : 'Re-check changes'}</span>
                </button>
              </div>
              <p className="section-note">
                MeetPilot compares these decisions with previously saved ones. Nothing is
                overwritten.
              </p>
              {recheckNote ? <p className="review-note">{recheckNote}</p> : null}
              {comparisons.length ? (
                <div className="comparison-review-list">
                  {comparisons.map((comparison, index) => (
                    <article className="comparison-review" key={`comparison-${index}`}>
                      <div className="comparison-review-head">
                        <Badge tone="warning">Possible change</Badge>
                        <span className="comparison-suggested">
                          AI suggests{' '}
                          <strong>{reviewMeta(comparison.suggestedClassification).label}</strong>
                        </span>
                        <RemoveButton
                          onClick={() => removeItem(setComparisons, index)}
                          label={`Remove comparison ${index + 1}`}
                        />
                      </div>
                      <div className="comparison-review-grid">
                        <div>
                          <span className="conflict-label">Previous decision</span>
                          <p>{comparison.previousDecision}</p>
                          <span className="conflict-meta">
                            {comparison.previousMeetingTitle} ·{' '}
                            {formatDate(comparison.previousMeetingDate)}
                          </span>
                        </div>
                        <ArrowRight size={16} className="conflict-arrow" aria-hidden="true" />
                        <div>
                          <span className="conflict-label">New decision</span>
                          <p>{comparison.newDecision}</p>
                        </div>
                      </div>
                      <p className="conflict-explanation">
                        <strong>Why this was flagged:</strong> {comparison.explanation}
                      </p>
                      <div className="classification-row">
                        <Field label="Link to confirmed decision">
                          <select
                            className="select select-full"
                            value={comparison.decisionKey}
                            onChange={(event) =>
                              updateItem(setComparisons, index, {
                                decisionKey: event.target.value,
                              })
                            }
                          >
                            <option value="">Select a decision</option>
                            {comparison.decisionKey &&
                            !decisions.some(
                              (decision) =>
                                decision.key === comparison.decisionKey &&
                                decision.confirmed &&
                                decision.text.trim(),
                            ) ? (
                              <option value={comparison.decisionKey}>
                                Linked decision is not confirmed
                              </option>
                            ) : null}
                            {decisions
                              .filter((decision) => decision.confirmed && decision.text.trim())
                              .map((decision) => (
                                <option value={decision.key} key={decision.key}>
                                  {decision.text.slice(0, 70)}
                                </option>
                              ))}
                          </select>
                        </Field>
                        <Field label="Your classification">
                          <select
                            className="select select-full"
                            value={comparison.reviewStatus}
                            onChange={(event) =>
                              updateItem(setComparisons, index, {
                                reviewStatus: event.target.value,
                              })
                            }
                          >
                            {REVIEW_OPTIONS.map((option) => (
                              <option value={option.value} key={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </Field>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="section-empty">No possible changes were detected.</p>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Action items"
              subtitle="Only confirmed items become tasks. Missing owners and deadlines stay visible."
              icon={ListChecks}
              action={<Badge tone="violet">{confirmedTasks.length} confirmed</Badge>}
            />
            <div className="review-list">
              {tasks.map((task, index) => (
                <div
                  className={`review-row ${task.confirmed ? 'review-row-confirmed' : ''}`}
                  key={`task-${index}`}
                >
                  <div className="review-row-top">
                    <ReviewCheck
                      checked={task.confirmed}
                      onChange={(event) =>
                        updateItem(setTasks, index, { confirmed: event.target.checked })
                      }
                    />
                    <input
                      className="input"
                      value={task.title}
                      onChange={(event) =>
                        updateItem(setTasks, index, { title: event.target.value })
                      }
                      aria-label={`Task title ${index + 1}`}
                    />
                    <RemoveButton
                      onClick={() => removeItem(setTasks, index)}
                      label={`Remove task ${index + 1}`}
                    />
                  </div>
                  <div className="review-row-grid">
                    <Field label="Owner">
                      <input
                        className="input"
                        value={task.assignedTo || ''}
                        onChange={(event) =>
                          updateItem(setTasks, index, { assignedTo: event.target.value })
                        }
                        placeholder="Not specified"
                        aria-label={`Task owner ${index + 1}`}
                      />
                    </Field>
                    <Field label="Deadline">
                      <input
                        className="input"
                        type="date"
                        value={task.deadline || ''}
                        onChange={(event) =>
                          updateItem(setTasks, index, { deadline: event.target.value || null })
                        }
                        aria-label={`Task deadline ${index + 1}`}
                      />
                    </Field>
                  </div>
                  <Field label="Description">
                    <textarea
                      className="input textarea"
                      value={task.description || ''}
                      onChange={(event) =>
                        updateItem(setTasks, index, { description: event.target.value })
                      }
                      rows={2}
                      aria-label={`Task description ${index + 1}`}
                    />
                  </Field>
                  {task.evidence ? <p className="review-evidence">“{task.evidence}”</p> : null}
                </div>
              ))}
            </div>
            <AddRowButton
              onClick={() =>
                setTasks((current) => [
                  ...current,
                  {
                    title: '',
                    description: '',
                    assignedTo: '',
                    deadline: null,
                    evidence: '',
                    confirmed: true,
                  },
                ])
              }
            >
              Add task
            </AddRowButton>
          </Card>

          <div className="report-two-column">
            <Card>
              <CardHeader
                title="Unresolved questions"
                subtitle="Still open after the meeting."
                icon={CircleHelp}
                action={<Badge tone="neutral">{questions.length}</Badge>}
              />
              <div className="review-list">
                {questions.map((question, index) => (
                  <div className="review-row" key={`question-${index}`}>
                    <div className="review-row-top">
                      <input
                        className="input"
                        value={question.question}
                        onChange={(event) =>
                          updateItem(setQuestions, index, { question: event.target.value })
                        }
                        aria-label={`Unresolved question ${index + 1}`}
                      />
                      <RemoveButton
                        onClick={() => removeItem(setQuestions, index)}
                        label={`Remove question ${index + 1}`}
                      />
                    </div>
                    <input
                      className="input review-small-input"
                      value={question.context || ''}
                      onChange={(event) =>
                        updateItem(setQuestions, index, { context: event.target.value })
                      }
                      placeholder="Context"
                      aria-label={`Question context ${index + 1}`}
                    />
                  </div>
                ))}
              </div>
              <AddRowButton
                onClick={() =>
                  setQuestions((current) => [...current, { question: '', context: '', owner: '' }])
                }
              >
                Add question
              </AddRowButton>
            </Card>

            <Card>
              <CardHeader
                title="Dependencies"
                subtitle="Work that relies on something else."
                icon={Link2}
                action={<Badge tone="neutral">{dependencies.length}</Badge>}
              />
              <div className="review-list">
                {dependencies.map((dependency, index) => (
                  <div className="review-row" key={`dependency-${index}`}>
                    <div className="review-row-top">
                      <input
                        className="input"
                        value={dependency.dependency}
                        onChange={(event) =>
                          updateItem(setDependencies, index, {
                            dependency: event.target.value,
                          })
                        }
                        aria-label={`Dependency ${index + 1}`}
                      />
                      <RemoveButton
                        onClick={() => removeItem(setDependencies, index)}
                        label={`Remove dependency ${index + 1}`}
                      />
                    </div>
                    <input
                      className="input review-small-input"
                      value={dependency.impact || ''}
                      onChange={(event) =>
                        updateItem(setDependencies, index, { impact: event.target.value })
                      }
                      placeholder="Impact"
                      aria-label={`Dependency impact ${index + 1}`}
                    />
                  </div>
                ))}
              </div>
              <AddRowButton
                onClick={() =>
                  setDependencies((current) => [
                    ...current,
                    { dependency: '', impact: '', owner: '' },
                  ])
                }
              >
                Add dependency
              </AddRowButton>
            </Card>
          </div>

          <Card>
            <CardHeader
              title="Risks & blockers"
              subtitle="What could stop the agreed work from moving."
              icon={ShieldAlert}
              action={<Badge tone="neutral">{risks.length}</Badge>}
            />
            <div className="review-list">
              {risks.map((risk, index) => (
                <div className="review-row" key={`risk-${index}`}>
                  <div className="review-row-top">
                    <input
                      className="input"
                      value={risk.risk}
                      onChange={(event) =>
                        updateItem(setRisks, index, { risk: event.target.value })
                      }
                      aria-label={`Risk ${index + 1}`}
                    />
                    <RemoveButton
                      onClick={() => removeItem(setRisks, index)}
                      label={`Remove risk ${index + 1}`}
                    />
                  </div>
                  <div className="review-row-grid">
                    <Field label="Impact">
                      <input
                        className="input"
                        value={risk.impact || ''}
                        onChange={(event) =>
                          updateItem(setRisks, index, { impact: event.target.value })
                        }
                        aria-label={`Risk impact ${index + 1}`}
                      />
                    </Field>
                    <Field label="Mitigation">
                      <input
                        className="input"
                        value={risk.mitigation || ''}
                        onChange={(event) =>
                          updateItem(setRisks, index, { mitigation: event.target.value })
                        }
                        placeholder="Not specified"
                        aria-label={`Risk mitigation ${index + 1}`}
                      />
                    </Field>
                  </div>
                </div>
              ))}
            </div>
            <AddRowButton
              onClick={() =>
                setRisks((current) => [...current, { risk: '', impact: '', mitigation: '' }])
              }
            >
              Add risk
            </AddRowButton>
          </Card>
        </div>

        <div className="stack review-aside">
          <Card>
            <CardHeader title="Save summary" icon={CheckCircle2} />
            <div className="review-counts">
              <div className="aside-row">
                <span>Confirmed decisions</span>
                <strong>{confirmedDecisions.length}</strong>
              </div>
              <div className="aside-row">
                <span>Confirmed tasks</span>
                <strong>{confirmedTasks.length}</strong>
              </div>
              <div className="aside-row">
                <span>Possible changes</span>
                <strong>{comparisons.length}</strong>
              </div>
              <div className="aside-row">
                <span>Transcript</span>
                <strong>{wordCount} words</strong>
              </div>
              <div className="aside-row">
                <span>Model</span>
                <strong>{initial.meta?.model || 'Gemini'}</strong>
              </div>
              <div className="aside-row">
                <span>Prior meetings used</span>
                <strong>{initial.meta?.contextMeetings?.length || 0}</strong>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-primary review-save"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <Loader2 size={16} className="spin" /> : <CheckCircle2 size={16} />}
              <span>{saving ? 'Saving report…' : 'Save report'}</span>
            </button>
            <p className="review-save-note">
              Saving records the report, creates confirmed decisions and tasks, and stores any
              reviewed decision changes. Previous decisions are never overwritten.
            </p>
          </Card>

          <Card className="tip-card">
            <p className="tip-title">
              <Scale size={15} /> Review before you save
            </p>
            <p className="tip-copy">
              AI extraction can miss context. Check owners and deadlines against the transcript.
              Leave anything uncertain unconfirmed.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
