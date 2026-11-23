import api from "./api";
export const getProfessorAssignments = () => api.get("/assignments/");
export const getStudentAssignments = () => api.get("/assignments/student");
export const getGroupProgress = () =>
  api.get("/assignments/student/group-progress");
export const createAssignment = (payload) => api.post("/assignments/", payload);
export const updateAssignment = (id, payload) =>
  api.put(`/assignments/${id}`, payload);
export const startSubmission = (id) =>
  api.post(`/assignments/${id}/submission/start`);
export const confirmSubmission = (id) =>
  api.post(`/assignments/${id}/submission/confirm`);
export const getSubmissionStatus = (id) =>
  api.get(`/assignments/${id}/submission-status`);
export const getProfessorAnalytics = () =>
  api.get("/assignments/professor/analytics");
