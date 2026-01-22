export interface ISignInResponse {
  accessToken: string;
  user: {
    id: number;
    username: string;
    email: string;
  };
}

export interface IAuthResponse {
  accessToken?: string;
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
