
import { useEffect, useState } from "react";

import { Activity, CheckCircle2, ClipboardList, FileText } from "lucide-react";
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
import { getProfessorAnalytics } from "../services/assignmentService";
import Stat from "../components/StatCard";

import { Notice, Loader, PageTitle, Card, Empty } from "../components/Common";

export default function ProfessorAnalytics() {
  const [data, setData] = useState(null),
    [loading, setLoading] = useState(true),
    [err, setErr] = useState("");

  useEffect(() => {
    getProfessorAnalytics()
      .then((r) => setData(r.data))
      .catch((e) => setErr(errorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  const o = data?.overview || {},
    rows = data?.assignmentAnalytics || [];

  return (
    <>
      <PageTitle
        eyebrow="INSIGHTS"
        title="Analytics"
        subtitle="Understand submission activity across your classes."
      />

      <Notice>{err}</Notice>

      <div className="stats-grid four">
        <Stat
          label="Total assignments"
          value={o.totalAssignments || 0}
          icon={ClipboardList}
          tone="blue"
          detail="Created assignments"
        />

        <Stat
          label="Eligible submissions"
          value={o.totalEligibleSubmissions || 0}
          icon={FileText}
          tone="violet"
          detail="Across all assignments"
        />

        <Stat
          label="Confirmed"
          value={o.totalConfirmed || 0}
          icon={CheckCircle2}
          tone="green"
          detail="Submissions confirmed"
        />

        <Stat
          label="Completion rate"
          value={`${o.completionPercentage || 0}%`}
          icon={Activity}
          tone="amber"
          detail={`${o.totalPending || 0} still pending`}
        />
      </div>

      <div className="dashboard-grid">
        <Card className="wide chart-card">
          <div className="card-heading">
            <div>
              <h2>Completion by assignment</h2>
              <p>Confirmed student submissions.</p>
            </div>

            <span className="chart-legend">
              <i /> Completion
            </span>
          </div>

          {rows.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart
                data={rows.map((a) => ({
                  name: a.title,
                  completion: a.completionPercentage,
                }))}
                margin={{ top: 12, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="fill2" x1="0" y1="0" x2="0" y2="1">
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
                  fill="url(#fill2)"
                  strokeWidth={2.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <Empty
              title="No analytics yet"
              text="Create assignments to see student progress here."
              icon={Activity}
            />
          )}
        </Card>

        <Card>
          <div className="card-heading">
            <div>
              <h2>At a glance</h2>
              <p>Overall submissions.</p>
            </div>
          </div>

          <div className="big-rate">
            {o.completionPercentage || 0}
            <small>%</small>
          </div>

          <div className="progress-track large">
            <i style={{ width: `${o.completionPercentage || 0}%` }} />
          </div>

          <div className="rate-caption">
            <span>{o.totalConfirmed || 0} confirmed</span>
            <span>{o.totalPending || 0} pending</span>
          </div>

          <div className="analytics-note">
            <CheckCircle2 size={16} />
            <span>
              Based on {o.totalEligibleSubmissions || 0} eligible submissions
            </span>
          </div>
        </Card>
      </div>

      {/* Assignment Breakdown */}
      <Card className="assignment-table-card analytics-table">
        <div className="table-toolbar">
          <div>
            <h2>Assignment breakdown</h2>
            <p>Detailed completion status for each assignment.</p>
          </div>
        </div>

        {rows.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ASSIGNMENT</th>
                  <th>STUDENTS</th>
                  <th>CONFIRMED</th>
                  <th>PENDING</th>
                  <th>COMPLETION</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((a) => (
                  <tr key={a.assignmentId}>
                    <td>
                      <b>{a.title}</b>
                    </td>
                    <td>{a.totalStudents}</td>
                    <td>{a.confirmed}</td>
                    <td>{a.pending}</td>
                    <td>
                      <div className="completion-cell">
                        <div className="progress-track">
                          <i style={{ width: `${a.completionPercentage}%` }} />
                        </div>
                        <b>{a.completionPercentage}%</b>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="No assignments to report"
            text="Your assignment analytics will appear here once you create coursework."
          />
        )}
      </Card>

      {/* Individual Student Submission Details */}
      <Card className="assignment-table-card">
        <div className="table-toolbar">
          <div>
            <h2>Student Submission Details</h2>
            <p>
              Individual confirmation status for every assignment.
            </p>
          </div>
        </div>

        {rows.length ? (
          <div className="space-y-6">
            {rows.map((assignment) => (
              <div key={assignment.assignmentId}>
                <h3 className="mb-3 font-semibold">
                  {assignment.title}
                </h3>

                {assignment.studentSubmissions?.length ? (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>STUDENT</th>
                          <th>STUDENT ID</th>
                          <th>STATUS</th>
                          <th>CONFIRMED AT</th>
                        </tr>
                      </thead>

                      <tbody>
                        {assignment.studentSubmissions.map((student) => (
                          <tr key={student.id}>
                            <td>
                              <b>{student.name}</b>
                              <br />
                              <small>{student.email}</small>
                            </td>

                            <td>{student.studentId || "—"}</td>

                            <td>
                              <span
                                style={{
                                  color:
                                    student.status === "SUBMITTED"
                                      ? "#15803d"
                                      : "#b45309",
                                  fontWeight: 600,
                                }}
                              >
                                {student.status === "SUBMITTED"
                                  ? "Submitted"
                                  : "Pending"}
                              </span>
                            </td>

                            <td>
                              {student.confirmedAt
                                ? new Date(
                                    student.confirmedAt
                                  ).toLocaleString()
                                : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <Empty
                    title="No eligible students"
                    text="No students are currently eligible for this assignment."
                  />
                )}
              </div>
            ))}
          </div>
        ) : (
          <Empty
            title="No submission records"
            text="Create assignments to see individual student submission details."
          />
        )}
      </Card>
    </>
  );
}
