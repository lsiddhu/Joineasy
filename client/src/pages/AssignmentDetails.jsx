import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Activity, CheckCircle2, FileText, Search, Users } from "lucide-react";

import { errorMessage } from "../services/api";
import { getSubmissionStatus } from "../services/assignmentService";
import Stat from "../components/StatCard";
import ProgressBar from "../components/ProgressBar";

import {
  date,
  Notice,
  Loader,
  PageTitle,
  Card,
  Empty,
} from "../components/Common";

export default function AssignmentDetails() {
  const { id } = useParams(),
    [status, setStatus] = useState(null),
    [loading, setLoading] = useState(true),
    [err, setErr] = useState(""),
    [q, setQ] = useState(""),
    [statusFilter, setStatusFilter] = useState("ALL");
  useEffect(() => {
    getSubmissionStatus(id)
      .then((r) => setStatus(r.data))
      .catch((e) => setErr(errorMessage(e)))
      .finally(() => setLoading(false));
  }, [id]);
  if (loading) return <Loader />;
  const s = status?.summary || {};
  const students = (status?.students || []).filter((student) => {
    const matchesQuery = `${student.name} ${student.email} ${student.studentId}`
      .toLowerCase()
      .includes(q.toLowerCase());
    const matchesStatus =
      statusFilter === "ALL" || student.status === statusFilter;

    return matchesQuery && matchesStatus;
  });
  return (
    <>
      <PageTitle
        eyebrow="SUBMISSION TRACKING"
        title={status?.assignment?.title || "Assignment progress"}
        subtitle={`${status?.assignment?.submissionType === "GROUP" ? "Group" : "Individual"} submission · Confirmation status by student and group.`}
        action={
          <Link to="/professor/assignments" className="button secondary">
            ← Assignments
          </Link>
        }
      />
      <Notice>{err}</Notice>
      <div className="stats-grid">
        <Stat
          label="Total students"
          value={s.totalStudents || 0}
          icon={Users}
          tone="blue"
          detail="Eligible for this assignment"
        />
        <Stat
          label="Confirmed"
          value={s.confirmed || 0}
          icon={CheckCircle2}
          tone="green"
          detail="Submission complete"
        />
        <Stat
          label="Pending"
          value={s.pending || 0}
          icon={Activity}
          tone="amber"
          detail="Started, not confirmed"
        />
        <Stat
          label="Not started"
          value={s.notStarted || 0}
          icon={FileText}
          tone="violet"
          detail="No confirmation started"
        />
      </div>
      <Card className="assignment-table-card">
        <div className="table-toolbar">
          <div>
            <h2>Student submissions</h2>
            <p>Group completion and student confirmations.</p>
          </div>
          <div className="submission-filters">
            <label className="search-box">
              <Search size={16} />
              <input
                placeholder="Find a student"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </label>
            <select
              aria-label="Filter submissions by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All statuses</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PENDING">Pending</option>
              <option value="NOT_STARTED">Not started</option>
            </select>
          </div>
        </div>
        {status?.groupSummary?.length > 0 && (
          <div className="group-summary-strip">
            {status.groupSummary.map((g) => (
              <div className="group-summary-item" key={g.groupId}>
                <span>
                  <Users size={16} />
                  {g.groupName}
                </span>
                <ProgressBar
                  value={
                    g.totalStudents
                      ? (g.confirmedStudents / g.totalStudents) * 100
                      : 0
                  }
                  label={`${g.confirmedStudents}/${g.totalStudents} confirmed`}
                />
              </div>
            ))}
          </div>
        )}
        {students.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>STUDENT</th>
                  <th>STUDENT ID</th>
                  <th>GROUP</th>
                  <th>STATUS</th>
                  {status?.assignment?.submissionType === "GROUP" && (
                    <th>ACKNOWLEDGED BY</th>
                  )}
                  <th>CONFIRMED AT</th>
                </tr>
              </thead>
              <tbody>
                {students.map((st) => (
                  <tr key={st.id}>
                    <td>
                      <div className="student-table-name">
                        <span className="member-avatar">
                          {st.name
                            .split(" ")
                            .map((x) => x[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()}
                        </span>
                        <div>
                          <b>{st.name}</b>
                          <small>{st.email}</small>
                        </div>
                      </div>
                    </td>
                    <td>{st.studentId || "—"}</td>
                    <td>{st.group?.name || "No group"}</td>
                    <td>
                      <span
                        className={`pill ${st.status === "CONFIRMED" ? "green" : st.status === "PENDING" ? "amber" : "neutral"}`}
                      >
                        {st.status === "NOT_STARTED"
                          ? "Not started"
                          : st.status === "CONFIRMED"
                            ? "Confirmed"
                            : "Pending"}
                      </span>
                    </td>
                    {status?.assignment?.submissionType === "GROUP" && (
                      <td>{st.confirmedBy?.name || "—"}</td>
                    )}
                    <td>{st.confirmedAt ? date(st.confirmedAt) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="No student records"
            text="Students eligible for this assignment will appear here."
          />
        )}
      </Card>
    </>
  );
}
