// Gestionare autentificare - login, logout, sesiune curenta
import { api } from "./api";

// Cheia din localStorage unde tinem userul logat
const KEY = "currentUser";

// Returneaza userul curent sau null daca nu e logat
export function getCurrentUser() {
  const raw = localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : null;
}

// Salveaza userul in localStorage dupa login
export function setCurrentUser(user) {
  localStorage.setItem(KEY, JSON.stringify(user));
}

// Sterge userul din localStorage (logout)
export function logout() {
  localStorage.removeItem(KEY);
}

// Login prin email: cautam userul in baza de date si il salvam local
export async function loginByEmail(email) {
  const { data } = await api.get("/users");

  // Backend-ul poate returna 204 (gol) daca nu sunt useri
  const users = Array.isArray(data) ? data : [];
  const user = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

  if (!user) {
    throw new Error("Nu există utilizator cu email-ul acesta.");
  }

  setCurrentUser(user);
  return user;
}

// Inregistrare: cream userul apoi facem login automat
export async function registerUser({ name, email, role }) {
  await api.post("/users", { name, email, role });
  // Dupa creare facem login ca sa avem si ID-ul
  return loginByEmail(email);
}
