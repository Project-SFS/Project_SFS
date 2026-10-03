import { useEffect, useState } from 'react';
import axios from 'axios';
import { FiAlertTriangle, FiMail, FiTrash2, FiShield, FiCheckCircle, FiLock } from 'react-icons/fi';
import { URL } from '../../Utils';
import { useAdmin } from '../../components/admin/adminAccess';

// Main admin or a full admin (all three permissions): empty every table of the portal and delete every uploaded file. All admin accounts are
// kept. Step 1 emails a code to the admin doing the reset, step 2 asks for the code and the word RESET.
const CONFIRM_WORD = 'RESET';

const ResetPortal = () => {
  const { canManageAdmins, loading: adminLoading, user } = useAdmin();
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const [sent, setSent] = useState('');
  const [otp, setOtp] = useState('');
  const [word, setWord] = useState('');
  const [busy, setBusy] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!canManageAdmins) return;
    axios.get(`${URL}/admin/reset/summary`, { withCredentials: true })
      .then((res) => setSummary(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Could not load what will be deleted'));
  }, [canManageAdmins]);

  if (adminLoading) return null;
  if (!canManageAdmins) {
    return (
      <div className="max-w-lg mx-auto mt-16 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-8 text-center">
        <FiLock className="mx-auto text-2xl text-[#FF9900] mb-3" />
        <h1 className="text-lg font-semibold text-[#1A202C]">Only the main admin or an admin with all three permissions can reset the portal</h1>
      </div>
    );
  }

  const sendCode = async () => {
    setBusy('send');
    setError('');
    try {
      const res = await axios.post(`${URL}/admin/reset/send-otp`, {}, { withCredentials: true });
      setSent(res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send the code');
    } finally {
      setBusy('');
    }
  };

  const reset = async (e) => {
    e.preventDefault();
    if (word !== CONFIRM_WORD || otp.length !== 6) return;
    if (!window.confirm('Last check: delete EVERYTHING in the portal except the admin accounts? This cannot be undone.')) return;
    setBusy('reset');
    setError('');
    try {
      const res = await axios.post(`${URL}/admin/reset/confirm`, { otp, confirm: word }, { withCredentials: true });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'The reset failed');
    } finally {
      setBusy('');
    }
  };

  const totalRows = (summary?.tables || []).reduce((sum, t) => sum + t.rows, 0);

  if (result) {
    return (
      <div className="min-h-screen bg-[#F7F8FC] px-4 sm:px-6 py-8">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-green-200 shadow-sm p-8 text-center">
          <FiCheckCircle className="mx-auto text-5xl text-green-500" />
          <h1 className="mt-4 text-2xl font-bold text-[#1A202C]">The portal was reset</h1>
          <p className="mt-2 text-[#718096]">{result.message}</p>
          <a href="/admin/dashboard" className="inline-block mt-6 px-5 py-2.5 rounded-xl bg-[#FF9900] text-white font-semibold hover:bg-[#e68a00]">Go to the dashboard</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8FC] px-4 sm:px-6 py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#1A202C] mb-1">Reset portal</h1>
          <p className="text-[#718096] text-sm">Start again with an empty portal, for example before a new edition.</p>
        </div>

        <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-5 flex gap-3">
          <FiAlertTriangle className="text-2xl text-red-600 shrink-0" />
          <div className="text-sm text-red-900">
            <div className="font-semibold text-base mb-1">This permanently deletes everything</div>
            Every challenge, team, member, SPOC account, team login, submission, uploaded file, review and email record is deleted.
            Only the <b>admin accounts</b> are kept (listed below). There is no undo. Export anything you need first (Exports page).
          </div>
        </div>

        <section className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6">
          <h2 className="font-semibold text-[#1A202C] mb-3 flex items-center gap-2"><FiTrash2 className="text-red-500" /> What will be deleted</h2>
          {error && !summary ? <p className="text-sm text-red-600">{error}</p> : !summary ? <p className="text-sm text-[#A0AEC0]">Loading…</p> : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                {summary.tables.map((t) => (
                  <div key={t.table} className="flex justify-between border-b border-[#F1F5F9] py-1">
                    <span className="text-[#4A5568]">{t.table}</span>
                    <span className="font-semibold text-[#1A202C] tabular-nums">{t.rows}</span>
                  </div>
                ))}
                <div className="flex justify-between border-b border-[#F1F5F9] py-1">
                  <span className="text-[#4A5568]">Uploaded files</span>
                  <span className="font-semibold text-[#1A202C] tabular-nums">{summary.files}</span>
                </div>
              </div>
              <p className="text-xs text-[#718096] mt-3">{totalRows} records and {summary.files} files in total.</p>
              <div className="mt-4 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm">
                <div className="font-semibold text-green-800 mb-1">Kept: {summary.keep.length} admin account{summary.keep.length === 1 ? '' : 's'}</div>
                <ul className="text-green-900 space-y-0.5">
                  {summary.keep.map((a) => (
                    <li key={a.email} className="break-all">{a.email}{a.main ? ' (main admin)' : ''}</li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </section>

        <section className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6">
          <div className="text-xs font-semibold uppercase tracking-wide text-[#FF9900] mb-1">Step 1</div>
          <h2 className="font-semibold text-[#1A202C] mb-1 flex items-center gap-2"><FiMail /> Get a confirmation code</h2>
          <p className="text-sm text-[#718096] mb-4">A 6-digit code is emailed to you ({user?.EMAIL}). It is valid for 10 minutes. The main admin is told when the reset is done.</p>
          <button type="button" onClick={sendCode} disabled={busy === 'send'} className="px-4 py-2.5 rounded-xl border border-[#FF9900] text-[#FF9900] font-medium hover:bg-[#FF9900] hover:text-white transition disabled:opacity-60">
            {busy === 'send' ? 'Sending…' : sent ? 'Send a new code' : 'Send code'}
          </button>
          {sent && <p className="text-sm text-green-700 mt-3">{sent}</p>}
        </section>

        <form onSubmit={reset} className={`bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6 ${sent ? '' : 'opacity-60'}`}>
          <div className="text-xs font-semibold uppercase tracking-wide text-[#FF9900] mb-1">Step 2</div>
          <h2 className="font-semibold text-[#1A202C] mb-4 flex items-center gap-2"><FiShield /> Confirm the reset</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-semibold text-[#4A5568]">Code from the email</span>
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="6 digits"
                disabled={!sent}
                className="mt-1.5 w-full px-4 py-3 border border-[#E2E8F0] rounded-xl tracking-[0.4em] font-semibold focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-[#4A5568]">Type {CONFIRM_WORD} to confirm</span>
              <input
                value={word}
                onChange={(e) => setWord(e.target.value)}
                placeholder={CONFIRM_WORD}
                disabled={!sent}
                className="mt-1.5 w-full px-4 py-3 border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
              />
            </label>
          </div>
          {error && summary && <p className="text-sm text-red-600 mt-3">{error}</p>}
          <button
            type="submit"
            disabled={!sent || otp.length !== 6 || word !== CONFIRM_WORD || busy === 'reset'}
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiTrash2 /> {busy === 'reset' ? 'Resetting…' : 'Reset the portal'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPortal;
