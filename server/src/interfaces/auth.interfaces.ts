export interface ISignInResponse {
  accessToken: string;
  user: IUser;
}

export interface IAuthResponse {
  accessToken?: string;
  user: IUser;
}
export interface IRegisterResponse {
  user: IUser;
}

export interface IUser {
  id: number;
  username: string;
  email: string;
}
