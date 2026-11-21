import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  FileText,
  ListChecks,
  Loader2,
  Lock,
  Mic,
  Scale,
  ShieldAlert,
  Sparkles,
  Target,
  Square,
  Upload,
  Users,
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader.jsx';
import Card, { CardHeader } from '../components/ui/Card.jsx';
import Alert from '../components/ui/Alert.jsx';
import Badge from '../components/ui/Badge.jsx';
import Button from '../components/ui/Button.jsx';
import AnalysisReview from '../components/meeting/AnalysisReview.jsx';
import { api } from '../services/api.js';
import { useWorkspace } from '../context/WorkspaceContext.jsx';
import { todayKey } from '../utils/format.js';

const EXTRACTION_POINTS = [
  { icon: FileText, label: 'Executive summary & discussion points' },
  { icon: Scale, label: 'Confirmed decisions vs. suggestions' },
  { icon: ListChecks, label: 'Action items with transcript evidence' },
  { icon: Users, label: 'Owners only when explicitly named' },
  { icon: CalendarDays, label: 'Deadlines only when stated in the meeting' },
  { icon: ShieldAlert, label: 'Risks, blockers, and dependencies' },
];

const ANALYSIS_STAGES = [
  { after: 0, label: 'Reading the transcript' },
  { after: 12, label: 'Separating decisions from suggestions' },
  { after: 28, label: 'Checking owners, deadlines, and risks' },
  { after: 45, label: 'Comparing with previous meetings' },
];

export default function NewMeeting() {
  const { health } = useWorkspace();
  const [title, setTitle] = useState('');
  const [meetingDate, setMeetingDate] = useState(todayKey());
  const [transcript, setTranscript] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [audioName, setAudioName] = useState('');
  const fileInputRef = useRef(null);
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const recognitionRef = useRef(null);
  const liveTranscriptRef = useRef('');

  const wordCount = transcript.trim() ? transcript.trim().split(/\s+/).length : 0;
  const aiReady = Boolean(health?.ai?.configured);
  const canAnalyse =
    aiReady && title.trim().length >= 2 && transcript.trim().length >= 20 && !analyzing;

  useEffect(() => {
    if (!analyzing) {
      setElapsed(0);
      return undefined;
    }

    const startedAt = Date.now();
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [analyzing]);

  async function startRecording() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('Audio recording is not supported in this browser.');
      return;
    }

    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const chunks = [];
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        if (!chunks.length) return;

        const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        const file = new File([blob], 'meeting-recording.webm', {
          type: blob.type,
        });
        await transcribeFile(file);
      };

      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.onresult = (event) => {
          let finalText = '';
          let interimText = '';
          for (let index = event.resultIndex; index < event.results.length; index += 1) {
            const part = event.results[index][0].transcript;
            if (event.results[index].isFinal) finalText += `${part} `;
            else interimText += part;
          }
          if (finalText) {
            liveTranscriptRef.current = `${liveTranscriptRef.current}${finalText}`;
            setTranscript(`${liveTranscriptRef.current}${interimText}`.trim());
          } else if (interimText) {
            setTranscript(`${liveTranscriptRef.current}${interimText}`.trim());
          }
        };
        recognition.onerror = () => {};
        recognition.start();
        recognitionRef.current = recognition;
      }

      recorder.start();
      liveTranscriptRef.current = transcript.trim() ? `${transcript.trim()}\n` : '';
      setIsRecording(true);
      setAudioName('');
    } catch (recordError) {
      setError(recordError.message || 'Microphone access could not be started.');
    }
  }

  function stopRecording() {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (recorderRef.current?.state !== 'inactive') {
      recorderRef.current?.stop();
    }
    setIsRecording(false);
  }

  async function transcribeFile(file) {
    setTranscribing(true);
    setError('');
    setAudioName(file.name);
    try {
      const result = await api.transcribeAudio(file);
      if (result.transcript) {
        setTranscript((current) =>
          current.trim() ? `${current.trim()}\n\n${result.transcript.trim()}` : result.transcript,
        );
      }
    } catch (transcribeError) {
      setError(transcribeError.message);
    } finally {
      setTranscribing(false);
    }
  }

  function handleAudioUpload(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) transcribeFile(file);
  }

  async function handleAnalyze(event) {
    event.preventDefault();

    if (!canAnalyse) return;

    setAnalyzing(true);
    setError('');

    try {
      const analysisResult = await api.analyzeMeeting({
        title: title.trim(),
        meetingDate,
        transcript: transcript.trim(),
      });

      setResult(analysisResult);
    } catch (analyseError) {
      setError(analyseError.message);
    } finally {
      setAnalyzing(false);
    }
  }

  if (result) {
    return (
      <AnalysisReview
        initial={result}
        meeting={{ title: title.trim(), meetingDate, transcript: transcript.trim() }}
        onBack={() => setResult(null)}
      />
    );
  }

  const activeStage = ANALYSIS_STAGES.reduce(
    (active, stage, index) => (elapsed >= stage.after ? index : active),
    0,
  );

  return (
    <div>
      <PageHeader
        eyebrow="New meeting"
        title="Turn a transcript into a working report."
        description="Paste the conversation. MeetPilot will separate decisions from suggestions and extract the follow-through."
        actions={
          <Link to="/meetings" className="btn btn-secondary">
            <ArrowLeft size={16} />
            <span>Back to meetings</span>
          </Link>
        }
      />

      {error ? (
        <Alert tone="danger" title="Analysis failed">
          {error} Your transcript is still here — review it and try again.
        </Alert>
      ) : null}

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
          Add <code>GEMINI_API_KEY</code> to <code>backend/.env</code> and restart the API before
          analysing a meeting.
        </Alert>
      ) : null}

      <div className="form-layout">
        <Card>
          {analyzing ? (
            <div className="analysis-loading">
              <span className="analysis-spinner" aria-hidden="true">
                <Loader2 size={28} className="spin" />
              </span>
              <h2>Analysing “{title.trim()}”</h2>
              <p>
                Gemini is reading the full transcript. This usually takes 30–60 seconds, and
                nothing is saved until you review the result.
              </p>

              <div className="analysis-progress" role="progressbar" aria-label="Analysis in progress">
                <span className="analysis-progress-bar" />
              </div>
              <p className="analysis-elapsed">
                {elapsed}s elapsed · keep this tab open
              </p>

              <ol className="analysis-stage-list">
                {ANALYSIS_STAGES.map((stage, index) => (
                  <li
                    key={stage.label}
                    className={
                      index < activeStage
                        ? 'analysis-stage-done'
                        : index === activeStage
                          ? 'analysis-stage-active'
                          : ''
                    }
                  >
                    <span className="analysis-stage-icon" aria-hidden="true">
                      {index < activeStage ? (
                        <CheckCircle2 size={14} />
                      ) : index === activeStage ? (
                        <Loader2 size={14} className="spin" />
                      ) : (
                        <span className="analysis-stage-dot" />
                      )}
                    </span>
                    {stage.label}
                  </li>
                ))}
              </ol>
            </div>
          ) : (
            <>
              <CardHeader
                title="Meeting details"
                subtitle="Use the meeting title and date as you want them saved in your history."
                icon={CalendarDays}
              />

              <form className="meeting-form" onSubmit={handleAnalyze}>
                <div className="form-row">
                  <div className="field">
                    <label className="field-label" htmlFor="meeting-title">
                      Meeting title
                    </label>
                    <input
                      id="meeting-title"
                      className="input"
                      type="text"
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      placeholder="e.g. Sprint 12 planning"
                      maxLength={180}
                    />
                  </div>
                  <div className="field">
                    <label className="field-label" htmlFor="meeting-date">
                      Meeting date
                    </label>
                    <input
                      id="meeting-date"
                      className="input"
                      type="date"
                      value={meetingDate}
                      onChange={(event) => setMeetingDate(event.target.value)}
                    />
                  </div>
                </div>

                <div className="field">
                  <div className="field-label-row">
                    <label className="field-label" htmlFor="meeting-transcript">
                      Meeting transcript
                    </label>
                    <div className="transcript-tools">
                      {isRecording ? (
                        <button type="button" className="btn btn-danger btn-sm" onClick={stopRecording}>
                          <Square size={14} />
                          <span>Stop & transcribe</span>
                        </button>
                      ) : (
                        <button type="button" className="btn btn-secondary btn-sm" onClick={startRecording}>
                          <Mic size={14} />
                          <span>Record live</span>
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={transcribing}
                      >
                        {transcribing ? <Loader2 size={14} className="spin" /> : <Upload size={14} />}
                        <span>{transcribing ? 'Transcribing…' : 'Upload audio'}</span>
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="audio/*,.m4a,.mp3,.wav,.webm"
                        onChange={handleAudioUpload}
                        hidden
                      />
                    </div>
                  </div>
                  {isRecording ? (
                    <p className="recording-status">
                      <span className="recording-dot" aria-hidden="true" />
                      Recording in progress — live browser transcription is active where supported.
                    </p>
                  ) : audioName ? (
                    <p className="field-hint">Last transcribed: {audioName}</p>
                  ) : null}
                  <textarea
                    id="meeting-transcript"
                    className="input textarea transcript-input"
                    value={transcript}
                    onChange={(event) => setTranscript(event.target.value)}
                    placeholder="Paste the full meeting transcript here, including speaker names where possible…"
                    rows={16}
                    maxLength={120000}
                  />
                  <p className="field-hint">
                    Include speaker names and context. MeetPilot only reports what the transcript
                    actually says.
                  </p>
                </div>

                <div className="form-footer">
                  <span className="form-footer-note">
                    <Lock size={13} />
                    Your transcript stays on your local workspace.
                  </span>
                  <div className="form-footer-actions">
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => {
                        setTitle('');
                        setMeetingDate(todayKey());
                        setTranscript('');
                        setError('');
                      }}
                    >
                      Clear
                    </button>
                    <Button
                      type="submit"
                      disabled={!canAnalyse}
                      title={
                        aiReady
                          ? 'Analyse this transcript with Gemini'
                          : 'Configure Gemini before analysing'
                      }
                    >
                      <Sparkles size={16} />
                      <span>Analyse meeting</span>
                    </Button>
                  </div>
                </div>
              </form>
            </>
          )}
        </Card>

        <div className="stack">
          <Card>
            <CardHeader
              title="What MeetPilot will extract"
              subtitle="A structured report, not a wall of text."
              icon={Sparkles}
            />
            <ul className="extraction-list">
              {EXTRACTION_POINTS.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.label}>
                    <span className="extraction-icon">
                      <Icon size={15} />
                    </span>
                    {item.label}
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card>
            <CardHeader
              title="Setup status"
              subtitle="Live checks from the MeetPilot API."
              icon={Target}
            />
            <div className="setup-steps">
              <div className={`setup-step ${health ? 'setup-step-done' : ''}`}>
                <span className="setup-step-icon">
                  {health ? <CheckCircle2 size={15} /> : <Loader2 size={15} className="spin" />}
                </span>
                <div>
                  <p>Workspace & API</p>
                  <span>{health ? 'Connected to the local API' : 'Checking connection…'}</span>
                </div>
                <Badge tone={health ? 'success' : 'neutral'}>{health ? 'Live' : 'Checking'}</Badge>
              </div>
              <div className={`setup-step ${aiReady ? 'setup-step-done' : ''}`}>
                <span className="setup-step-icon">
                  {aiReady ? <CheckCircle2 size={15} /> : <Sparkles size={15} />}
                </span>
                <div>
                  <p>Gemini analysis</p>
                  <span>
                    {aiReady
                      ? `${health.ai.model || 'Gemini'} connected`
                      : health
                        ? 'API key is not configured'
                        : 'Checking configuration…'}
                  </span>
                </div>
                <Badge tone={aiReady ? 'success' : health ? 'warning' : 'neutral'}>
                  {aiReady ? 'Ready' : health ? 'Setup needed' : 'Checking'}
                </Badge>
              </div>
            </div>
            <Link to="/settings" className="text-link setup-link">
              Open settings <span aria-hidden="true">→</span>
            </Link>
          </Card>

          <Card className="tip-card">
            <p className="tip-title">Better transcripts, better output</p>
            <p className="tip-copy">
              Speaker labels and explicit statements such as “Arun will send the report by Friday”
              produce cleaner owners and deadlines.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
