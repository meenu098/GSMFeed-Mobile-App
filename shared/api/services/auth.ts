import { api } from "../client";

export type LoginResponse = {
  status: boolean;
  data: any;
  message?: string;
};

export const login = (email: string, password: string, remember: boolean) =>
  api.post<LoginResponse>(
    "/api/auth/login",
    { email, password, remember },
    { auth: false },
  );
