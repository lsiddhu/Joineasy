import { useEffect, useState } from "react";

import { ClipboardList } from "lucide-react";

import { errorMessage } from "../services/api";
import {
  getStudentAssignments,
  startSubmission,
  confirmSubmission,
} from "../services/assignmentService";

import {
  Button,
  Notice,
  Loader,
  PageTitle,
  Card,
  Empty,
  AssignmentCard,
} from "../components/Common";
import ConfirmModal from "../components/ConfirmModal";
import { useAuth } from "../context/AuthContext";

export default function StudentAssignments() {
  const { user } = useAuth();
  const [items, setItems] = useState([]),
    [loading, setLoading] = useState(true),
    [err, setErr] = useState(""),
    [busy, setBusy] = useState(null),
    [step, setStep] = useState(null),
    [filter, setFilter] = useState("all"),
    [submissionStates, setSubmissionStates] = useState(() => {
      try {
        return JSON.parse(
          localStorage.getItem(`joineazy:submissions:${user?.id}`) || "{}",
        );
      } catch {
        return {};
      }
    });
  const persistState = (id, value) =>
    setSubmissionStates((current) => {
      const next = { ...current, [id]: value };
      localStorage.setItem(
        `joineazy:submissions:${user?.id}`,
        JSON.stringify(next),
      );
      return next;
    });
  const load = async () => {
    try {
      const { data } = await getStudentAssignments();
      setItems(data.assignments || []);
      setErr("");
    } catch (e) {
      setErr(errorMessage(e));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);
  const start = async (a) => {
    setBusy(a.id);
    setErr("");
    try {
      await startSubmission(a.id);
      persistState(a.id, { status: "PENDING" });
      setStep(a);
      setBusy(null);
    } catch (e) {
      if (
        e.response?.status === 409 &&
        /already confirmed/i.test(e.response?.data?.message || "")
      ) {
        persistState(a.id, { status: "CONFIRMED" });
        setBusy(null);
        return;
      }
      setErr(errorMessage(e));
      setBusy(null);
    }
  };
  const confirm = async () => {
    setBusy(step.id);
    try {
      const { data } = await confirmSubmission(step.id);
      persistState(step.id, {
        status: "CONFIRMED",
        confirmedAt: data.confirmation?.confirmedAt || new Date().toISOString(),
      });
      setStep(null);
      await load();
    } catch (e) {
      setErr(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };
  const shown = items.filter(
    (a) =>
      filter === "all" ||
      (filter === "upcoming"
        ? new Date(a.dueDate) >= new Date()
        : new Date(a.dueDate) < new Date()),
  );
  if (loading) return <Loader />;
  return (
    <>
      <PageTitle
        eyebrow="YOUR WORK"
        title="Assignments"
        subtitle="Find the resources you need and confirm your submissions."
      />
      <Notice>{err}</Notice>
      <div className="filter-bar">
        <div className="tabs">
          <button
            className={filter === "all" ? "active" : ""}
            onClick={() => setFilter("all")}
          >
            All assignments <span>{items.length}</span>
          </button>
          <button
            className={filter === "upcoming" ? "active" : ""}
            onClick={() => setFilter("upcoming")}
          >
            Upcoming
          </button>
          <button
            className={filter === "past" ? "active" : ""}
            onClick={() => setFilter("past")}
          >
            Past due
          </button>
        </div>
      </div>
      {shown.length ? (
        <div className="student-assignment-grid">
          {shown.map((a) => (
            <AssignmentCard
              key={a.id}
              assignment={a}
              start={() => start(a)}
              busy={busy === a.id}
              status={submissionStates[a.id]?.status || "NOT_STARTED"}
              confirmedAt={submissionStates[a.id]?.confirmedAt}
            />
          ))}
        </div>
      ) : (
        <Card>
          <Empty
            title="No assignments here"
            text="Assignments will appear here when a professor assigns them to you."
            icon={ClipboardList}
          />
        </Card>
      )}
      <ConfirmModal
        assignment={step}
        busy={!!busy}
        onClose={() => setStep(null)}
        onConfirm={confirm}
      />
    </>
  );
}
