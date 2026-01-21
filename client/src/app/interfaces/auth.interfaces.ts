export interface IUser {
  id: number;
  username: string;
  email: string;
}

export interface ILoginResponse {
  access_token: string;
  user: IUser;
}

export interface IRegisterResponse {
  message: string;
  user: IUser;
}