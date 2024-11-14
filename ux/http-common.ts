import axios from "axios";

export const gitdochost = "https://localhost:7089/api";

export default axios.create({
  baseURL: gitdochost,
  headers: {
    "Content-type": "application/json"
  }
});