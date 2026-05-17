import { useEffect, useMemo, useState } from 'react';
import { Card, StatCard, Badge } from '../components/ui';
import { listAllProgress } from '../services/progressService';
import { listKnownUsers } from '../services/authService';
import { levelFromXp } from '../lib/engine';
import { useAuth } from '../context/useAuth';

function initialsFromId(id: string) {
  if (!id) return '??';
  const parts = id.split(/[^a-zA-Z0-9]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return id.slice(0, 2).toUpperCase();
}

function colorFromId(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) % 360;
  }
  return `hsl(${h} 65% 55%)`;
}

function shortId(id: string) {
  if (id.length <= 12) {
    return id;
  }

  return `${id.slice(0, 6)}...${id.slice(-4)}`;
}

export function LeaderboardPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Array<{ userId: string; totalXp: number; level: number; lastPlayedAt?: string }>>([]);
  const [recent, setRecent] = useState<Array<{ userId: string; challengeId: string; earnedXp: number; completedAt: string }>>([]);
  const [missionStats, setMissionStats] = useState<Record<string, number>>({});
  const [knownUsers, setKnownUsers] = useState<Record<string, { displayName: string; email: string }>>({});

  useEffect(() => {
    const map = listAllProgress();
    setKnownUsers(listKnownUsers());

    const playerRows = Object.values(map).map((p) => ({
      userId: p.userId,
      totalXp: p.totalXp ?? 0,
      level: levelFromXp(p.totalXp ?? 0),
      lastPlayedAt: p.lastPlayedAt,
    }));

    playerRows.sort((a, b) => b.totalXp - a.totalXp);
    setRows(playerRows);

    // recent attempts across users
    const attempts = Object.values(map)
      .flatMap((p) => (p.attempts ?? []).map((a) => ({ userId: p.userId, challengeId: a.challengeId, earnedXp: a.earnedXp ?? 0, completedAt: a.completedAt })))
      .sort((a, b) => (b.completedAt ?? '')!.localeCompare(a.completedAt ?? ''))
      .slice(0, 24);

    setRecent(attempts);

    // mission completion counts
    const counts: Record<string, number> = {};
    for (const p of Object.values(map)) {
      for (const id of p.completedChallengeIds ?? []) {
        counts[id] = (counts[id] ?? 0) + 1;
      }
    }

    setMissionStats(counts);
  }, []);

  const totals = useMemo(() => {
    const totalPlayers = rows.length;
    const totalXp = rows.reduce((s, r) => s + (r.totalXp ?? 0), 0);
    const totalAttempts = recent.length;
    return { totalPlayers, totalXp, totalAttempts };
  }, [rows, recent]);

  function playerLabel(userId: string) {
    const profile = knownUsers[userId];
    if (!profile) {
      return shortId(userId);
    }

    return profile.displayName || shortId(userId);
  }

  return (
    <div className="leaderboard-page">
      <div className="page-hero">
        <h2>Leaderboard</h2>
        <p>Top players and recent activity (local demo).</p>
      </div>

      <div className="grid grid-3">
        <section>
          <Card>
            <h3>Top Players</h3>
            <ol className="leaderboard-list">
              {rows.length === 0 ? (
                <li className="leader-row">No progress yet — complete a mission to appear here.</li>
              ) : (
                rows.slice(0, 24).map((r, i) => (
                  <li key={r.userId} className="leader-row">
                    <div className="leader-left">
                      <div className="avatar" style={{ background: colorFromId(r.userId) }}>
                        {initialsFromId(r.userId)}
                      </div>
                      <div>
                        <strong className="name">{playerLabel(r.userId)}</strong>
                        <div className="muted small">ID: {shortId(r.userId)}</div>
                        <div className="muted small">Last played: {r.lastPlayedAt ? new Date(r.lastPlayedAt).toLocaleString() : '—'}</div>
                      </div>
                    </div>
                    <div className="leader-right">
                      <span className="xp">{r.totalXp} XP</span>
                      <Badge>Lv {r.level}</Badge>
                    </div>
                  </li>
                ))
              )}
            </ol>
          </Card>

          <Card>
            <h3>Recent activity</h3>
            <ol className="recent-list">
              {recent.length === 0 ? (
                <li className="muted">No recent attempts</li>
              ) : (
                recent.map((a) => (
                  <li key={`${a.userId}-${a.challengeId}-${a.completedAt}`}>
                    <span className="small muted">{new Date(a.completedAt).toLocaleString()}</span>
                    <div>
                      <strong>{playerLabel(a.userId)}</strong> completed <em>{a.challengeId}</em>
                    </div>
                    <div className="muted small">+{a.earnedXp} XP</div>
                  </li>
                ))
              )}
            </ol>
          </Card>
        </section>

        <div>
          <StatCard label="Players" value={String(totals.totalPlayers)} note="Local progress entries" />
          <StatCard label="Total XP" value={String(totals.totalXp)} note="Sum across players" />
          <StatCard label="Recent Attempts" value={String(totals.totalAttempts)} note="Last 24 attempts" />

          <Card>
            <h3>Top Missions</h3>
            <ol className="mission-list">
              {Object.entries(missionStats)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8)
                .map(([id, count]) => (
                  <li key={id}>
                    <strong>{id}</strong>
                    <span className="muted small">{count} completions</span>
                  </li>
                ))}
              {Object.keys(missionStats).length === 0 ? <li className="muted">No completions yet</li> : null}
            </ol>
          </Card>
        </div>

        <aside>
          <Card>
            <h3>About</h3>
            <p className="muted small">This leaderboard reads local progress stored in your browser. For a shared leaderboard, configure Firebase and add server-side aggregation.</p>
          </Card>

          <Card>
            <h3>Your account</h3>
            {user ? (
              <div>
                <div className="avatar" style={{ background: colorFromId(user.id), display: 'inline-block', marginRight: 8 }}>{initialsFromId(user.id)}</div>
                <strong>{playerLabel(user.id)}</strong>
                <div className="muted small">ID: {shortId(user.id)}</div>
                <div className="muted small">Signed in</div>
              </div>
            ) : (
              <div className="muted">Sign in to track your position and activity.</div>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}

export default LeaderboardPage;
