import * as SecureStore from "expo-secure-store";
import { API_BASE_URL } from "../config/api";

export async function apiFetch(
  path: string,
  options: RequestInit = {}
) {
  const token = await SecureStore.getItemAsync("accessToken");

  const headers = new Headers(options.headers);

  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  let data: any = null;

  try {
    data = await response.json();
  } catch {
    // No JSON response
  }

  if (!response.ok) {
    throw new Error(
      data?.message || `Request failed with status ${response.status}`
    );
  }

  return data;
}