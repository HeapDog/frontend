export interface SigninRequest {
  username: string;
  password: string;
}

export interface SigninResponse {
  token: string;
}

export interface SignupRequest {
  username: string;
  email: string;
  password: string;
}

export interface SignupResponse {
  id: number;
  username: string;
  email: string;
}

export interface VerifyEmailRequest {
  userId: number;
  otp: string;
}

export interface VerifyEmailResponse {
  message: string;
}
