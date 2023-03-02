import axios from "axios";
import { Auth } from "aws-amplify";

const NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL;

// Default config options
const defaultOptions = {
  baseURL: NEXT_PUBLIC_APP_URL,
  withCredentials: false,
};

// Create instance
export const axiosInstance = axios.create(defaultOptions);

// Set the AUTH token for any request
axiosInstance.interceptors.request.use(async function (config) {
  // Get token from amplify
  const session = await Auth.currentSession();
  const token = session.getIdToken().getJwtToken();

  if (!config?.headers) {
    config.headers = {};
    config.headers = {
      Authorization: `Bearer ${token}`,
    };
  } else {
    config.headers.Authorization = token ? `Bearer ${token}` : "";
  }

  return config;
});
