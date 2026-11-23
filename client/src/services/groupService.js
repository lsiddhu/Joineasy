import api from "./api";
export const getMyGroup = () => api.get("/groups/my-group");
export const createGroup = (name) => api.post("/groups/", { name });
export const joinGroup = (inviteCode) =>
  api.post("/groups/join", { inviteCode });
export const addGroupMember = (payload) =>
  api.post("/groups/add-member", payload);
