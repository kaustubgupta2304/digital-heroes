'use client';

import { useEffect, useState } from 'react';
import { supabaseBrowser } from '../../lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Signup() {
  const [charities, setCharities] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [charity, setCharity] = useState('');
  const [pct, setPct] = useState(10);
  const [plan, setPlan] = useState('monthly');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const loadCharities = async () => {
      const { data }: { data: any[] | null } = await supabaseBrowser()
        .from('charities')
        .select('*')
        .order('featured', { ascending: false });

      setCharities(data || []);

      if (data?.[0]) {
        setCharity(data[0].id);
      }
    };

    loadCharities();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const sb = supabaseBrowser();

    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          charity_id: charity,
          charity_percent: pct,
        },
      },
    });

    if (error) {
      return setError(error.message);
    }

    if (data.user) {
      localStorage.setItem('dh_plan', plan);
      localStorage.setItem('dh_charity_pct', String(pct));

      setDone(true);

      setTimeout(() => {
        router.push('/dashboard');
      }, 500);
    }
  }

  return (
    <main className="formwrap">
      <form className="formcard" onSubmit={submit}>
        <div className="eyebrow">
          Become a Hero
        </div>

        <h2
          style={{
            font: '700 34px Space Grotesk',
          }}
        >
          Start with purpose.
        </h2>

        {error && (
          <div className="error">
            {error}
          </div>
        )}

        {done && (
          <div className="success">
            Account created. Opening your dashboard…
          </div>
        )}

        <div className="field">
          <label>Full name</label>

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="field">
          <label>Email</label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="field">
          <label>Password</label>

          <input
            type="password"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className="field">
          <label>Choose a charity</label>

          <select
            value={charity}
            onChange={(e) => setCharity(e.target.value)}
            required
          >
            <option value="">
              Select a charity
            </option>

            {charities.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>
            Charity contribution: {pct}%
          </label>

          <input
            type="range"
            min={10}
            max={100}
            step={5}
            value={pct}
            onChange={(e) =>
              setPct(Number(e.target.value))
            }
          />
        </div>

        <div className="field">
          <label>Membership plan</label>

          <select
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
          >
            <option value="monthly">
              Monthly
            </option>

            <option value="yearly">
              Yearly
            </option>
          </select>
        </div>

        <button
          className="btn primary"
          type="submit"
          disabled={done}
        >
          Create account
        </button>

        <p className="muted">
          Already have an account?{' '}
          <Link href="/login">
            Log in
          </Link>
        </p>
      </form>
    </main>
  );
}