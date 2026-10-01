import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { FiUser, FiMail, FiPhone, FiBriefcase, FiSend, FiCheckCircle, FiMessageSquare } from "react-icons/fi";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { URL } from "../Utils";

const TYPES = ["Student", "Faculty / SPOC", "College / Institution", "Industry partner", "Other"];
const EMPTY = { name: "", email: "", phone: "", organisation: "", type: "Student", message: "" };

const input = "w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-[#fc9300] transition";

const Field = ({ id, label, icon: Icon, optional, children }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-semibold text-gray-700 mb-1.5">
      {label} {optional && <span className="font-normal text-gray-400">(optional)</span>}
    </label>
    <div className="relative">
      <Icon className="absolute left-4 top-3.5 text-gray-400" />
      {children}
    </div>
  </div>
);

const SubmitInterest = () => {
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      await axios.post(`${URL}/public/interest`, form);
      setSent(true);
      setForm(EMPTY);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not submit right now. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-orange-50 via-white to-orange-100">
      <Header />
      <Toaster position="top-right" />
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 pt-28 pb-16">
        <div className="text-center mb-10">
          <div className="inline-flex items-center rounded-full border border-[#fc9300]/40 bg-[#fff7ec] px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-[#fc9300] mb-3">
            Solve For Sakthi
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Submit your Interest</h1>
          <p className="text-gray-600 mt-3 max-w-2xl mx-auto">
            Students, faculty, colleges and industry partners: tell us how you would like to take part and our team will get back to you.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-orange-100 p-6 sm:p-10">
          {sent ? (
            <div className="text-center py-10">
              <FiCheckCircle className="mx-auto text-5xl text-green-500" />
              <h2 className="mt-4 text-2xl font-bold text-gray-900">Thank you!</h2>
              <p className="mt-2 text-gray-600 max-w-md mx-auto">
                Your interest has been submitted. A confirmation is on its way to your email, and our team will contact you soon.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/problemstatements" className="px-6 py-3 rounded-xl bg-[#fc9300] text-white font-semibold hover:bg-[#e68400]">Explore Challenges</Link>
                <button onClick={() => setSent(false)} className="px-6 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50">Submit another</button>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <Field id="int-name" label="Full name" icon={FiUser}>
                  <input id="int-name" value={form.name} onChange={set("name")} required minLength={2} maxLength={120} placeholder="Your name" className={input} />
                </Field>
                <Field id="int-email" label="Email address" icon={FiMail}>
                  <input id="int-email" type="email" value={form.email} onChange={set("email")} required maxLength={200} placeholder="you@example.com" className={input} />
                </Field>
                <Field id="int-phone" label="Phone" icon={FiPhone} optional>
                  <input id="int-phone" type="tel" value={form.phone} onChange={set("phone")} maxLength={20} placeholder="+91 …" className={input} />
                </Field>
                <Field id="int-org" label="College / organisation" icon={FiBriefcase}>
                  <input id="int-org" value={form.organisation} onChange={set("organisation")} required maxLength={200} placeholder="Where you study or work" className={input} />
                </Field>
              </div>

              <div>
                <span className="block text-sm font-semibold text-gray-700 mb-2">I am a</span>
                <div className="flex flex-wrap gap-2">
                  {TYPES.map((t) => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setForm((f) => ({ ...f, type: t }))}
                      className={`px-4 py-2 rounded-full text-sm font-medium border transition ${form.type === t ? "bg-[#fc9300] border-[#fc9300] text-white" : "bg-white border-gray-200 text-gray-700 hover:border-[#fc9300]"}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <Field id="int-msg" label="Your interest" icon={FiMessageSquare}>
                <textarea
                  id="int-msg"
                  value={form.message}
                  onChange={set("message")}
                  required
                  minLength={10}
                  maxLength={2000}
                  rows={5}
                  placeholder="Which challenges or areas interest you, and how would you like to take part?"
                  className={`${input} resize-y`}
                />
              </Field>
              <p className="text-xs text-gray-400 text-right -mt-3">{form.message.length}/2000</p>

              <button
                type="submit"
                disabled={busy}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#fc9300] text-white py-3 px-8 rounded-xl font-semibold hover:bg-[#e68400] transition disabled:opacity-60"
              >
                <FiSend /> {busy ? "Submitting…" : "Submit interest"}
              </button>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SubmitInterest;
