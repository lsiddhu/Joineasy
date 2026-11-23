import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, Layers3, ShieldCheck } from "lucide-react";

import { errorMessage } from "../services/api";
import { loginStudent, loginProfessor } from "../services/authService";

import { useAuth } from "../context/AuthContext";
import { routes, Button, Notice, Field } from "../components/Common";

export default function Login({ professor = false }) {
  const { login } = useAuth(),
    nav = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" }),
    [busy, setBusy] = useState(false),
    [err, setErr] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const { data } = await (professor
        ? loginProfessor(form)
        : loginStudent(form));
      const profile = professor ? data.professor : data.student;
      if (profile?.role !== (professor ? "PROFESSOR" : "STUDENT"))
        throw new Error("This account cannot use this sign in.");
      login(profile, data.token);
      nav(routes[profile.role]);
    } catch (x) {
      setErr(errorMessage(x));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="auth-page">
      <div className="auth-visual">
        <Link className="brand light" to="/">
          <span className="brand-mark">
            <Layers3 size={20} />
          </span>{" "}
          joineazy
        </Link>
        <div className="visual-copy">
          <div className="visual-icon">
            <GraduationCap size={26} />
          </div>
          <h2>
            {professor
              ? "Make every class project count."
              : "Great work starts together."}
          </h2>
          <p>
            {professor
              ? "A clear view of assignments, teams and progress, all in one place."
              : "Bring your team together and keep every assignment moving forward."}
          </p>
          <div className="visual-foot">
            <span className="avatar-stack">
              <i>JD</i>
              <i>MK</i>
              <i>AL</i>
            </span>
            <small>Built for better collaboration</small>
          </div>
        </div>
        <div className="visual-bottom">
          A focused workspace for learning together.
        </div>
      </div>
      <div className="auth-main">
        <Link className="brand mobile-brand" to="/">
          <span className="brand-mark">
            <Layers3 size={20} />
          </span>{" "}
          joineazy
        </Link>
        <div className="auth-form-wrap">
          <div className="eyebrow">
            {professor ? "PROFESSOR PORTAL" : "STUDENT PORTAL"}
          </div>
          <h1>Welcome back</h1>
          <p className="muted">Sign in to continue to your workspace.</p>
          <Notice>{err}</Notice>
          <form onSubmit={submit} className="form">
            <Field label="Email address">
              <input
                type="email"
                autoComplete="email"
                required
                placeholder="you@university.edu"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>
            <Field label="Password">
              <input
                type="password"
                autoComplete="current-password"
                required
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </Field>
            <Button disabled={busy}>
              {busy ? "Signing in…" : "Sign in"} <span>→</span>
            </Button>
          </form>
          {!professor && (
            <p className="auth-switch">
              New to Joineazy? <Link to="/register">Create an account</Link>
            </p>
          )}
          <p className="auth-switch professor-link">
            {professor ? (
              <Link to="/login">Student sign in</Link>
            ) : (
              <Link to="/professor/login">Professor sign in</Link>
            )}
          </p>
          <div className="secure-note">
            <ShieldCheck size={15} /> Secure access to your workspace
          </div>
        </div>
        <div className="auth-legal">
          © {new Date().getFullYear()} Joineazy <span>•</span> Learning works
          better together
        </div>
      </div>
    </div>
  );
}
