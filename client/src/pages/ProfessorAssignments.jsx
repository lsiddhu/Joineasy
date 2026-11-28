import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ClipboardList, FileText, Plus, Search, Settings } from "lucide-react";

import { errorMessage } from "../services/api";
import {
  getProfessorAssignments,
  createAssignment,
  updateAssignment,
} from "../services/assignmentService";
import { getCourses } from "../services/courseService";
import { getAllGroups } from "../services/groupService";

import {
  date,
  Button,
  Notice,
  Loader,
  PageTitle,
  Card,
  Empty,
} from "../components/Common";
import CreateAssignment from "./CreateAssignment";

export default function ProfessorAssignments() {
  const [items, setItems] = useState([]),
    [groups, setGroups] = useState([]),
    [courses, setCourses] = useState([]),
    [loading, setLoading] = useState(true),
    [err, setErr] = useState(""),
    [toast, setToast] = useState(""),
    [editing, setEditing] = useState(null),
    [query, setQuery] = useState("");
  const location = useLocation(),
    navigate = useNavigate();
  const empty = {
    title: "",
    description: "",
    oneDriveUrl: "",
    dueDate: "",
    assignToAll: true,
    groupIds: [],
    courseId: "",
    submissionType: "INDIVIDUAL",
  };
  const [form, setForm] = useState(empty),
    [busy, setBusy] = useState(false);
  const load = async () => {
    const [assignmentResponse, courseResponse, groupResponse] =
      await Promise.all([
        getProfessorAssignments(),
        getCourses(),
        getAllGroups(),
      ]);
    const assignments = assignmentResponse.data.assignments || [];
    setItems(assignments);
    setCourses(courseResponse.data.courses || []);
    setGroups(groupResponse.data.groups || []);
  };
  useEffect(() => {
    (async () => {
      try {
        await load();
      } catch (e) {
        setErr(errorMessage(e));
      } finally {
        setLoading(false);
      }
    })();
    if (new URLSearchParams(location.search).has("new")) {
      setEditing("new");
      navigate(location.pathname, { replace: true });
    }
  }, []);
  const beginEdit = (a) => {
    setForm({
      title: a.title,
      description: a.description,
      oneDriveUrl: a.oneDriveUrl,
      dueDate: new Date(a.dueDate).toISOString().slice(0, 16),
      assignToAll: a.assignToAll,
      groupIds: a.groups?.map((g) => g.groupId) || [],
      courseId: a.courseId ? String(a.courseId) : "",
      submissionType: a.submissionType || "INDIVIDUAL",
    });
    setEditing(a);
  };
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const payload = {
      ...form,
      dueDate: new Date(form.dueDate).toISOString(),
      groupIds: form.assignToAll ? [] : form.groupIds,
      courseId: form.courseId ? Number(form.courseId) : null,
    };
    try {
      if (editing === "new") await createAssignment(payload);
      else await updateAssignment(editing.id, payload);
      setToast(
        editing === "new"
          ? "Assignment created successfully."
          : "Assignment updated successfully.",
      );
      setEditing(null);
      setForm(empty);
      await load();
    } catch (x) {
      setErr(errorMessage(x));
    } finally {
      setBusy(false);
    }
  };
  const courseFilter = new URLSearchParams(location.search).get("courseId");
  const filtered = items.filter(
    (assignment) =>
      assignment.title.toLowerCase().includes(query.toLowerCase()) &&
      (!courseFilter || String(assignment.courseId) === courseFilter),
  );
  if (loading) return <Loader />;
  return (
    <>
      <PageTitle
        eyebrow="COURSEWORK"
        title="Assignments"
        subtitle="Create assignments and see how your students are progressing."
        action={
          courses.length ? (
            <Button
              onClick={() => {
                setForm(empty);
                setEditing("new");
              }}
            >
              <Plus size={16} /> New assignment
            </Button>
          ) : (
            <Link className="button primary" to="/professor/courses">
              <Plus size={16} /> Create a course first
            </Link>
          )
        }
      />
      {courseFilter && (
        <div className="course-filter-note">
          Showing assignments for{" "}
          {courses.find((course) => String(course.id) === courseFilter)?.name ||
            "the selected course"}
          .<Link to="/professor/assignments"> Clear course filter</Link>
        </div>
      )}
      <Notice>{err}</Notice>
      <Notice type="success">{toast}</Notice>
      <Card className="assignment-table-card">
        <div className="table-toolbar">
          <div>
            <h2>
              All assignments <span className="count-chip">{items.length}</span>
            </h2>
            <p>Manage resources and submission progress.</p>
          </div>
          <label className="search-box">
            <Search size={16} />
            <input
              placeholder="Search assignments"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        </div>
        {filtered.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ASSIGNMENT</th>
                  <th>COURSE</th>
                  <th>TYPE</th>
                  <th>ASSIGNED TO</th>
                  <th>DUE DATE</th>
                  <th>ACKNOWLEDGED</th>
                  <th>STATUS</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <div className="table-title">
                        <span className="file-icon">
                          <FileText size={16} />
                        </span>
                        <div>
                          <b>{a.title}</b>
                          <small>{a.description}</small>
                        </div>
                      </div>
                    </td>
                    <td>{a.course?.name || "Unlinked"}</td>
                    <td>
                      <span
                        className={`pill ${a.submissionType === "GROUP" ? "violet" : "blue"}`}
                      >
                        {a.submissionType === "GROUP" ? "Group" : "Individual"}
                      </span>
                    </td>
                    <td>
                      {a.assignToAll ? (
                        <span className="pill blue">All students</span>
                      ) : (
                        <span className="table-groups">
                          {a.groups
                            ?.map((x) => x.group?.name)
                            .filter(Boolean)
                            .join(", ") || "Selected groups"}
                        </span>
                      )}
                    </td>
                    <td>{date(a.dueDate)}</td>
                    <td>
                      {a.submissionType === "GROUP"
                        ? `${a.groupSubmissions?.length || 0} groups`
                        : `${a.confirmations?.length || 0} students`}
                    </td>
                    <td>
                      <span
                        className={`pill ${new Date(a.dueDate) < new Date() ? "overdue" : "green"}`}
                      >
                        {new Date(a.dueDate) < new Date()
                          ? "Past due"
                          : "Active"}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <Link
                          className="quiet-button"
                          to={`/professor/assignments/${a.id}`}
                        >
                          View progress
                        </Link>
                        <button
                          className="icon-button"
                          title="Edit assignment"
                          onClick={() => beginEdit(a)}
                        >
                          <Settings size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            icon={ClipboardList}
            title={query ? "No matching assignments" : "No assignments yet"}
            text={
              query
                ? "Try another search."
                : "Create your first assignment to share resources with students."
            }
            action={
              !query && (
                <Button onClick={() => setEditing("new")}>
                  <Plus size={16} /> Create assignment
                </Button>
              )
            }
          />
        )}
      </Card>
      {editing && (
        <CreateAssignment
          editing={editing}
          form={form}
          setForm={setForm}
          groups={groups}
          courses={courses}
          busy={busy}
          onClose={() => setEditing(null)}
          onSubmit={submit}
        />
      )}
    </>
  );
}
