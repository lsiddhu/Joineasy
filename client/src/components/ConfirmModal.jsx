import { CheckCircle2, ExternalLink } from "lucide-react";
import { Button, Modal } from "./Common";

export default function ConfirmModal({ assignment, busy, onClose, onConfirm }) {
  if (!assignment) return null;
  return (
    <Modal title="Confirm your submission" close={onClose}>
      <div className="confirm-content">
        <span className="confirm-icon">
          <CheckCircle2 size={25} />
        </span>
        <h3>Have you uploaded “{assignment.title}”?</h3>
        <p>
          Open the OneDrive folder to submit your work. When your upload is
          complete, confirm it so your professor can record your submission.
        </p>
        <a
          href={assignment.oneDriveUrl}
          className="button secondary full"
          target="_blank"
          rel="noreferrer"
        >
          Open OneDrive <ExternalLink size={16} />
        </a>
        <div className="modal-actions">
          <Button variant="secondary" onClick={onClose}>
            Not yet
          </Button>
          <Button disabled={busy} onClick={onConfirm}>
            {busy ? "Confirming…" : "Confirm Submission"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
