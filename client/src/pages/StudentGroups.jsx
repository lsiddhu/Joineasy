import { useEffect, useState } from "react";

import { Plus, Users } from "lucide-react";

import { errorMessage } from "../services/api";
import {
  getMyGroup,
  createGroup,
  joinGroup,
  addGroupMember,
} from "../services/groupService";
import { getGroupProgress } from "../services/assignmentService";

import {
  date,
  Button,
  Notice,
  Loader,
  PageTitle,
  Card,
  Empty,
  Field,
} from "../components/Common";

export default function StudentGroups() {
  const [group, setGroup] = useState(null),
    [progress, setProgress] = useState(null),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [err, setErr] = useState(""),
    [ok, setOk] = useState(""),
    [mode, setMode] = useState(""),
    [form, setForm] = useState({
      name: "",
      inviteCode: "",
      email: "",
      studentId: "",
    });
  const load = async () => {
    setLoading(true);
    const [g, p] = await Promise.allSettled([getMyGroup(), getGroupProgress()]);
    setGroup(g.status === "fulfilled" ? g.value.data.group : null);
    setProgress(p.status === "fulfilled" ? p.value.data : null);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);
  const run = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    setOk("");
    try {
      let d;
      if (mode === "create") d = (await createGroup(form.name)).data;
      if (mode === "join") d = (await joinGroup(form.inviteCode)).data;
      if (mode === "add")
        d = (
          await addGroupMember(
            form.email ? { email: form.email } : { studentId: form.studentId },
          )
        ).data;
      setOk(d?.message || "Group updated.");
      setForm({ name: "", inviteCode: "", email: "", studentId: "" });
      setMode("");
      await load();
    } catch (x) {
      setErr(errorMessage(x));
    } finally {
      setBusy(false);
    }
  };
  if (loading) return <Loader />;
  const isLeader =
    group?.leaderId === JSON.parse(localStorage.getItem("user") || "{}").id;
  return (
    <>
      <PageTitle
        eyebrow="YOUR TEAM"
        title="My group"
        subtitle="Manage your team and keep track of shared progress."
      />
      <Notice>{err}</Notice>
      <Notice type="success">{ok}</Notice>
      {!group ? (
        <Card>
          <Empty
            icon={Users}
            title="Find your people"
            text="Create a group for your project or join one with an invite code."
          />
          <div className="choice-actions">
            <Button onClick={() => setMode("create")}>
              <Plus size={16} /> Create a group
            </Button>
            <Button variant="secondary" onClick={() => setMode("join")}>
              Join with invite code
            </Button>
          </div>
          {mode && (
            <form className="inline-form" onSubmit={run}>
              <Field label={mode === "create" ? "Group name" : "Invite code"}>
                <input
                  required
                  value={mode === "create" ? form.name : form.inviteCode}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      [mode === "create" ? "name" : "inviteCode"]:
                        e.target.value,
                    })
                  }
                />
              </Field>
              <Button disabled={busy}>
                {busy
                  ? "Please wait…"
                  : mode === "create"
                    ? "Create group"
                    : "Join group"}
              </Button>
              <button
                type="button"
                className="quiet-button"
                onClick={() => setMode("")}
              >
                Cancel
              </button>
            </form>
          )}
        </Card>
      ) : (
        <>
          <div className="group-banner">
            <div className="group-banner-icon">
              <Users size={24} />
            </div>
            <div className="group-banner-main">
              <div className="eyebrow">PROJECT TEAM</div>
              <h2>{group.name}</h2>
              <p>
                Led by {group.leader?.name || "your group lead"} · Created{" "}
                {date(group.createdAt)}
              </p>
            </div>
            <div className="invite-box">
              <small>INVITE CODE</small>
              <b>{group.inviteCode}</b>
            </div>
          </div>
          <div className="group-page-grid">
            <Card>
              <div className="card-heading">
                <div>
                  <h2>Team members</h2>
                  <p>
                    {group.totalMembers || group.members?.length} of 4 spots
                    filled
                  </p>
                </div>
                {isLeader && group.availableSlots > 0 && (
                  <Button
                    variant="secondary"
                    onClick={() => setMode(mode === "add" ? "" : "add")}
                  >
                    <Plus size={15} /> Add member
                  </Button>
                )}
              </div>
              {mode === "add" && (
                <form className="add-form" onSubmit={run}>
                  <Field label="Add by email or student ID">
                    <div className="input-split">
                      <input
                        placeholder="Email address"
                        type="email"
                        value={form.email}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            email: e.target.value,
                            studentId: "",
                          })
                        }
                      />
                      <span>or</span>
                      <input
                        placeholder="Student ID"
                        value={form.studentId}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            studentId: e.target.value,
                            email: "",
                          })
                        }
                      />
                    </div>
                  </Field>
                  <Button disabled={busy}>
                    {busy ? "Adding…" : "Add member"}
                  </Button>
                </form>
              )}
              <div className="member-list">
                {group.members?.map((m) => (
                  <div className="member-row" key={m.id}>
                    <span className="member-avatar">
                      {m.name
                        ?.split(" ")
                        .map((x) => x[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </span>
                    <span className="member-meta">
                      <b>{m.name}</b>
                      <small>{m.email || m.studentId}</small>
                    </span>
                    {m.id === group.leaderId && (
                      <span className="leader-tag">LEADER</span>
                    )}
                  </div>
                ))}
              </div>
              <div className="member-capacity">
                {Array.from({
                  length: Math.max(0, 4 - (group.members?.length || 0)),
                }).map((_, i) => (
                  <div className="empty-slot" key={i}>
                    <Plus size={14} /> Open spot
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <div className="card-heading">
                <div>
                  <h2>Submission progress</h2>
                  <p>Progress across shared assignments.</p>
                </div>
              </div>
              {progress ? (
                <>
                  <div className="progress-summary">
                    <b>{progress.progressPercentage}%</b>
                    <span>
                      {progress.completedTasks} of {progress.totalTasks}{" "}
                      submissions confirmed
                    </span>
                  </div>
                  <div className="progress-track large">
                    <i style={{ width: `${progress.progressPercentage}%` }} />
                  </div>
                  <div className="member-progress">
                    {progress.members?.map((m) => (
                      <div key={m.id} className="member-progress-row">
                        <span>{m.name}</span>
                        <span>
                          {m.completedAssignments}/{progress.totalAssignments}
                        </span>
                        <div className="progress-track">
                          <i
                            style={{
                              width: `${progress.totalAssignments ? (m.completedAssignments / progress.totalAssignments) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="empty small">
                  <p>
                    Group progress becomes available when your team has
                    assignments.
                  </p>
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </>
  );
}
