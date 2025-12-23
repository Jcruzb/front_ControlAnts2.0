import axios from 'axios';

const api = axios.create({
  baseURL: "http://localhost:8000/api/",
  withCredentials: true, // 🔴 imprescindible
  xsrfCookieName: "csrftoken", // 🔴 nombre de la cookie
  xsrfHeaderName: "X-CSRFToken", // 🔴 header que Django espera
});


api.interceptors.response.use(
  response => response.data,
  error => {
    if (error.response) {
      console.error('API error:', error.response.status, error.response.data);
    } else {
      console.error('Network error:', error.message);
    }
    return Promise.reject(error);
  }
);



export const initCSRF = async () => {
  await api.get("/csrf/");
};

function getCSRFToken() {
  const name = "csrftoken=";
  const decodedCookie = decodeURIComponent(document.cookie);
  const cookies = decodedCookie.split(';');

  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.startsWith(name)) {
      return cookie.substring(name.length);
    }
  }
  return null;
}

api.interceptors.request.use(config => {
  const csrfToken = getCSRFToken();
  if (csrfToken) {
    config.headers["X-CSRFToken"] = csrfToken;
  }
  return config;
});

export default api;
