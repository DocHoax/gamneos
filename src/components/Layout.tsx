import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, LinkButton } from './ui';

export function Layout() {
  const { user, signOut } = useAuth();

  return (
    <div className="app-shell">
      <div className="app-orb app-orb-one" />
      <div className="app-orb app-orb-two" />
      <header className="topbar">
        <NavLink to="/" className="brand">
          <span className="brand-mark">G</span>
          <span>
            Gamneos
            <small>Cyber missions, tracked.</small>
          </span>
        </NavLink>

        <nav className="topnav">
          <NavLink to="/" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Home
          </NavLink>
          {user ? (
            <>
              <NavLink to="/app" end className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                Dashboard
              </NavLink>
              <NavLink to="/app/leaderboard" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                Leaderboard
              </NavLink>
              <NavLink to="/app/profile" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                Profile
              </NavLink>
              <Button variant="ghost" onClick={() => void signOut()}>
                Sign out
              </Button>
            </>
          ) : (
            <>
              <LinkButton to="/sign-in" variant="ghost">
                Sign in
              </LinkButton>
              <LinkButton to="/sign-up">Create account</LinkButton>
            </>
          )}
        </nav>
      </header>

      <main className="page-wrap">
        <Outlet />
      </main>
    </div>
  );
}
