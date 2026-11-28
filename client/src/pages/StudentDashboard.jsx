import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ClipboardList,
  ExternalLink,
  FileText,
  ShieldCheck,
  Users,
} from "lucide-react";

import { errorMessage } from "../services/api";
import { getMyGroup } from "../services/groupService";
import {
  getStudentAssignments,
  getGroupProgress,
} from "../services/assignmentService";

import { useAuth } from "../context/AuthContext";
import Stat from "../components/StatCard";
import ProgressBar from "../components/ProgressBar";
import CourseCard from "../components/CourseCard";
import { enrollInCourse, getCourses } from "../services/courseService";
import {
  date,
  greeting,
  Notice,
  Loader,
  PageTitle,
  Card,
  Empty,
} from "../components/Common";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState({
      group: null,
      assignments: [],
      progress: null,
    }),
    [loading, setLoading] = useState(true),
    [err, setErr] = useState("");
  const [courses, setCourses] = useState([]);
  const [courseCode, setCourseCode] = useState("");
  const [courseFeedback, setCourseFeedback] = useState("");
  const [courseFeedbackType, setCourseFeedbackType] = useState("success");
  const [enrolling, setEnrolling] = useState(false);
  const load = async () => {
    setLoading(true);
    setErr("");
    const [g, a, p, c] = await Promise.allSettled([
      getMyGroup(),
      getStudentAssignments(),
      getGroupProgress(),
      getCourses(),
    ]);
    const group = g.status === "fulfilled" ? g.value.data.group : null;
    const progress = p.status === "fulfilled" ? p.value.data : null;
    if (a.status === "rejected") setErr(errorMessage(a.reason));
    setData({
      group,
      assignments:
        a.status === "fulfilled" ? a.value.data.assignments || [] : [],
      progress,
    });
    if (c.status === "fulfilled") {
      setCourses(c.value.data.courses || []);
    } else if (a.status === "fulfilled") {
      setErr(errorMessage(c.reason));
    }
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);
  const upcoming = data.assignments.slice(0, 3);
  const completed = data.assignments.filter(
    (assignment) => assignment.submissionStatus === "CONFIRMED",
  ).length;
  const pending = data.assignments.length - completed;
  const enroll = async (event) => {
    event.preventDefault();
    setEnrolling(true);
    setCourseFeedback("");
    try {
      const { data: response } = await enrollInCourse(courseCode);
      setCourseFeedback(response.message);
      setCourseFeedbackType("success");
      setCourseCode("");
      const { data: courseResponse } = await getCourses();
      setCourses(courseResponse.courses || []);
    } catch (error) {
      setCourseFeedback(errorMessage(error));
      setCourseFeedbackType("error");
    } finally {
      setEnrolling(false);
    }
  };
  if (loading) return <Loader />;
  return (
    <>
      <PageTitle
        eyebrow="STUDENT WORKSPACE"
        title={`${greeting()}, ${(user?.name || "there").split(" ")[0]}.`}
        subtitle="Here's what's happening with your coursework."
      />
      <Notice>{err}</Notice>
      <div className="stats-grid">
        <Stat
          label="Total assignments"
          value={data.assignments.length}
          icon={ClipboardList}
          tone="blue"
          detail="Assigned to you"
        />
        <Stat
          label="Completed submissions"
          value={completed}
          icon={FileText}
          tone="green"
          detail="Confirmed for your account"
        />
        <Stat
          label="Pending submissions"
          value={pending}
          icon={ClipboardList}
          tone="amber"
          detail="Awaiting confirmation"
        />
        <Stat
          label="Group progress"
          value={data.progress ? `${data.progress.progressPercentage}%` : "—"}
          icon={Users}
          tone="green"
          detail={data.group?.name || "No group yet"}
        />
      </div>
      <section className="courses-section">
        <div className="section-heading">
          <div>
            <div className="eyebrow">YOUR LEARNING</div>
            <h2>Enrolled courses</h2>
            <p>Open a course to view its assignments.</p>
          </div>
          <form className="course-enroll-form" onSubmit={enroll}>
            <input
              aria-label="Course enrollment code"
              placeholder="Enter course code"
              value={courseCode}
              onChange={(event) => setCourseCode(event.target.value)}
              required
            />
            <button className="button secondary" disabled={enrolling}>
              {enrolling ? "Joining..." : "Join course"}
            </button>
          </form>
        </div>
        {courseFeedback && (
          <Notice type={courseFeedbackType}>{courseFeedback}</Notice>
        )}
        {courses.length ? (
          <div className="course-grid">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} role="STUDENT" />
            ))}
          </div>
        ) : (
          <Card>
            <Empty
              title="No enrolled courses yet"
              text="Ask your professor for a course code, then enter it above to enroll."
              icon={ClipboardList}
            />
          </Card>
        )}
      </section>
      <div className="dashboard-grid">
        <Card className="wide">
          <div className="card-heading">
            <div>
              <h2>Upcoming assignments</h2>
              <p>Stay on top of what’s due next.</p>
            </div>
            <Link className="text-link" to="/student/assignments">
              View all <span>→</span>
            </Link>
          </div>
          {upcoming.length ? (
            <div className="assignment-list">
              {upcoming.map((a) => (
                <div className="assignment-row" key={a.id}>
                  <div className="file-icon">
                    <FileText size={19} />
                  </div>
                  <div className="assignment-info">
                    <b>{a.title}</b>
                    <small>
                      {a.assignToAll
                        ? "All students"
                        : a.groups
                            ?.map((x) => x.group?.name)
                            .filter(Boolean)
                            .join(", ") || "Your group"}
                    </small>
                  </div>
                  <span
                    className={`pill ${new Date(a.dueDate) < new Date() ? "overdue" : "blue"}`}
                  >
                    {new Date(a.dueDate) < new Date()
                      ? "Past due"
                      : `Due ${date(a.dueDate)}`}
                  </span>
                  <a
                    className="circle-link"
                    href={a.oneDriveUrl}
                    target="_blank"
                    rel="noreferrer"
                    title="Open OneDrive link"
                  >
                    <ExternalLink size={16} />
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <Empty
              title="You’re all caught up"
              text="New assignments will show up here when they’re assigned."
            />
          )}
        </Card>
        <Card>
          <div className="card-heading">
            <div>
              <h2>Your group</h2>
              <p>Work is better together.</p>
            </div>
            <Users size={18} className="subtle-icon" />
          </div>
          {data.group ? (
            <>
              <div className="group-overview">
                <div className="group-badge">
                  <Users size={22} />
                </div>
                <div>
                  <h3>{data.group.name}</h3>
                  <small>
                    {data.group.totalMembers || data.group.members?.length || 0}{" "}
                    of 4 members
                  </small>
                </div>
              </div>
              <ProgressBar
                label="Submission progress"
                value={data.progress?.progressPercentage ?? 0}
              />
              <div className="card-foot-link">
                <Link to="/student/group">
                  View group details <span>→</span>
                </Link>
              </div>
            </>
          ) : (
            <div className="mini-empty">
              <p>You haven’t joined a group yet.</p>
              <Link className="button primary" to="/student/group">
                Set up your group <span>→</span>
              </Link>
            </div>
          )}
        </Card>
      </div>
      <div className="bottom-grid">
        <Card className="tip-card">
          <div className="tip-icon">
            <ShieldCheck size={18} />
          </div>
          <div>
            <b>Keep your team in sync</b>
            <p>
              Confirm your submission after uploading so your professor can
              track your progress.
            </p>
          </div>
        </Card>
        <div className="footer-note">
          You’re signed in as <b>{user?.email}</b>
          <span>·</span> <Link to="/student/assignments">View assignments</Link>
        </div>
      </div>
    </>
  );
}
