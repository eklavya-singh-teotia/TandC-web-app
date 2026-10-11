import React from 'react';
import { AlertOctagon, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function RiskMeter({ riskLevel, riskScore, riskExplanation }) {
  const normalizedLevel = (riskLevel || 'Medium').toLowerCase();

  const config = {
    high: {
      color: 'var(--color-loss)',
      bg: 'var(--color-loss-bg)',
      icon: AlertOctagon,
      label: 'High Risk / Unfavorable',
    },
    medium: {
      color: 'var(--color-warning)',
      bg: 'var(--color-warning-bg)',
      icon: AlertTriangle,
      label: 'Medium Risk / Standard Caution',
    },
    low: {
      color: 'var(--color-profit)',
      bg: 'var(--color-profit-bg)',
      icon: ShieldCheck,
      label: 'Low Risk / User-Friendly',
    },
  }[normalizedLevel] || {
    color: 'var(--color-warning)',
    bg: 'var(--color-warning-bg)',
    icon: AlertTriangle,
    label: 'Moderate Risk',
  };

  const Icon = config.icon;
  const score = Math.max(0, Math.min(100, riskScore || (normalizedLevel === 'high' ? 85 : normalizedLevel === 'low' ? 20 : 50)));

  return (
    <div
      className="p-5 transition-colors duration-200"
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--bg-card-border)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div
            className="p-2.5 rounded-xl border flex items-center justify-center transition-transform hover:scale-105"
            style={{
              backgroundColor: config.bg,
              color: config.color,
              borderColor: config.color,
            }}
          >
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <div
              className="text-xs uppercase tracking-wider font-semibold"
              style={{ color: 'var(--text-muted)' }}
            >
              Overall Risk Assessment
            </div>
            <div
              className="text-lg font-bold flex items-center gap-2"
              style={{ color: 'var(--text-primary)' }}
            >
              <span>{config.label}</span>
            </div>
          </div>
        </div>

        <div className="flex items-baseline gap-2 self-start sm:self-auto font-mono">
          <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            Risk Score:
          </span>
          <span className="text-2xl font-black" style={{ color: config.color }}>
            {score}
          </span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            / 100
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div
        className="w-full h-2.5 rounded-full overflow-hidden mb-3"
        style={{ backgroundColor: 'var(--bg-surface-hover)' }}
      >
        <div
          className="h-full transition-all duration-700 ease-out"
          style={{
            width: `${score}%`,
            backgroundColor: config.color,
          }}
        />
      </div>

      {riskExplanation && (
        <p
          className="text-sm leading-relaxed m-0 pt-3"
          style={{
            color: 'var(--text-secondary)',
            borderTop: '1px solid var(--bg-card-border)',
          }}
        >
          {riskExplanation}
        </p>
      )}
    </div>
  );
}
