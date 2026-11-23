import { X, LoaderCircle, FileText, ExternalLink } from "lucide-react";
export const routes = {
  STUDENT: "/student/dashboard",
  PROFESSOR: "/professor/dashboard",
};
export const date = (d) =>
  d
    ? new Date(d).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";
export const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
};

export function Button({ children, variant = "primary", ...props }) {
  return (
    <button className={`button ${variant}`} {...props}>
      {children}
    </button>
  );
}

export function Notice({ type = "error", children }) {
  return children ? <div className={`notice ${type}`}>{children}</div> : null;
}

export function Loader() {
  return (
    <div className="loading">
      <LoaderCircle className="spin" size={21} /> Loading your workspace…
    </div>
  );
}

export function PageTitle({ eyebrow, title, subtitle, action }) {
  return (
    <div className="page-title">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className = "" }) {
  return <section className={`card ${className}`}>{children}</section>;
}

export function Empty({ icon: Icon = FileText, title, text, action }) {
  return (
    <div className="empty">
      <span>
        <Icon size={22} />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}

export function Field({ label, children, hint }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}

export function AssignmentCard({
  assignment: a,
  start,
  busy,
  status = "NOT_STARTED",
  confirmedAt,
}) {
  const confirmed = status === "CONFIRMED";
  const pending = status === "PENDING";
  return (
    <Card className="student-assignment">
      <div className="assignment-card-top">
        <span className="file-icon">
          <FileText size={18} />
        </span>
        <span
          className={`pill ${confirmed ? "green" : pending ? "amber" : new Date(a.dueDate) < new Date() ? "overdue" : "blue"}`}
        >
          {confirmed
            ? "Confirmed"
            : pending
              ? "Pending confirmation"
              : new Date(a.dueDate) < new Date()
                ? "Past due"
                : "Not started"}
        </span>
      </div>
      <h3>{a.title}</h3>
      <p className="assignment-description">{a.description}</p>
      <div className="assignment-meta">
        <span>Due {date(a.dueDate)}</span>
        <span>·</span>
        <span>
          {a.assignToAll
            ? "All students"
            : a.groups
                ?.map((x) => x.group?.name)
                .filter(Boolean)
                .join(", ") || "Your group"}
        </span>
      </div>
      {confirmedAt && (
        <div className="assignment-meta confirmation-time">
          Confirmed {new Date(confirmedAt).toLocaleString()}
        </div>
      )}
      <div className="assignment-actions">
        <a
          href={a.oneDriveUrl}
          className="button secondary"
          target="_blank"
          rel="noreferrer"
        >
          Open OneDrive <ExternalLink size={15} />
        </a>
        <Button disabled={confirmed || busy} onClick={start}>
          {busy
            ? "Starting…"
            : confirmed
              ? "Submitted"
              : pending
                ? "Continue confirmation"
                : "Yes, I have submitted"}
        </Button>
      </div>
    </Card>
  );
}

export function Modal({ title, close, children }) {
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && close()}
    >
      <div className="modal">
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="icon-button" onClick={close}>
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
