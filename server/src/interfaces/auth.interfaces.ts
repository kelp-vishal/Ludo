export interface ISignInResponse {
  access_token: string;
  user: {
    id: number;
    username: string;
    email: string;
  };
}

export interface IAuthResponse {
  access_token?: string;
  message: string;
  user: {
    id: number;
    username: string;
    email: string;
  };
}

export interface IRegisterResponse {
  message: string;
  user: {
    id: number;
    username: string;
    email: string;
  };
}
