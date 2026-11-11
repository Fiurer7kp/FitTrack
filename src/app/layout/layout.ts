import { Component } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-layout',
  styleUrl: './layout.scss',
  templateUrl: './layout.html',
})
export class Layout {
  readonly navItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Ejercicios', path: '/exercises' },
    { label: 'Rutinas', path: '/routines' },
    { label: 'Calendario', path: '/calendar' },
    { label: 'Timer', path: '/timer' },
    { label: 'Perfil', path: '/profile' },
  ];
}
