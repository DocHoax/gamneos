import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { Button, Card, Input } from '../components/ui';

export function SignUpPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signUp(displayName, email, password);
      navigate('/app', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create your account.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-grid">
      <Card className="auth-panel">
        <span className="eyebrow">Create account</span>
        <h1>Start your cyber training profile.</h1>
        <p>Sign up once, keep your progress, and return any time to continue your mission path.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Display name
            <Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Aster" required />
          </label>
          <label>
            Email
            <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" required />
          </label>
          <label>
            Password
            <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Choose a password" required minLength={8} />
          </label>
          {error ? <div className="form-error">{error}</div> : null}
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </Button>
        </form>

        <p className="form-footnote">
          Already have an account? <Link to="/sign-in">Sign in</Link>.
        </p>
      </Card>

      <Card className="auth-sidecard">
        <span className="eyebrow">What you get</span>
        <h2>Progress tracking from day one.</h2>
        <p>
          Your first login creates a private progress record so mission completion, XP, and achievements stay attached to
          your account.
        </p>
        <ul className="feature-list">
          <li>Mission history stored per account</li>
          <li>XP and levels update automatically</li>
          <li>Ready for Firebase Auth later</li>
        </ul>
      </Card>
    </div>
  );
}
