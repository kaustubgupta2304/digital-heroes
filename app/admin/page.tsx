'use client';

import { useEffect, useState } from 'react';
import { supabaseBrowser } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

function pick() {
  const a = new Set<number>();

  while (a.size < 5) {
    a.add(Math.floor(Math.random() * 45) + 1);
  }

  return [...a].sort((a, b) => a - b);
}

export default function Admin() {
  const sb = supabaseBrowser();
  const router = useRouter();

  const [ok, setOk] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [draw, setDraw] = useState<number[]>([]);
  const [msg, setMsg] = useState('');
  const [charities, setCharities] = useState<any[]>([]);
  const [winners, setWinners] = useState<any[]>([]);
  const [newCharity, setNewCharity] = useState('');

  const [stats, setStats] = useState({
    users: 0,
    pool: 0,
    charity: 0,
  });

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await sb.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const { data: p } = await sb
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (p?.role !== 'admin') {
        router.push('/dashboard');
        return;
      }

      setOk(true);

      const [{ data: u }, { data: c }, { data: w }] = await Promise.all([
        sb
          .from('profiles')
          .select(
            'id,full_name,subscription_status,charity_percent,renewal_date'
          ),

        sb
          .from('charities')
          .select('*')
          .order('created_at'),

        sb
          .from('winners')
          .select('*,profiles(full_name),draws(draw_month,draw_numbers)')
          .order('created_at', { ascending: false }),
      ]);

      setUsers(u || []);
      setCharities(c || []);
      setWinners(w || []);

      // Fixed TypeScript error here
      const active = (u || []).filter(
        (x: any) => x.subscription_status === 'active'
      );

      setStats({
        users: active.length,
        pool: active.length * 499 * 0.2,
        charity: active.reduce(
          (a: number, x: any) =>
            a + 499 * (x.charity_percent / 100),
          0
        ),
      });
    })();
  }, []);

  async function runDraw() {
    const nums = pick();

    setDraw(nums);
    setMsg('Simulation generated. Publish it when ready.');
  }

  async function publish() {
    if (!draw.length) {
      return setMsg('Simulate a draw first.');
    }

    const pool = stats.pool;

    const { data: d, error } = await sb
      .from('draws')
      .insert({
        draw_month: new Date().toISOString().slice(0, 7),
        draw_numbers: draw,
        draw_type: 'random',
        status: 'published',
        prize_pool: pool,
        jackpot_rollover: 0,
      })
      .select()
      .single();

    if (error) {
      return setMsg(error.message);
    }

    const active = users.filter(
      (u: any) => u.subscription_status === 'active'
    );

    const rows: any[] = [];

    for (const u of active) {
      const { data: s } = await sb
        .from('scores')
        .select('score')
        .eq('user_id', u.id)
        .order('score_date', { ascending: false })
        .limit(5);

      const match = (s || []).filter((x: any) =>
        draw.includes(x.score)
      ).length;

      if (match >= 3) {
        const share =
          match === 5
            ? pool * 0.4
            : match === 4
              ? pool * 0.35
              : pool * 0.25;

        rows.push({
          draw_id: d.id,
          user_id: u.id,
          tier: match,
          amount: share,
          verification_status: 'pending',
          payment_status: 'pending',
        });
      }
    }

    if (rows.length) {
      await sb.from('winners').insert(rows);
    }

    setMsg(
      `Draw published. ${rows.length} winner record(s) created for verification.`
    );

    const { data: w } = await sb
      .from('winners')
      .select('*,profiles(full_name),draws(draw_month,draw_numbers)')
      .order('created_at', { ascending: false });

    setWinners(w || []);
  }

  async function updateWinner(
    id: string,
    verification_status: string,
    payment_status: string
  ) {
    const { error } = await sb
      .from('winners')
      .update({
        verification_status,
        payment_status,
      })
      .eq('id', id);

    setMsg(error ? error.message : 'Winner updated.');

    const { data: w } = await sb
      .from('winners')
      .select('*,profiles(full_name),draws(draw_month,draw_numbers)')
      .order('created_at', { ascending: false });

    setWinners(w || []);
  }

  async function addCharity() {
    if (!newCharity.trim()) return;

    const { error } = await sb.from('charities').insert({
      name: newCharity,
      slug: newCharity
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-'),
      description:
        'A community cause supported by Digital Heroes.',
      featured: false,
    });

    setMsg(error ? error.message : 'Charity added.');
    setNewCharity('');

    const { data } = await sb
      .from('charities')
      .select('*');

    setCharities(data || []);
  }

  if (!ok) {
    return (
      <main className="dashboard container">
        Checking access…
      </main>
    );
  }

  return (
    <main className="dashboard container">
      <div className="topbar">
        <div>
          <div className="eyebrow">Operations</div>

          <h1
            style={{
              font: '700 42px Space Grotesk',
              margin: '5px 0',
            }}
          >
            Admin control room.
          </h1>
        </div>

        <button
          className="btn ghost"
          onClick={async () => {
            await sb.auth.signOut();
            router.push('/');
          }}
        >
          Log out
        </button>
      </div>

      <div className="mini">
        <div className="card">
          <div className="muted">Active users</div>
          <div className="metric">{stats.users}</div>
        </div>

        <div className="card">
          <div className="muted">Prize pool</div>
          <div className="metric">
            ₹{Math.round(stats.pool)}
          </div>
        </div>

        <div className="card">
          <div className="muted">Charity total</div>
          <div className="metric">
            ₹{Math.round(stats.charity)}
          </div>
        </div>

        <div className="card">
          <div className="muted">Charities</div>
          <div className="metric">
            {charities.length}
          </div>
        </div>
      </div>

      <div
        className="adminnav"
        style={{ marginTop: 20 }}
      >
        <span className="pill">Users</span>
        <span className="pill">Draw management</span>
        <span className="pill">Charities</span>
        <span className="pill">Winners</span>
        <span className="pill">Reports</span>
      </div>

      <div className="dashgrid">
        <section className="card">
          <div className="eyebrow">User management</div>

          <h2
            style={{
              font: '700 28px Space Grotesk',
            }}
          >
            Subscribers
          </h2>

          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Charity</th>
                  <th>Renewal</th>
                </tr>
              </thead>

              <tbody>
                {users.map((u: any) => (
                  <tr key={u.id}>
                    <td>{u.full_name || '—'}</td>

                    <td>
                      <span className="badge">
                        {u.subscription_status}
                      </span>
                    </td>

                    <td>{u.charity_percent}%</td>

                    <td>
                      {u.renewal_date
                        ? new Date(
                            u.renewal_date
                          ).toLocaleDateString()
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card">
          <div className="eyebrow">
            Draw management
          </div>

          <h2
            style={{
              font: '700 28px Space Grotesk',
            }}
          >
            Monthly simulation
          </h2>

          <p className="muted">
            Generate five unique numbers from 1–45,
            then publish after review. The implementation
            uses a configurable 20% subscription allocation
            for the prize pool because the PRD specifies a
            fixed portion but does not state its percentage.
          </p>

          <div
            style={{
              display: 'flex',
              gap: 8,
              flexWrap: 'wrap',
              margin: '18px 0',
            }}
          >
            {draw.map((n) => (
              <span
                key={n}
                className="pill"
                style={{
                  fontSize: 18,
                  padding: '10px 14px',
                }}
              >
                {n}
              </span>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn secondary"
              onClick={runDraw}
            >
              Simulate
            </button>

            <button
              className="btn dark"
              onClick={publish}
            >
              Publish
            </button>
          </div>

          {msg && (
            <div
              className="success"
              style={{ marginTop: 12 }}
            >
              {msg}
            </div>
          )}
        </section>
      </div>

      <section
        className="card"
        style={{ marginTop: 18 }}
      >
        <div className="eyebrow">
          Winner verification
        </div>

        <h2
          style={{
            font: '700 28px Space Grotesk',
          }}
        >
          Review submissions
        </h2>

        {winners.length === 0 ? (
          <p className="muted">
            No winner records yet.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Winner</th>
                  <th>Tier</th>
                  <th>Amount</th>
                  <th>Proof</th>
                  <th>Verification</th>
                  <th>Payment</th>
                </tr>
              </thead>

              <tbody>
                {winners.map((w: any) => (
                  <tr key={w.id}>
                    <td>
                      {w.profiles?.full_name || '—'}
                    </td>

                    <td>{w.tier}-match</td>

                    <td>₹{w.amount}</td>

                    <td>
                      {w.proof_url ? (
                        <a
                          href={w.proof_url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            color: 'var(--green)',
                            fontWeight: 700,
                          }}
                        >
                          View
                        </a>
                      ) : (
                        'Not uploaded'
                      )}
                    </td>

                    <td>
                      <select
                        value={w.verification_status}
                        onChange={(e) =>
                          updateWinner(
                            w.id,
                            e.target.value,
                            w.payment_status
                          )
                        }
                      >
                        <option>pending</option>
                        <option>approved</option>
                        <option>rejected</option>
                      </select>
                    </td>

                    <td>
                      <select
                        value={w.payment_status}
                        onChange={(e) =>
                          updateWinner(
                            w.id,
                            w.verification_status,
                            e.target.value
                          )
                        }
                      >
                        <option>pending</option>
                        <option>paid</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section
        className="card"
        style={{ marginTop: 18 }}
      >
        <div className="eyebrow">
          Charity management
        </div>

        <h2
          style={{
            font: '700 28px Space Grotesk',
          }}
        >
          Directory
        </h2>

        <div
          style={{
            display: 'flex',
            gap: 8,
            marginBottom: 14,
          }}
        >
          <input
            value={newCharity}
            onChange={(e) =>
              setNewCharity(e.target.value)
            }
            placeholder="New charity name"
            style={{
              flex: 1,
              padding: 12,
              border: '1px solid var(--line)',
              borderRadius: 10,
            }}
          />

          <button
            className="btn primary"
            onClick={addCharity}
          >
            Add
          </button>
        </div>

        <div className="grid3">
          {charities.map((c: any) => (
            <div className="card" key={c.id}>
              <b>{c.name}</b>

              <p
                className="muted"
                style={{ fontSize: 13 }}
              >
                {c.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}