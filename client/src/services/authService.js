import api from "./api";
export const registerStudent = (payload) => api.post("/auth/register", payload);
export const loginStudent = (payload) => api.post("/auth/login", payload);
export const loginProfessor = (payload) =>
  api.post("/auth/professor/login", payload);
