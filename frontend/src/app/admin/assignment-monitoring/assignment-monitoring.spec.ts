import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssignmentMonitoring } from './assignment-monitoring';

describe('AssignmentMonitoring', () => {
  let component: AssignmentMonitoring;
  let fixture: ComponentFixture<AssignmentMonitoring>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssignmentMonitoring]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssignmentMonitoring);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
