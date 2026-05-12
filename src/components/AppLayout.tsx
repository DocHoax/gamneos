import { Outlet } from 'react-router-dom';

export function AppLayout() {
  return (
    <div className="app-panel">
      <div className="panel-header">
        <span className="eyebrow">Secure training deck</span>
        <h1>Mission control</h1>
        <p>Track your progress, push through missions, and earn badges as you sharpen your cyber instincts.</p>
      </div>
      <Outlet />
    </div>
  );
}
