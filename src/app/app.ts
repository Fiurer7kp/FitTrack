import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { ThemeService } from './theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  readonly router = inject(Router);
  readonly themeService = inject(ThemeService);
}