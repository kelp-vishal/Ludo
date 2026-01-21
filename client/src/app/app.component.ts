import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { NgIf } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true, 
  imports: [RouterOutlet, HeaderComponent, NgIf], 
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  showHeader =false;

  constructor(private router: Router) {

    this.router.events.subscribe(event =>{
      if (event instanceof NavigationEnd) {
        const path = event.urlAfterRedirects.split('?')[0].split('#')[0];
        this.showHeader = path !== '/ludo-board';
      }
    });
  }
}
