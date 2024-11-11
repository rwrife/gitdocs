import axios from "axios";

export default axios.create({
  baseURL: "https://localhost:7089/",
  headers: {
    "Content-type": "application/json"
  }
});