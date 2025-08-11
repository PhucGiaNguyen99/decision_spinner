import React, { useEffect, useRef, useState } from "react";

export default function DecisionSpinner() {
  // State for the current input field value
  const [input, setInput] = useState("");

  // Array of option strings
  const [options, setOptions] = useState<string[]>([]);

  // Whether the spinner is currently running
  const [spinning, setSpinning] = useState(false);

  // Index of the currently highlighted option during spinning
  const [highlightIndex, setHighlightIndex] = useState<number | null>(null);

  // The final selected option after spinning stops
  const [selected, setSelected] = useState<string | null>(null);

  // References to timers so they can be cleared when needed
  const spinTimerRef = useRef<number | null>(null);
  const spinEndTimerRef = useRef<number | null>(null);

  // Clean up any active timers when component unmounts
  useEffect(() => {
    return () => {
      if (spinTimerRef.current) window.clearInterval(spinTimerRef.current);
      if (spinEndTimerRef.current) window.clearTimeout(spinEndTimerRef.current);
    };
  }, []);

  // Add a new option from the input field
  const addOption = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    if (options.includes(trimmed)) {
      setInput("");
      return;
    }
    setOptions((prev) => [...prev, trimmed]);
    setInput("");
  };

  // Remove an option by its index
  const removeOption = (idx: number) => {
    setOptions((prev) => prev.filter((_, i) => i !== idx));
    setSelected((prev) => {
      // If the removed option was the selected one, clear selection
      if (!prev) return prev;
      const removed = options[idx];
      return prev === removed ? null : prev;
    });
  };

  // Remove all options and reset spinner
  const clearAll = () => {
    setOptions([]);
    setSelected(null);
    setHighlightIndex(null);
  };

  // Handle Enter key to quickly add the option
  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addOption();
    }
  };

  // Start the spinning process
  const spin = () => {
    // Need at least 2 options and spinner must not already be running
    if (spinning || options.length < 2) return;
    setSpinning(true);
    setSelected(null);

    // Total spin duration (randomized slightly for variety)
    const totalDurationMs = 2000 + Math.random() * 1200; // 2.0 - 3.2s
    const baseInterval = 90; // Initial speed (ms per highlight change)

    // Function to highlight the next option index
    const tick = () => {
      setHighlightIndex((prev) => {
        const next = prev === null ? 0 : (prev + 1) % options.length;
        return next;
      });
    };

    // Start spinning fast
    spinTimerRef.current = window.setInterval(tick, baseInterval);

    // Slow down at specific checkpoints of total duration
    const checkpoints = [0.5, 0.75, 0.9]; // Ratios of total duration
    const checkpointTimers: number[] = [];
    checkpoints.forEach((ratio, i) => {
      const timer = window.setTimeout(() => {
        if (spinTimerRef.current) window.clearInterval(spinTimerRef.current);
        // Increase interval to slow down
        const newInterval = baseInterval + (i + 1) * 80; // Gradual slowdown
        spinTimerRef.current = window.setInterval(tick, newInterval);
      }, totalDurationMs * ratio);
      checkpointTimers.push(timer as unknown as number);
    });

    // End spinning after total duration
    spinEndTimerRef.current = window.setTimeout(() => {
      if (spinTimerRef.current) window.clearInterval(spinTimerRef.current);
      setSpinning(false);
      // Pick a random final index as the selection
      const finalIndex = Math.floor(Math.random() * options.length);
      setHighlightIndex(finalIndex);
      setSelected(options[finalIndex]);
      // Clean up slowdown timers
      checkpointTimers.forEach((t) => window.clearTimeout(t));
    }, totalDurationMs);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <header className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Simple Decision Spinner</h1>
          <p className="text-slate-600 mt-1">Type choices, add them, then spin to let fate decide.</p>
        </header>

        {/* Input Row: add, clear */}
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Add an option (e.g., Sushi)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={spinning}
          />
          <button
            className="rounded-2xl px-4 py-3 bg-indigo-600 text-white font-medium shadow hover:shadow-md disabled:opacity-50"
            onClick={addOption}
            disabled={!input.trim() || spinning}
          >
            Add
          </button>
          <button
            className="rounded-2xl px-4 py-3 bg-slate-200 text-slate-800 font-medium hover:bg-slate-300 disabled:opacity-50"
            onClick={clearAll}
            disabled={options.length === 0 || spinning}
          >
            Clear
          </button>
        </div>

        {/* Options list: highlights active index */}
        <div className="mt-4 flex flex-wrap gap-2">
          {options.map((opt, idx) => (
            <span
              key={opt}
              className={`group inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${
                highlightIndex === idx ? "border-indigo-600 bg-indigo-50" : "border-slate-300 bg-white"
              }`}
            >
              <span className="font-medium">{opt}</span>
              <button
                className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-700 hover:bg-slate-300"
                onClick={() => removeOption(idx)}
                disabled={spinning}
                aria-label={`Remove ${opt}`}
              >
                ✕
              </button>
            </span>
          ))}
          {options.length === 0 && (
            <span className="text-slate-500">No options yet. Add a few to get started.</span>
          )}
        </div>

        {/* Spin controls */}
        <div className="mt-6 flex items-center gap-3">
          <button
            className="rounded-2xl px-5 py-3 bg-emerald-600 text-white font-semibold shadow hover:shadow-md disabled:opacity-50"
            onClick={spin}
            disabled={options.length < 2 || spinning}
          >
            {spinning ? "Spinning..." : "Spin"}
          </button>
          <span className="text-sm text-slate-500">
            {options.length < 2 ? "Add at least two options" : spinning ? "Picking..." : "Ready"}
          </span>
        </div>

        {/* Display final result */}
        <div className="mt-6">
          {selected && !spinning && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm text-emerald-700">Result</p>
              <p className="text-2xl font-bold text-emerald-900">{selected}</p>
            </div>
          )}
        </div>

        {/* Hint for keyboard usage */}
        <p className="mt-6 text-xs text-slate-500">Tip: Press Enter to add the current input.</p>

        {/* Footer note */}
        <footer className="mt-10 text-center text-xs text-slate-400">
          Built to practice React basics: useState, list rendering, forms, conditional UI, and timers.
        </footer>
      </div>
    </div>
  )




}