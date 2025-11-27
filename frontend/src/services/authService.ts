import { apiClient } from "./apiClient";
import type { AuthUser } from "../types/auth";

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

export async function register(
  email: string,
  password: string,
  displayName?: string
): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>("/auth/register", {
    email,
    password,
    displayName,
  });
  return response.data;
}

export async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>("/auth/login", {
    email,
    password,
  });
  return response.data;
}

export async function fetchMe(): Promise<{ user: AuthUser }> {
  const response = await apiClient.get<{ user: AuthUser }>("/auth/me");
  return response.data;
}
