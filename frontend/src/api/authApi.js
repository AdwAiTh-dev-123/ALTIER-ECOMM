import api from "./axiosClient";

export function register({ email, password, name, otp }) {
  return api.post("/auth/register", { email, password, name, otp });
}

export function sendOtp({ email }) {
  return api.post("/auth/send-otp", { email });
}

export function login({ email, password }) {
  return api.post("/auth/login", { email, password });
}

export function getProfile() {
  return api.get("/auth/me");
}

export function logout() {
  return api.post("/auth/logout");
}

export function googleLogin({ idToken }) {
  return api.post("/auth/google", { idToken });
}

export function forgotPassword({ email }) {
  return api.post("/auth/forgot-password", { email });
}

export function resetPassword({ token, password }) {
  return api.post("/auth/reset-password", { token, password });
}

export function changePasswordApi({
  currentPassword,
  newPassword,
  confirmPassword,
}) {
  return api.put("/auth/change-password", {
    currentPassword,
    newPassword,
    confirmPassword,
  });
}

export function updateAvatarApi(formData) {
  return api.patch("/auth/avatar", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}

export function sendChangeEmailOtpApi({ newEmail }) {
  return api.post("/auth/send-change-email-otp", { newEmail });
}

export function changeEmailApi({ newEmail, otp }) {
  return api.put("/auth/change-email", { newEmail, otp });
}
