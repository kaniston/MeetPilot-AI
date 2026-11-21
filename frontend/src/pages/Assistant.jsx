import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bot,
  CalendarDays,
  Database,
  FileText,
  ListChecks,
  Loader2,
  Lock,
  RotateCcw,
  Scale,
  Send,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader.jsx';
import Card, { CardHeader } from '../components/ui/Card.jsx';
import Alert from '../components/ui/Alert.jsx';
import Badge from '../components/ui/Badge.jsx';
import { api } from '../services/api.js';
import { useWorkspace } from '../context/WorkspaceContext.jsx';
import { formatDate } from '../utils/format.js';

const SUGGESTED_QUESTIONS = [
  'What happened in our last meeting?',
  'Which tasks are pending?',
  'Did we change any previous decisions?',
  'What should we focus on next?',
];

function makeId() {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function AssistantMessage({ message }) {
  const isAssistant = message.role === 'assistant';

  return (
    <div className={`chat-message chat-message-${message.role}`}>
      {isAssistant ? (
        <span className="chat-message-avatar" aria-hidden="true">
          <Bot size={15} />
        </span>
      ) : null}
      <div className="chat-message-main">
        <div className="chat-bubble">
          <p>{message.content}</p>
        </div>
        {message.references?.length ? (
          <div className="chat-references">
            <span className="chat-references-label">
              <FileText size={11} /> Sources
            </span>
            <div className="chat-reference-list">
              {message.references.map((reference) => (
                <Link
                  className="chat-reference"
                  to={`/meetings/${reference.id}`}
                  key={reference.id}
                >
                  <CalendarDays size={11} />
                  <span>{reference.title}</span>
                  <span className="chat-reference-date">
                    {formatDate(reference.meetingDate)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function Assistant() {
  const { meetings, tasks, decisions, health } = useWorkspace();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const threadRef = useRef(null);

  const aiReady = Boolean(health?.ai?.configured);
  const canChat = aiReady && !sending;

  useEffect(() => {
    const node = threadRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages, sending]);

  async function sendMessage(raw) {
    const text = String(raw || '').trim();
    if (!text || sending || !aiReady) return;

    const history = messages.slice(-8).map(({ role, content }) => ({ role, content }));
    const userMessage = { id: makeId(), role: 'user', content: text };

    setMessages((current) => [...current, userMessage]);
    setInput('');
    setError('');
    setSending(true);

    try {
      const result = await api.chat({ message: text, history });

      setMessages((current) => [
        ...current,
        {
          id: makeId(),
          role: 'assistant',
          content: result.answer,
          references: result.references || [],
        },
      ]);
    } catch (requestError) {
      setMessages((current) => current.filter((message) => message.id !== userMessage.id));
      setInput(text);
      setError(requestError.message);
    } finally {
      setSending(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    sendMessage(input);
  }

  function resetConversation() {
    setMessages([]);
    setInput('');
    setError('');
  }

  const hasThread = messages.length > 0 || sending;

  return (
    <div>
      <PageHeader
        eyebrow="AI assistant"
        title="Ask your meeting memory anything."
        description="Grounded answers about decisions, owners, deadlines, and open issues — with meeting references."
      />

      {health && !aiReady ? (
        <Alert
          tone="warning"
          title="Gemini is not configured"
          action={
            <Link to="/settings" className="text-link">
              Open settings <span aria-hidden="true">→</span>
            </Link>
          }
        >
          Add <code>GEMINI_API_KEY</code> to <code>backend/.env</code> and restart the API to enable
          the assistant.
        </Alert>
      ) : null}

      <div className="assistant-layout">
        <Card className="chat-card">
          <div className="chat-header">
            <span className="chat-avatar" aria-hidden="true">
              <Bot size={19} />
            </span>
            <div className="chat-heading">
              <p className="chat-title">MeetPilot assistant</p>
              <p className="chat-subtitle">
                Grounded in {meetings.length} saved {meetings.length === 1 ? 'meeting' : 'meetings'}
              </p>
            </div>
            {messages.length ? (
              <button
                type="button"
                className="icon-btn"
                onClick={resetConversation}
                aria-label="Start a new conversation"
                title="New conversation"
              >
                <RotateCcw size={14} />
              </button>
            ) : null}
            <Badge
              tone={aiReady ? 'success' : health ? 'warning' : 'neutral'}
              dot
            >
              {aiReady ? 'Grounded' : health ? 'Setup needed' : 'Checking'}
            </Badge>
          </div>

          <div
            className={`chat-body ${hasThread ? 'chat-body-thread' : ''}`}
            ref={threadRef}
          >
            {hasThread ? (
              <div className="chat-thread">
                {messages.map((message) => (
                  <AssistantMessage message={message} key={message.id} />
                ))}

                {sending ? (
                  <div className="chat-message chat-message-assistant">
                    <span className="chat-message-avatar" aria-hidden="true">
                      <Bot size={15} />
                    </span>
                    <div className="chat-message-main">
                      <div className="chat-bubble chat-bubble-loading">
                        <span className="typing-dots" aria-hidden="true">
                          <span />
                          <span />
                          <span />
                        </span>
                        <span>Searching your saved meetings…</span>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="chat-empty">
                <span className="chat-empty-icon" aria-hidden="true">
                  <Sparkles size={26} strokeWidth={1.7} />
                </span>
                <h2>Your workspace has a memory.</h2>
                <p>
                  Ask about past meetings, decisions, assigned work, or what changed. MeetPilot will
                  cite the meetings it used and say when the answer is not in your history.
                </p>

                {meetings.length === 0 ? (
                  <p className="chat-empty-note">
                    No meetings are saved yet, so the assistant has nothing to search.{' '}
                    <Link to="/meetings/new" className="text-link">
                      Analyse your first meeting
                    </Link>
                    .
                  </p>
                ) : null}

                <div className="prompt-grid" aria-label="Example questions">
                  {SUGGESTED_QUESTIONS.map((question) => (
                    <button
                      type="button"
                      className="prompt-chip"
                      key={question}
                      onClick={() => sendMessage(question)}
                      disabled={!canChat}
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {error ? (
            <div className="chat-error">
              <Alert tone="danger" title="Could not get an answer">
                {error} Your question is back in the box below.
              </Alert>
            </div>
          ) : null}

          <form className="chat-composer" onSubmit={handleSubmit}>
            <div className="chat-input-shell">
              <Lock size={15} aria-hidden="true" />
              <input
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={
                  aiReady
                    ? 'Ask about decisions, owners, deadlines, or changes…'
                    : health
                      ? 'Add GEMINI_API_KEY to enable chat'
                      : 'Connecting to the assistant…'
                }
                disabled={!canChat}
                aria-label="Ask MeetPilot AI"
                maxLength={2000}
              />
              <button
                type="submit"
                className="chat-send"
                disabled={!canChat || !input.trim()}
                aria-label="Send question"
              >
                {sending ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
              </button>
            </div>
            <p className="chat-hint">
              Answers are generated only from saved meetings, tasks, and decisions.
            </p>
          </form>
        </Card>

        <div className="stack">
          <Card>
            <CardHeader
              title="Grounded in your workspace"
              subtitle="No generic answers. Only your saved context."
              icon={ShieldCheck}
            />
            <div className="context-stats">
              <div className="context-stat">
                <span className="context-icon"><CalendarDays size={15} /></span>
                <span>Meetings</span>
                <strong>{meetings.length}</strong>
              </div>
              <div className="context-stat">
                <span className="context-icon"><Scale size={15} /></span>
                <span>Decisions</span>
                <strong>{decisions.length}</strong>
              </div>
              <div className="context-stat">
                <span className="context-icon"><ListChecks size={15} /></span>
                <span>Tasks</span>
                <strong>{tasks.length}</strong>
              </div>
            </div>
            <ul className="assistant-rules">
              <li>Every answer can reference its source meeting.</li>
              <li>Missing information is called out, never invented.</li>
              <li>Suggested decisions stay separate from confirmed ones.</li>
            </ul>
          </Card>

          <Card className="tip-card">
            <p className="tip-title">
              <Database size={15} /> Local-first by design
            </p>
            <p className="tip-copy">
              Your meeting data stays in the local workspace. The Gemini API key stays on the
              backend and is never exposed to the browser.
            </p>
            <Link to="/settings" className="text-link">
              Review setup <span aria-hidden="true">→</span>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
