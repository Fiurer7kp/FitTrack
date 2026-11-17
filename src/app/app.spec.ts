import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { App } from './app';

@Component({ template: '' })
class TestRoute {}

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([
          { path: 'dashboard', component: TestRoute },
          { path: 'login', component: TestRoute },
        ]),
      ],
    })
      .compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the router outlet', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
  });

  it('should hide the global theme toggle on the dashboard', async () => {
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl('/dashboard');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-global-theme-toggle]')).toBeNull();
  });

  it('should show the global theme toggle on other routes', async () => {
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl('/login');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-global-theme-toggle]')).not.toBeNull();
  });
});
