import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MetricCard } from './metric-card';

describe('MetricCard', () => {
  let component: MetricCard;
  let fixture: ComponentFixture<MetricCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MetricCard],
    }).compileComponents();

    fixture = TestBed.createComponent(MetricCard);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('title', 'Entrenamientos');
    fixture.componentRef.setInput('value', '2');
    fixture.componentRef.setInput('supportingText', 'Esta semana');
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders an accessible progress bar when progress is provided', () => {
    fixture.componentRef.setInput('progress', 50);
    fixture.componentRef.setInput('progressLabel', 'Avance semanal');
    fixture.detectChanges();

    const progressbar = fixture.nativeElement.querySelector('[role="progressbar"]') as HTMLElement;
    expect(progressbar.getAttribute('aria-label')).toBe('Avance semanal');
    expect(progressbar.getAttribute('aria-valuenow')).toBe('50');
    expect(fixture.nativeElement.textContent).toContain('50% de la meta');
  });

  it('omits the progress bar when progress is not configured', () => {
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="progressbar"]')).toBeNull();
  });
});
