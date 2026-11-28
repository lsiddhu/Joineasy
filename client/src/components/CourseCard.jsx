import { ArrowUpRight, BookOpen, Users } from "lucide-react";
import { Link } from "react-router-dom";

export default function CourseCard({ course, role }) {
  const isProfessor = role === "PROFESSOR";
  const href = isProfessor
    ? `/professor/assignments?courseId=${course.id}`
    : `/student/assignments?courseId=${course.id}`;
  const analytics = course.analytics;

  return (
    <Link className="course-card card" to={href}>
      <div className="course-card-top">
        <span className="course-card-icon">
          <BookOpen size={19} />
        </span>
        <span className="course-code">{course.code}</span>
      </div>
      <h3>{course.name}</h3>
      {course.description && <p>{course.description}</p>}
      <div className="course-card-meta">
        {isProfessor ? (
          <>
            <span>
              <Users size={14} />{" "}
              {analytics?.studentCount ?? course._count?.students ?? 0} students
            </span>
            <span>
              <BookOpen size={14} />{" "}
              {analytics?.assignmentCount ?? course._count?.assignments ?? 0}{" "}
              assignments
            </span>
          </>
        ) : (
          <>
            <span>Instructor: {course.professor?.name || "Professor"}</span>
            <span>{course._count?.assignments ?? 0} assignments</span>
          </>
        )}
      </div>
      {isProfessor && analytics && (
        <div className="course-completion">
          <div className="course-completion-label">
            <span>Submission completion</span>
            <b>{analytics.completionPercentage}%</b>
          </div>
          <div className="progress-track">
            <i style={{ width: `${analytics.completionPercentage}%` }} />
          </div>
          <small>
            {analytics.confirmed} confirmed · {analytics.pending} pending
          </small>
        </div>
      )}
      <div className="course-card-link">
        Open assignments <ArrowUpRight size={15} />
      </div>
    </Link>
  );
}
