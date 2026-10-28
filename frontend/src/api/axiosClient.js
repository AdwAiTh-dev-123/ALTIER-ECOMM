import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data;

    if (
      status === 403 &&
      (data?.isBlocked ||
        data?.message?.toLowerCase().includes("restricted") ||
        data?.message?.toLowerCase().includes("blocked"))
    ) {
      window.dispatchEvent(
        new CustomEvent("auth:user_blocked", {
          detail: {
            message:
              data?.message ||
              "Your account access has been restricted by an administrator.",
          },
        }),
      );
    }

    return Promise.reject(error);
  },
);

export default api;
