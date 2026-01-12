// Configurare Axios pentru comunicarea cu API-ul
import axios from "axios";

// Cream instanta axios cu baseURL pe /api
// Vite proxy redirecteaza cererile catre serverul Express
export const api = axios.create({
  baseURL: "/api",
});
