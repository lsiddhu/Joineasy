import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layers3, ShieldCheck, Users } from "lucide-react";

import { errorMessage } from "../services/api";
import { registerStudent } from "../services/authService";

import { Button, Notice, Field } from "../components/Common";

export default function Register() {
  const nav = useNavigate();
  const [form, setForm] = useState({
      name: "",
      email: "",
      studentId: "",
      password: "",
    }),
    [busy, setBusy] = useState(false),
    [err, setErr] = useState(""),
    [ok, setOk] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const { data } = await registerStudent(form);
      setOk(data.message || "Account created. Sign in to continue.");
      setTimeout(() => nav("/login"), 800);
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
            <Users size={24} />
          </div>
          <h2>Make room for better teamwork.</h2>
          <p>
            Create your account, find your group and keep your coursework in
            sync.
          </p>
          <div className="visual-foot">
            <span className="visual-line" />
            <small>One place for every team</small>
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
          <div className="eyebrow">STUDENT PORTAL</div>
          <h1>Create your account</h1>
          <p className="muted">Join your classmates and get started.</p>
          <Notice>{err}</Notice>
          <Notice type="success">{ok}</Notice>
          <form className="form" onSubmit={submit}>
            <Field label="Full name">
              <input
                required
                placeholder="Your name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Field>
            <Field label="University email">
              <input
                type="email"
                required
                placeholder="you@university.edu"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>
            <Field label="Student ID">
              <input
                required
                placeholder="e.g. STU-20481"
                value={form.studentId}
                onChange={(e) =>
                  setForm({ ...form, studentId: e.target.value })
                }
              />
            </Field>
            <Field label="Password" hint="Use at least 8 characters">
              <input
                type="password"
                minLength="8"
                required
                placeholder="Create a password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </Field>
            <Button disabled={busy}>
              {busy ? "Creating account…" : "Create account"} <span>→</span>
            </Button>
          </form>
          <p className="auth-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
          <div className="secure-note">
            <ShieldCheck size={15} /> Your information stays secure
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
