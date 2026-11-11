import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./login/login').then((m) => m.Login) },
  { path: 'dashboard', canActivate: [authGuard], loadComponent: () => import('./dashboard/dashboard').then((m) => m.Dashboard) },
  { path: 'exercises', canActivate: [authGuard], loadComponent: () => import('./exercises/exercises').then((m) => m.Exercises) },
  { path: 'calendar', canActivate: [authGuard], loadComponent: () => import('./calendar/calendar').then((m) => m.Calendar) },
  { path: 'routines/:id', canActivate: [authGuard], loadComponent: () => import('./routines/routine-detail').then((m) => m.RoutineDetail) },
  { path: 'routines', canActivate: [authGuard], loadComponent: () => import('./routines/routines').then((m) => m.Routines) },
  { path: 'timer', canActivate: [authGuard], loadComponent: () => import('./timer/timer').then((m) => m.Timer) },
  { path: 'profile', canActivate: [authGuard], loadComponent: () => import('./profile/profile').then((m) => m.Profile) },
  { path: '**', redirectTo: 'login' },
];
