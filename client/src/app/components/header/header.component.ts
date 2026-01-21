
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../identity/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit {
  isLoggedIn = false;
  username: string = '';

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Subscribe to authentication status
    this.authService.currentUser$.subscribe(user => {
      this.isLoggedIn = !!user;
      this.username = user?.username || '';
    });
  }

  startGame() {
    try {
      // Check if user is logged in
      if (this.authService.isLoggedIn()) {
        console.log("User is authenticated, redirecting to game setup");
        this.router.navigate(['/game-setup']);
      } else {
        console.log("User not authenticated, redirecting to login");
        this.router.navigate(['/signup']);
      }
    } catch (error) {
      console.error("Error starting the game:", error);
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
