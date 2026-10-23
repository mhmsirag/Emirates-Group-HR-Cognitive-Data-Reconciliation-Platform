import React, { useState } from 'react';
import { QueryResponse, ProvenanceSource } from '../../lib/types';
import {
  Search,
  Sparkles,
  ArrowRight,
  Database,
  CheckCircle2,
  FileCheck,
  Tag,
  Clock,
  Layers,
} from 'lucide-react';

interface NLQueryBoxProps {
  onExecuteQuery: (query: string) => Promise<QueryResponse>;
  isQuerying: boolean;
  onSelectEntity?: (entityId: string) => void;
}

export const NLQueryBox: React.FC<NLQueryBoxProps> = ({
  onExecuteQuery,
  isQuerying,
  onSelectEntity,
}) => {
  const [queryInput, setQueryInput] = useState<string>('');
  const [latestResponse, setLatestResponse] = useState<QueryResponse | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);

  const sampleQueries = [
    'Which pilots have expired B777 or A380 safety certifications?',
    'Are there terminated staff with active DXB airside passes or enterprise cloud access?',
    'Show payroll currency mismatches for the upcoming monthly run',
    'Are there ghost employees receiving salary disbursements without a Core HR record?',
    'Which dnata employees have cost center misalignments with Emirates Engineering?',
  ];

  const handleSubmit = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const queryToRun = (customQuery || queryInput).trim();
    if (!queryToRun) return;

    setQueryError(null);
    try {
      const response = await onExecuteQuery(queryToRun);
      setLatestResponse(response);
      if (customQuery) setQueryInput(customQuery);
    } catch (err: any) {
      setQueryError(err.message || 'Failed to execute query');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-slate-100 tracking-tight flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          Cognitive HR Oracle & Provenance Query Engine
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Ask plain-language questions across Core HR, SAP Payroll, Aviation LMS, and Dubai Airports Pass Office with deterministic provenance
        </p>
      </div>

      {/* Query Input Box */}
      <form onSubmit={(e) => handleSubmit(e)} className="relative">
        <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-xl overflow-hidden focus-within:border-purple-500 shadow-md">
          <div className="pl-4 text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            placeholder="Ask a question (e.g., Which pilots are scheduled whose flight certs expired?)..."
            className="w-full px-3.5 py-3.5 text-sm bg-transparent text-slate-100 placeholder-slate-500 focus:outline-none"
            disabled={isQuerying}
          />
          <button
            type="submit"
            disabled={isQuerying || !queryInput.trim()}
            className="m-1.5 px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isQuerying ? 'animate-spin' : ''}`} />
            {isQuerying ? 'Reasoning...' : 'Ask Oracle'}
          </button>
        </div>
      </form>

      {/* Quick Prompts */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
          Recommended Cognitive Inquiries:
        </span>
        <div className="flex flex-wrap gap-2">
          {sampleQueries.map((sample, idx) => (
            <button
              key={idx}
              onClick={() => handleSubmit(undefined, sample)}
              disabled={isQuerying}
              className="text-left px-2.5 py-1 text-xs rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800/80 transition-colors"
            >
              {sample}
            </button>
          ))}
        </div>
      </div>

      {queryError && (
        <div className="p-3 bg-red-950/40 border border-red-800 text-red-200 text-xs rounded-lg">
          {queryError}
        </div>
      )}

      {/* Query Result Card */}
      {latestResponse && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-5">
          {/* Top Metadata */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-mono text-purple-300 font-semibold bg-purple-950/80 border border-purple-800/80 px-2 py-0.5 rounded">
                Intent: {latestResponse.intent}
              </span>
              <span className="text-slate-400">
                Confidence:{' '}
                <strong className="text-slate-200 font-mono">
                  {Math.round(latestResponse.confidence * 100)}%
                </strong>
              </span>
            </div>
            <div className="text-slate-500 font-mono text-[11px] flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{new Date(latestResponse.timestamp).toLocaleTimeString()}</span>
            </div>
          </div>

          {/* Formatted Answer */}
          <div className="prose prose-invert max-w-none text-xs leading-relaxed text-slate-200 space-y-2 whitespace-pre-line font-sans">
            {latestResponse.answerMarkdown}
          </div>

          {/* Source Provenance Tracking */}
          {latestResponse.sources && latestResponse.sources.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 uppercase font-mono tracking-wider">
                  <Database className="w-3.5 h-3.5 text-sky-400" />
                  Deterministic Source Provenance ({latestResponse.sources.length} Verified Evidence Nodes)
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {latestResponse.sources.map((src, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/80 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] text-sky-400 font-semibold">
                        {src.system}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">
                        Entity: <strong className="text-slate-200">{src.entityId}</strong>
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2 font-mono text-[11px]">
                      <span className="text-slate-400">{src.field}:</span>
                      <span className="text-amber-300 font-semibold truncate" title={src.rawValue}>
                        {src.rawValue}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-normal">
                      {src.citation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Remediation Actions */}
          {latestResponse.suggestedActions && latestResponse.suggestedActions.length > 0 && (
            <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-400 font-mono text-[11px] uppercase">
                Suggested Next Steps:
              </span>
              {latestResponse.suggestedActions.map((action, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 bg-slate-950 border border-slate-800 text-slate-300 rounded font-medium text-[11px]"
                >
                  {action}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
