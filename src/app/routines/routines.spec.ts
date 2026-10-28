import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Routines } from './routines';

describe('Routines', () => {
  let component: Routines;
  let fixture: ComponentFixture<Routines>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Routines],
    }).compileComponents();

    fixture = TestBed.createComponent(Routines);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
