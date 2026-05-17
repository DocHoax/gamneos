import { FormEvent, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { Button, Card, Input } from '../components/ui';

export function SignInPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fromPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/app';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signIn(email, password);
      navigate(fromPath, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign you in.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-grid">
      <Card className="auth-panel">
        <span className="eyebrow">Welcome back</span>
        <h1>Sign in to continue your mission.</h1>
        <p>Pick up where you left off, review your progress, and unlock the next badge.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Email
            <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" required />
          </label>
          <label>
            Password
            <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" required />
          </label>
          {error ? <div className="form-error">{error}</div> : null}
          <Button type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>

        <p className="form-footnote">
          No account yet? <Link to="/sign-up">Create one</Link>.
        </p>
      </Card>

      <Card className="auth-sidecard">
        <span className="eyebrow">Why it matters</span>
        <h2>Progress is saved per user.</h2>
        <p>
          Every mission you complete updates your XP, levels, and unlocked achievements so you can see your cyber skills
          grow over time.
        </p>
        <ul className="feature-list">
          <li>Persistent account identity</li>
          <li>Mission history and scores</li>
          <li>Achievements driven by milestones</li>
        </ul>
      </Card>
    </div>
  );
}
