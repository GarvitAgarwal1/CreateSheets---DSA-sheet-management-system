import { useEffect, useRef, useState } from "react";

const RESULT_OPTIONS = [
  { key: "solved", label: "Solved" },
  { key: "partially_solved", label: "Partially Solved" },
  { key: "failed", label: "Failed" },
];

const MISTAKES = [
  "Wrong Approach",
  "Silly Mistake",
  "Forgot Concept",
  "Didn’t Read Carefully",
  "Needed More Practice",
  "Time Limit Exceeded",
];

const CONFIDENCE_LEVELS = ["Low", "Medium", "High"];
const REVISION_OPTIONS = ["Today", "Tomorrow", "In 2 Days", "In 1 Week", "In 2 Weeks", "Never"];
const TIME_SPENT_OPTIONS = ["5", "10", "15", "20", "30", "45", "60"];

const iconLabelClass = "mb-2 flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]";
const cardClass = "rounded-[28px] border border-[color:color-mix(in_srgb,var(--border-subtle)_72%,transparent)] bg-[color:color-mix(in_srgb,var(--surface-elevated)_94%,transparent)] p-5 shadow-[0_20px_60px_-34px_rgba(80,120,255,0.72)] backdrop-blur sm:p-6";

const getPlatformFromLink = (link) => {
  if (!link) return "LeetCode";
  if (link.includes("leetcode")) return "LeetCode";
  if (link.includes("codeforces")) return "Codeforces";
  if (link.includes("hackerrank")) return "HackerRank";
  if (link.includes("geeksforgeeks")) return "GeeksforGeeks";
  return "Other";
};

const toRevisionDate = (revisionTiming) => {
  if (revisionTiming === "Never") return null;
  const offsetDays = { Today: 0, Tomorrow: 1, "In 2 Days": 2, "In 1 Week": 7, "In 2 Weeks": 14 };
  const date = new Date();
  date.setDate(date.getDate() + (offsetDays[revisionTiming] ?? 2));
  return date.toISOString();
};

const formatClock = (seconds) => {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  return `${String(Math.floor(safeSeconds / 60)).padStart(2, "0")}:${String(safeSeconds % 60).padStart(2, "0")}`;
};

const Stepper = ({ value, setValue, min = 1, max = 99 }) => {
  const numericValue = Math.max(min, Number(value) || min);
  return (
    <div className="flex h-12 items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] px-2">
      <button type="button" onClick={() => setValue(String(Math.max(min, numericValue - 1)))} className="h-9 w-9 rounded-lg text-lg text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)]">
        −
      </button>
      <span className="text-base font-semibold tabular-nums">{numericValue}</span>
      <button type="button" onClick={() => setValue(String(Math.min(max, numericValue + 1)))} className="h-9 w-9 rounded-lg text-lg text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)]">
        +
      </button>
    </div>
  );
};

function LogAttemptModal({ questionText, questionLink, topicName, onClose, onSave }) {
  const [result, setResult] = useState("partially_solved");
  const [timeSpent, setTimeSpent] = useState("30");
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerIntervalRef = useRef(null);
  const [mistakes, setMistakes] = useState([]);
  const [notes, setNotes] = useState("");
  const [confidence, setConfidence] = useState("Medium");
  const [revisionTiming, setRevisionTiming] = useState("In 2 Days");
  const [attemptNumber, setAttemptNumber] = useState("1");
  const [solvedWithHelp, setSolvedWithHelp] = useState("independent");
  const [submissions, setSubmissions] = useState("1");
  const platform = getPlatformFromLink(questionLink);
  const difficulty = "Unspecified";
  const problemName = questionText || "Untitled question";
  const topic = topicName || "General";
  const timerHasStarted = timerSeconds > 0;
  const primaryTimerLabel = isTimerRunning ? "Pause" : timerHasStarted ? "Resume" : "Start";

  useEffect(() => {
    if (!isTimerRunning) {
      if (timerIntervalRef.current) window.clearInterval(timerIntervalRef.current);
      return undefined;
    }
    timerIntervalRef.current = window.setInterval(() => setTimerSeconds((current) => current + 1), 1000);
    return () => timerIntervalRef.current && window.clearInterval(timerIntervalRef.current);
  }, [isTimerRunning]);

  const toggleMistake = (mistake) => {
    setMistakes((current) => (current.includes(mistake) ? current.filter((item) => item !== mistake) : [...current, mistake]));
  };

  const toggleTimer = () => {
    setIsTimerRunning((current) => !current);
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimerSeconds(0);
  };

  const handleSave = () => {
    const normalizedTimeSpent = Math.max(1, Number(timeSpent) || 1);
    onSave({
      problemName,
      platform,
      result,
      timeSpent: `${normalizedTimeSpent} minutes`,
      mistakes,
      notes,
      confidence,
      revision: revisionTiming,
      revisionTiming,
      revisionDate: toRevisionDate(revisionTiming),
      topic,
      difficulty,
      hintUsed: false,
      editorialUsed: false,
      attemptNumber: Number(attemptNumber) || 1,
      solvedWithHelp,
      submissions: Number(submissions) || 1,
      loggedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(103,121,255,0.22),transparent_42%),var(--overlay-backdrop)] p-3 backdrop-blur sm:p-6">
      <div className="mx-auto flex min-h-full w-full max-w-3xl items-center py-4">
        <section className={`${cardClass} w-full`}>
          <header className="flex flex-col gap-4 border-b border-[var(--border-subtle)] pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-tertiary)]">Practice Log</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Log Attempt</h2>
              <p className="mt-2 max-w-xl text-sm text-[var(--text-secondary)]">
                {problemName || "This question"}{topic ? ` · ${topic}` : ""}{platform ? ` · ${platform}` : ""}
              </p>
            </div>
            <button type="button" onClick={onClose} className="btn-base btn-neutral h-10 rounded-xl px-4 sm:self-start">Close</button>
          </header>

          <div className="mt-5 grid gap-5">
            <div>
              <p className="mb-2 text-sm font-medium text-[var(--text-primary)]">Result</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {RESULT_OPTIONS.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setResult(option.key)}
                    className={`h-12 rounded-2xl border px-4 text-sm font-semibold transition ${
                      result === option.key
                        ? "border-transparent bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg"
                        : "border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(240px,0.8fr)]">
              <label>
                <span className={iconLabelClass}>Time Taken</span>
                <select value={timeSpent} onChange={(e) => setTimeSpent(e.target.value)} className="field-base h-12 w-full rounded-xl">
                  {TIME_SPENT_OPTIONS.map((option) => <option key={option} value={option}>{option} min</option>)}
                </select>
              </label>

              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Timer</p>
                    <p className="mt-1 text-3xl font-semibold tabular-nums">{formatClock(timerSeconds)}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button type="button" className="btn-base btn-primary h-10 min-w-[82px] rounded-xl px-4" onClick={toggleTimer}>{primaryTimerLabel}</button>
                    <button type="button" className="btn-base btn-neutral h-10 rounded-xl px-4" onClick={resetTimer} disabled={!timerHasStarted}>Reset</button>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-[var(--text-primary)]">Confidence Level</p>
              <div className="grid grid-cols-3 gap-2 sm:inline-grid sm:w-auto sm:grid-cols-3">
                {CONFIDENCE_LEVELS.map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setConfidence(level)}
                    className={`h-11 rounded-2xl border px-5 text-sm font-medium ${
                      confidence === level
                        ? "border-indigo-400 bg-indigo-500/20 text-[var(--text-primary)]"
                        : "border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)]"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-[var(--text-primary)]">Mistake Analysis <span className="font-normal text-[var(--text-tertiary)]">(optional)</span></p>
              <div className="flex flex-wrap gap-2">
                {MISTAKES.map((mistake) => (
                  <button
                    key={mistake}
                    type="button"
                    onClick={() => toggleMistake(mistake)}
                    className={`rounded-full border px-4 py-2 text-sm transition ${
                      mistakes.includes(mistake)
                        ? "border-indigo-400 bg-indigo-500/20 text-[var(--text-primary)]"
                        : "border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)]"
                    }`}
                  >
                    {mistake}
                  </button>
                ))}
              </div>
            </div>

            <label className="block">
              <span className={iconLabelClass}>Notes</span>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} className="field-base w-full rounded-2xl" placeholder="What blocked you and what should you revise next?" />
            </label>

            <div className="grid gap-4 border-t border-[var(--border-subtle)] pt-5 sm:grid-cols-2">
              <label>
                <span className={iconLabelClass}>Revision Timing</span>
                <select value={revisionTiming} onChange={(e) => setRevisionTiming(e.target.value)} className="field-base h-12 w-full rounded-xl">
                  {REVISION_OPTIONS.map((option) => <option key={option}>{option}</option>)}
                </select>
              </label>
              <label>
                <span className={iconLabelClass}>Solved Independently</span>
                <select value={solvedWithHelp} onChange={(e) => setSolvedWithHelp(e.target.value)} className="field-base h-12 w-full rounded-xl">
                  <option value="independent">Yes</option>
                  <option value="with_help">No</option>
                </select>
              </label>
              <div><span className={iconLabelClass}>Attempt Number</span><Stepper value={attemptNumber} setValue={setAttemptNumber} /></div>
              <div><span className={iconLabelClass}>Related Attempts</span><Stepper value={submissions} setValue={setSubmissions} /></div>
            </div>
          </div>

          <footer className="mt-6 grid gap-2 border-t border-[var(--border-subtle)] pt-5 sm:grid-cols-2">
            <button type="button" onClick={onClose} className="btn-base btn-neutral h-12 rounded-xl">Cancel</button>
            <button type="button" onClick={handleSave} className="h-12 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 text-sm font-semibold text-white shadow-[0_10px_30px_-10px_rgba(99,102,241,0.9)]">Save Attempt</button>
          </footer>
        </section>
      </div>
    </div>
  );
}

export default LogAttemptModal;
