import axios from "axios";

const api = axios.create({
  baseURL: "https://fut-tv-api.onrender.com"
});

export default api;