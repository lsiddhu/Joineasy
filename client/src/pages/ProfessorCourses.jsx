import { useEffect, useState } from "react";
import { Plus } from "lucide-react";

import { errorMessage } from "../services/api";
import { createCourse, getCourses } from "../services/courseService";
import CourseCard from "../components/CourseCard";
import {
  Button,
  Card,
  Empty,
  Field,
  Loader,
  Notice,
  PageTitle,
} from "../components/Common";

export default function ProfessorCourses() {
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({ name: "", description: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadCourses = async () => {
    const { data } = await getCourses();
    setCourses(data.courses || []);
  };

  useEffect(() => {
    loadCourses()
      .catch((requestError) => setError(errorMessage(requestError)))
      .finally(() => setLoading(false));
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const { data } = await createCourse(form);
      setSuccess(
        `Course created. Share code ${data.course.code} with students.`,
      );
      setForm({ name: "", description: "" });
      await loadCourses();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <>
      <PageTitle
        eyebrow="COURSE MANAGEMENT"
        title="Your courses"
        subtitle="Create courses and give students a code to enroll."
      />
      <Notice>{error}</Notice>
      <Notice type="success">{success}</Notice>
      <Card className="course-create-card">
        <div className="card-heading">
          <div>
            <h2>Create a course</h2>
            <p>Students can enroll with the code generated for your course.</p>
          </div>
          <span className="course-card-icon">
            <Plus size={18} />
          </span>
        </div>
        <form className="course-create-form" onSubmit={submit}>
          <Field label="Course name">
            <input
              required
              maxLength={100}
              placeholder="e.g. Introduction to Design"
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
            />
          </Field>
          <Field label="Description (optional)">
            <input
              maxLength={500}
              placeholder="A short course description"
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
            />
          </Field>
          <Button disabled={saving}>
            {saving ? "Creating..." : "Create course"}
          </Button>
        </form>
      </Card>

      <section className="courses-section">
        <div className="section-heading">
          <div>
            <div className="eyebrow">TEACHING</div>
            <h2>Courses you teach</h2>
          </div>
          <span className="count-chip">{courses.length}</span>
        </div>
        {courses.length ? (
          <div className="course-grid">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} role="PROFESSOR" />
            ))}
          </div>
        ) : (
          <Card>
            <Empty
              title="No courses yet"
              text="Create a course to organize your assignments and enrollments."
            />
          </Card>
        )}
      </section>
    </>
  );
}
