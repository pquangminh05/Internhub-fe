import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginComponent } from './login'; // Corrected import

describe('LoginComponent', () => { // Corrected component name
  let component: LoginComponent; // Corrected component type
  let fixture: ComponentFixture<LoginComponent>; // Corrected component type

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent] // Corrected component import
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginComponent); // Corrected component name
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
