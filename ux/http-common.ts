import axios from "axios";

export const gitdochost = "https://localhost:7089";

export default axios.create({
  baseURL: `${gitdochost}/api/`,
  headers: {
    "Content-type": "application/json"
  }
});