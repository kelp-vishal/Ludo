import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import {
  IUser,
  ILoginResponse,
  IRegisterResponse,
} from '../../interfaces/auth.interfaces';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  User: IUser[] = [];
  LoginResponse: ILoginResponse[] = [];
  RegisterResponse: IRegisterResponse[] = [];

  // private apiUrl = 'http://localhost:3002/auth';
  private apiUrl = 'https://f1vbcpxc-3002.inc1.devtunnels.ms/auth';
  private currentUserSubject = new BehaviorSubject<IUser | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: Object,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);

    // Load user from localStorage if exists (only in browser)
    if (this.isBrowser) {
      const user = localStorage.getItem('currentUser');
      if (user) {
        this.currentUserSubject.next(JSON.parse(user));
      }
    }
  }

  login(username: string, password: string): Observable<ILoginResponse> {
    return this.http
      .post<ILoginResponse>(`${this.apiUrl}/login`, { username, password })
      .pipe(
        tap((response) => {
          if (this.isBrowser) {
            localStorage.setItem('access_token', response.access_token);
            localStorage.setItem('currentUser', JSON.stringify(response.user));
          }
          this.currentUserSubject.next(response.user);
        }),
      );
  }

  register(
    username: string,
    email: string,
    password: string,
  ): Observable<IRegisterResponse> {
    return this.http.post<IRegisterResponse>(`${this.apiUrl}/register`, {
      username,
      email,
      password,
    });
  }

  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('currentUser');
    }
    this.currentUserSubject.next(null);
  }

  getCurrentUser(): IUser | null {
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    if (!this.isBrowser) {
      return false;
    }
    return !!localStorage.getItem('access_token');
  }
}
