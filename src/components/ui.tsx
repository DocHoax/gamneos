import type { ButtonHTMLAttributes, InputHTMLAttributes, PropsWithChildren, TextareaHTMLAttributes } from 'react';
import { Link } from 'react-router-dom';

export function Card({ children, className = '' }: PropsWithChildren<{ className?: string }>) {
  return <section className={`card ${className}`.trim()}>{children}</section>;
}

export function StatCard({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <Card className="stat-card">
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      {note ? <span className="stat-note">{note}</span> : null}
    </Card>
  );
}

export function Button({ children, className = '', variant = 'primary', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'accent' }) {
  return (
    <button className={`button button-${variant} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}

export function LinkButton({ children, className = '', variant = 'primary', ...props }: PropsWithChildren<{ to: string; className?: string; variant?: 'primary' | 'ghost' | 'accent' }>) {
  return (
    <Link className={`button button-${variant} ${className}`.trim()} to={props.to}>
      {children}
    </Link>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className="field" {...props} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className="field field-textarea" {...props} />;
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="progress-shell" aria-label={`Progress ${value}%`}>
      <div className="progress-fill" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

export function Badge({ children }: PropsWithChildren) {
  return <span className="badge">{children}</span>;
}
