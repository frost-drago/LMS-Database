import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:4000/api'
});

// tiny helper to unwrap errors → message
export function getErrorMessage(err) {
  if (err?.response?.data?.error) return err.response.data.error;
  if (err?.response?.data?.message) return err.response.data.message;
  return err.message || 'Request failed';
}
