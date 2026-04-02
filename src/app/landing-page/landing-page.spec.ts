import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { LandingPageComponent } from './landing-page.component'; // Corrected import

describe('LandingPageComponent', () => {
  // Corrected component name
  let component: LandingPageComponent; // Corrected component type
  let fixture: ComponentFixture<LandingPageComponent>; // Corrected component type

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingPageComponent], // Corrected component import
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(LandingPageComponent); // Corrected component name
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
