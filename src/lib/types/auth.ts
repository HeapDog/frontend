export interface SigninRequest {
  username: string;
  password: string;
}

export interface SigninResponse {
  token: string;
}
