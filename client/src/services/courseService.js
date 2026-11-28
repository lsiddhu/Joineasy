import api from "./api";

export const getCourses = () => api.get("/courses");

export const getCourse = (courseId) => api.get(`/courses/${courseId}`);

export const createCourse = (payload) => api.post("/courses", payload);

export const enrollInCourse = (code) => api.post("/courses/enroll", { code });
