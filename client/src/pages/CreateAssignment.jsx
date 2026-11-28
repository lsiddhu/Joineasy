import { Button, Field, Modal } from "../components/Common";

export default function CreateAssignment({
  editing,
  form,
  setForm,
  groups,
  courses,
  busy,
  onClose,
  onSubmit,
}) {
  return (
    <Modal
      title={editing === "new" ? "Create assignment" : "Edit assignment"}
      close={onClose}
    >
      <form className="form modal-form" onSubmit={onSubmit}>
        <Field label="Course">
          <select
            required={editing === "new"}
            value={form.courseId}
            onChange={(event) =>
              setForm({ ...form, courseId: event.target.value })
            }
          >
            <option value="">
              {editing === "new"
                ? "Choose a course"
                : "Unlinked legacy assignment"}
            </option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>
          {!courses.length && editing === "new" && (
            <small>Create a course before creating an assignment.</small>
          )}
        </Field>
        <Field label="Assignment title">
          <input
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Research project"
          />
        </Field>
        <Field label="Description">
          <textarea
            required
            rows="3"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Share the assignment details"
          />
        </Field>
        <Field label="OneDrive link">
          <input
            type="url"
            required
            value={form.oneDriveUrl}
            onChange={(e) => setForm({ ...form, oneDriveUrl: e.target.value })}
            placeholder="https://1drv.ms/..."
          />
          <small>Use a OneDrive or SharePoint sharing link.</small>
        </Field>
        <Field label="Due date">
          <input
            type="datetime-local"
            required
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
          />
        </Field>
        <Field label="Assign to">
          <div className="radio-stack">
            <label>
              <input
                type="radio"
                checked={form.assignToAll}
                onChange={() => setForm({ ...form, assignToAll: true })}
              />{" "}
              All students
            </label>
            <label>
              <input
                type="radio"
                checked={!form.assignToAll}
                onChange={() => setForm({ ...form, assignToAll: false })}
              />{" "}
              Selected groups
            </label>
          </div>
        </Field>
        <Field label="Submission type">
          <div className="radio-stack">
            <label>
              <input
                type="radio"
                name="submissionType"
                checked={form.submissionType === "INDIVIDUAL"}
                onChange={() =>
                  setForm({ ...form, submissionType: "INDIVIDUAL" })
                }
              />
              Individual
            </label>
            <label>
              <input
                type="radio"
                name="submissionType"
                checked={form.submissionType === "GROUP"}
                onChange={() => setForm({ ...form, submissionType: "GROUP" })}
              />
              Group submission
            </label>
          </div>
          <small>
            Group submissions can be acknowledged by the group leader.
          </small>
        </Field>
        {!form.assignToAll && (
          <div className="group-select">
            {groups.length ? (
              groups.map((group) => (
                <label key={group.id}>
                  <input
                    type="checkbox"
                    checked={form.groupIds.includes(group.id)}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        groupIds: e.target.checked
                          ? [...form.groupIds, group.id]
                          : form.groupIds.filter((id) => id !== group.id),
                      })
                    }
                  />
                  {group.name}
                  <small>
                    {group._count?.members ?? group.members?.length ?? ""}{" "}
                    students
                  </small>
                </label>
              ))
            ) : (
              <p>No groups are available from the group API.</p>
            )}
          </div>
        )}
        <div className="modal-actions">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={busy}>
            {busy
              ? "Saving…"
              : editing === "new"
                ? "Create assignment"
                : "Save changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
