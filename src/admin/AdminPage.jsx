import { useState, useEffect } from 'react';
import { supabase } from '../supabase.js';

const ALLOWED_EMAIL = 'lance@2ndstreet.ca';

export default function AdminPage() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [recentVisits, setRecentVisits] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  const [error, setError] = useState(null);

  // Listen for auth changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch stats when logged in
  useEffect(() => {
    if (!session || session.user.email !== ALLOWED_EMAIL) return;
    fetchStats();
  }, [session]);

  async function signIn() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/admin',
      },
    });
    if (error) setError(error.message);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setSession(null);
    setStats(null);
  }

  async function fetchStats() {
    try {
      // Total views
      const { count: totalViews } = await supabase
        .from('page_views')
        .select('*', { count: 'exact', head: true });

      // Today's views
      const today = new Date().toISOString().split('T')[0];
      const { count: todayViews } = await supabase
        .from('page_views')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today + 'T00:00:00');

      // This week's views (last 7 days)
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const { count: weekViews } = await supabase
        .from('page_views')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekAgo);

      // Unique visitors (by IP, last 30 days)
      const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString();
      const { data: uniqueData } = await supabase
        .from('page_views')
        .select('ip_address')
        .gte('created_at', monthAgo);
      const uniqueVisitors = new Set(uniqueData?.map(r => r.ip_address) || []).size;

      setStats({ totalViews, todayViews, weekViews, uniqueVisitors });

      // Daily breakdown (last 30 days)
      const { data: rawDaily } = await supabase
        .from('page_views')
        .select('created_at')
        .gte('created_at', monthAgo)
        .order('created_at', { ascending: true });

      const dayCounts = {};
      (rawDaily || []).forEach(row => {
        const day = row.created_at.split('T')[0];
        dayCounts[day] = (dayCounts[day] || 0) + 1;
      });

      // Fill in missing days
      const days = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000);
        const key = d.toISOString().split('T')[0];
        days.push({ date: key, views: dayCounts[key] || 0 });
      }
      setDailyData(days);

      // Recent visits
      const { data: recent } = await supabase
        .from('page_views')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      setRecentVisits(recent || []);
    } catch (err) {
      setError('Failed to load stats: ' + err.message);
    }
  }

  if (loading) {
    return (
      <div className="admin-shell">
        <div className="admin-loading">Loading...</div>
      </div>
    );
  }

  // Not logged in
  if (!session) {
    return (
      <div className="admin-shell">
        <div className="admin-login">
          <h1>Speed<span>Pulse</span> Admin</h1>
          <p>Sign in to view traffic reports</p>
          <button className="google-btn" onClick={signIn}>
            <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
            Sign in with Google
          </button>
          {error && <p className="admin-error">{error}</p>}
        </div>
      </div>
    );
  }

  // Logged in but wrong email
  if (session.user.email !== ALLOWED_EMAIL) {
    return (
      <div className="admin-shell">
        <div className="admin-login">
          <h1>Access Denied</h1>
          <p>This dashboard is restricted. Signed in as <strong>{session.user.email}</strong></p>
          <button className="google-btn" onClick={signOut}>Sign Out</button>
        </div>
      </div>
    );
  }

  const maxDaily = Math.max(...dailyData.map(d => d.views), 1);

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div>
          <h1>Speed<span>Pulse</span> Admin</h1>
          <p>{session.user.email}</p>
        </div>
        <div className="admin-actions">
          <button className="admin-btn" onClick={fetchStats}>Refresh</button>
          <button className="admin-btn outline" onClick={signOut}>Sign Out</button>
        </div>
      </header>

      {error && <p className="admin-error">{error}</p>}

      {stats && (
        <>
          {/* Stat cards */}
          <div className="admin-stats-grid">
            <div className="admin-stat-card">
              <div className="admin-stat-value">{stats.todayViews ?? 0}</div>
              <div className="admin-stat-label">Today</div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-value">{stats.weekViews ?? 0}</div>
              <div className="admin-stat-label">This Week</div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-value">{stats.uniqueVisitors ?? 0}</div>
              <div className="admin-stat-label">Unique (30d)</div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-value">{stats.totalViews ?? 0}</div>
              <div className="admin-stat-label">All Time</div>
            </div>
          </div>

          {/* Daily chart */}
          <div className="admin-card">
            <h3>Daily Views (Last 30 Days)</h3>
            <div className="admin-chart">
              {dailyData.map((d) => (
                <div className="admin-bar-col" key={d.date} title={`${d.date}: ${d.views} views`}>
                  <div className="admin-bar-count">{d.views || ''}</div>
                  <div
                    className="admin-bar"
                    style={{ height: `${(d.views / maxDaily) * 100}%` }}
                  />
                  <div className="admin-bar-label">
                    {d.date.slice(8)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent visits */}
          <div className="admin-card">
            <h3>Recent Visits</h3>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Path</th>
                    <th>Referrer</th>
                    <th>Country</th>
                    <th>IP</th>
                  </tr>
                </thead>
                <tbody>
                  {recentVisits.map((v) => (
                    <tr key={v.id}>
                      <td>{new Date(v.created_at).toLocaleString()}</td>
                      <td>{v.path}</td>
                      <td className="truncate">{v.referrer || '—'}</td>
                      <td>{v.country || '—'}</td>
                      <td>{v.ip_address}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!stats && !error && <div className="admin-loading">Loading stats...</div>}
    </div>
  );
}
