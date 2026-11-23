import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  CheckCircle2,
  ClipboardList,
  FileText,
  Plus,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { errorMessage } from "../services/api";
import {
  getProfessorAssignments,
  getProfessorAnalytics,
} from "../services/assignmentService";
import Stat from "../components/StatCard";

import {
  date,
  greeting,
  Notice,
  Loader,
  PageTitle,
  Card,
  Empty,
} from "../components/Common";

export default function ProfessorDashboard() {
  const [analytics, setAnalytics] = useState(null),
    [assignments, setAssignments] = useState([]),
    [loading, setLoading] = useState(true),
    [err, setErr] = useState("");
  useEffect(() => {
    Promise.all([getProfessorAnalytics(), getProfessorAssignments()])
      .then(([a, b]) => {
        setAnalytics(a.data);
        setAssignments(b.data.assignments || []);
      })
      .catch((e) => setErr(errorMessage(e)))
      .finally(() => setLoading(false));
  }, []);
  if (loading) return <Loader />;
  const o = analytics?.overview || {},
    chart = (analytics?.assignmentAnalytics || []).map((a) => ({
      name: a.title.length > 18 ? a.title.slice(0, 16) + "…" : a.title,
      completion: a.completionPercentage,
      confirmed: a.confirmed,
      pending: a.pending,
    }));
  return (
    <>
      <PageTitle
        eyebrow="PROFESSOR WORKSPACE"
        title={`${greeting()}.`}
        subtitle="Here’s a snapshot of your class activity."
        action={
          <Link className="button primary" to="/professor/assignments?new=1">
            <Plus size={16} /> New assignment
          </Link>
        }
      />
      <Notice>{err}</Notice>
      <div className="stats-grid">
        <Stat
          label="Assignments"
          value={o.totalAssignments ?? 0}
          icon={ClipboardList}
          tone="blue"
          detail="Created by you"
        />
        <Stat
          label="Students"
          value={o.totalStudents ?? 0}
          icon={Users}
          tone="violet"
          detail="Across all groups"
        />
        <Stat
          label="Eligible submissions"
          value={o.totalEligibleSubmissions ?? 0}
          icon={FileText}
          tone="violet"
          detail="Students assigned across coursework"
        />
        <Stat
          label="Confirmed"
          value={o.totalConfirmed ?? 0}
          icon={CheckCircle2}
          tone="green"
          detail="Submissions received"
        />
        <Stat
          label="Pending"
          value={o.totalPending ?? 0}
          icon={Activity}
          tone="amber"
          detail="Awaiting confirmation"
        />
        <Stat
          label="Completion rate"
          value={`${o.completionPercentage ?? 0}%`}
          icon={Activity}
          tone="green"
          detail="Across eligible submissions"
        />
      </div>
      <div className="dashboard-grid">
        <Card className="wide chart-card">
          <div className="card-heading">
            <div>
              <h2>Submission activity</h2>
              <p>Confirmation progress by assignment.</p>
            </div>
            <span className="chart-legend">
              <i /> Completion
            </span>
          </div>
          {chart.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart
                data={chart}
                margin={{ top: 12, right: 5, left: -25, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#5b7cfa" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#5b7cfa" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#edf0f4" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#8b94a3" }}
                />
                <YAxis
                  domain={[0, 100]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#8b94a3" }}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip formatter={(v) => `${v}%`} />
                <Area
                  type="monotone"
                  dataKey="completion"
                  stroke="#5b7cfa"
                  fill="url(#fill)"
                  strokeWidth={2.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <Empty
              title="Your analytics will show here"
              text="Create an assignment to start tracking submission progress."
              icon={Activity}
            />
          )}
        </Card>
        <Card>
          <div className="card-heading">
            <div>
              <h2>Recent assignments</h2>
              <p>Recently created for your classes.</p>
            </div>
            <Link className="text-link" to="/professor/assignments">
              All <span>→</span>
            </Link>
          </div>
          {assignments.slice(0, 4).length ? (
            <div className="recent-list">
              {assignments.slice(0, 4).map((a) => (
                <Link
                  key={a.id}
                  to={`/professor/assignments/${a.id}`}
                  className="recent-row"
                >
                  <span className="file-icon">
                    <FileText size={16} />
                  </span>
                  <span>
                    <b>{a.title}</b>
                    <small>Due {date(a.dueDate)}</small>
                  </span>
                  <span className="recent-count">
                    {a._count?.confirmations || 0}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <Empty
              title="Nothing created yet"
              text="Your assignments will appear here."
            />
          )}
        </Card>
      </div>
      <div className="footer-note">
        Data updates from your assignment confirmations<span>·</span>
        <Link to="/professor/analytics">Explore analytics</Link>
      </div>
    </>
  );
}
