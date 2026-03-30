export interface User {
  id: string;
  email: string;
  username: string;
  createdAt: string;
  avatarUrl?: string | null;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignupPayload {
  email: string;
  username: string;
  password: string;
}

