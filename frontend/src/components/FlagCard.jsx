import React from 'react';
import { AlertCircle, AlertTriangle, Info, Quote } from 'lucide-react';

export default function FlagCard({ flag, index }) {
  const severity = (flag.severity || 'medium').toLowerCase();

  const severityConfig = {
    high: {
      color: 'var(--color-loss)',
      bg: 'var(--color-loss-bg)',
      icon: AlertCircle,
      label: 'High Severity',
    },
    medium: {
      color: 'var(--color-warning)',
      bg: 'var(--color-warning-bg)',
      icon: AlertTriangle,
      label: 'Medium Severity',
    },
    low: {
      color: 'var(--color-accent)',
      bg: 'var(--color-accent-bg)',
      icon: Info,
      label: 'Notice',
    },
  }[severity] || {
    color: 'var(--text-secondary)',
    bg: 'var(--bg-surface)',
    icon: Info,
    label: severity,
  };

  const Icon = severityConfig.icon;

  return (
    <div
      className="p-4.5 transition-all flex flex-col gap-3"
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--bg-card-border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 shrink-0" style={{ color: severityConfig.color }} />
          <h4 className="text-base font-semibold m-0" style={{ color: 'var(--text-primary)' }}>
            {flag.title || `Flagged Clause #${index + 1}`}
          </h4>
        </div>
        <div className="flex items-center gap-2">
          {flag.category && (
            <span
              className="text-xs px-2.5 py-0.5 rounded-md font-medium border"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--bg-card-border)',
                color: 'var(--text-secondary)',
              }}
            >
              {flag.category}
            </span>
          )}
          <span
            className="text-xs px-2.5 py-0.5 rounded-md border font-semibold"
            style={{
              backgroundColor: severityConfig.bg,
              color: severityConfig.color,
              borderColor: severityConfig.color,
            }}
          >
            {severityConfig.label}
          </span>
        </div>
      </div>

      <p className="text-sm leading-relaxed m-0" style={{ color: 'var(--text-secondary)' }}>
        {flag.description}
      </p>

      {flag.clauseQuote && (
        <div
          className="mt-1 p-2.5 rounded-r text-xs italic flex items-start gap-2 border-l-2"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderLeftColor: severityConfig.color,
            color: 'var(--text-secondary)',
          }}
        >
          <Quote className="w-3.5 h-3.5 shrink-0 mt-0.5 opacity-60" style={{ color: 'var(--text-muted)' }} />
          <span>"{flag.clauseQuote}"</span>
        </div>
      )}
    </div>
  );
}
