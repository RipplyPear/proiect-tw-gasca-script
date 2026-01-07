import axios from "axios";

export const api = axios.create({
  // cu Vite proxy, e cel mai simplu:
  baseURL: "/api",
});
