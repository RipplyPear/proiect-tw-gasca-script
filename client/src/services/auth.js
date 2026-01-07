import { api } from "./api";

const KEY = "currentUser";

export function getCurrentUser() {
  const raw = localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : null;
}

export function setCurrentUser(user) {
  localStorage.setItem(KEY, JSON.stringify(user));
}

export function logout() {
  localStorage.removeItem(KEY);
}

export async function loginByEmail(email) {
  const { data } = await api.get("/users");

  // backend poate întoarce 204 (No Content); axios va da data = "" / undefined.
  const users = Array.isArray(data) ? data : [];
  const user = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

  if (!user) {
    throw new Error("Nu există utilizator cu email-ul acesta.");
  }

  setCurrentUser(user);
  return user;
}

export async function registerUser({ name, email, role }) {
  await api.post("/users", { name, email, role });
  // după creare, se reface login ca sa se preia si id-ul (fiindcă POST-ul dă 201 fără body)
  return loginByEmail(email);
}
