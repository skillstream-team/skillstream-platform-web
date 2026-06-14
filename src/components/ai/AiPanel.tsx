import React, { useState } from 'react';
import { Copy, RefreshCw, Sparkles } from 'lucide-react';
import { hasSupabaseConfig, supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';

interface QuizQuestion {
  type: 'mcq' | 'short';
  question: string;
  options?: string[];
  answer: string;
}

export interface AiPanelProps {
  feature: string;
  payload: Record<string, unknown>;
  label: string;
  storedResult?: string;
  outputFormat?: 'text' | 'quiz';
  promptInput?: {
    label: string;
    placeholder: string;
    value: string;
    onChange: (v: string) => void;
  };
  onResult?: (result: string) => void;
  className?: string;
}

export const AiPanel: React.FC<AiPanelProps> = ({
  feature,
  payload,
  label,
  storedResult,
  outputFormat = 'text',
  promptInput,
  onResult,
  className = '',
}) => {
  const [result, setResult] = useState<string>(storedResult || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    if (!hasSupabaseConfig) return;
    setIsLoading(true);
    setError(null);

    try {
      const body: Record<string, unknown> = { ...payload };
      if (promptInput) {
        body[promptInput.label] = promptInput.value;
      }

      const { data, error: fnError } = await supabase.functions.invoke(feature, { body });

      if (fnError) {
        setError(fnError.message || 'Failed to generate. Please try again.');
        return;
      }

      const generated = (data as { result?: string })?.result || '';
      setResult(generated);
      onResult?.(generated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore clipboard errors
    }
  };

  if (!hasSupabaseConfig) {
    return (
      <div className={cn('mt-4', className)}>
        <button
          type="button"
          disabled
          title="AI requires Supabase connection"
          className="inline-flex cursor-not-allowed items-center gap-2 rounded-full border border-[color:var(--hub-border)] px-4 py-2 text-sm font-semibold text-[color:var(--hub-muted)] opacity-50"
        >
          <Sparkles className="h-4 w-4" />
          {label}
        </button>
        <p className="mt-1 text-xs text-[color:var(--hub-muted)]">AI requires Supabase connection</p>
      </div>
    );
  }

  return (
    <div className={cn('mt-4', className)}>
      {promptInput ? (
        <div className="mb-3">
          <label className="mb-1 block text-xs font-semibold text-[color:var(--hub-muted)]">
            {promptInput.label}
          </label>
          <textarea
            value={promptInput.value}
            onChange={(e) => promptInput.onChange(e.target.value)}
            placeholder={promptInput.placeholder}
            rows={3}
            className="w-full rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 text-sm outline-none focus:border-[color:var(--hub-primary)]"
          />
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => { void generate(); }}
        disabled={isLoading}
        className="inline-flex items-center gap-2 rounded-full bg-[color:var(--hub-primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        <Sparkles className={cn('h-4 w-4', isLoading && 'animate-pulse')} />
        {isLoading ? 'Generating…' : label}
      </button>

      {error ? (
        <div className="mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {result ? (
        <div className="mt-4 rounded-2xl border border-[color:var(--hub-border)] bg-[color:var(--hub-soft)]">
          <div className="flex items-center justify-between gap-2 border-b border-[color:var(--hub-border)] px-4 py-2.5">
            <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--hub-primary)]">
              <Sparkles className="h-3.5 w-3.5" />
              AI Generated
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => { void copyToClipboard(); }}
                className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--hub-border)] bg-white px-3 py-1 text-xs font-semibold text-[color:var(--hub-text)]"
              >
                <Copy className="h-3.5 w-3.5" />
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button
                type="button"
                onClick={() => { void generate(); }}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--hub-border)] bg-white px-3 py-1 text-xs font-semibold text-[color:var(--hub-text)] disabled:opacity-60"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Regenerate
              </button>
            </div>
          </div>

          <div className="p-4">
            {outputFormat === 'quiz' ? (
              <QuizOutput raw={result} />
            ) : (
              <pre className="whitespace-pre-wrap font-sans text-sm text-[color:var(--hub-text)]">{result}</pre>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};

interface QuizOutputProps {
  raw: string;
}

const QuizOutput: React.FC<QuizOutputProps> = ({ raw }) => {
  const questions = (() => {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as QuizQuestion[];
    } catch {
      // fall back
    }
    return null;
  })();

  if (!questions) {
    return <pre className="whitespace-pre-wrap font-sans text-sm text-[color:var(--hub-text)]">{raw}</pre>;
  }

  return (
    <div className="grid gap-4">
      {questions.map((q, index) => (
        <div key={index} className="rounded-2xl border border-[color:var(--hub-border)] bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--hub-muted)]">
            Q{index + 1} · {q.type === 'mcq' ? 'Multiple Choice' : 'Short Answer'}
          </p>
          <p className="mt-2 text-sm font-semibold text-[color:var(--hub-text)]">{q.question}</p>

          {q.type === 'mcq' && q.options ? (
            <ul className="mt-3 grid gap-1.5">
              {q.options.map((opt, oi) => {
                const isCorrect = opt === q.answer || opt.startsWith(q.answer.charAt(0));
                return (
                  <li
                    key={oi}
                    className={cn('rounded-xl px-3 py-1.5 text-sm', isCorrect ? 'bg-green-50 font-semibold text-green-700' : 'text-[color:var(--hub-text)]')}
                  >
                    {opt}
                  </li>
                );
              })}
            </ul>
          ) : (
            <>
              <hr className="my-3 border-[color:var(--hub-border)]" />
              <p className="text-sm text-[color:var(--hub-muted)]">
                <span className="font-semibold text-[color:var(--hub-text)]">Answer: </span>
                {q.answer}
              </p>
            </>
          )}
        </div>
      ))}
    </div>
  );
};
