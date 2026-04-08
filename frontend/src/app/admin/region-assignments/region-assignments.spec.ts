import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegionAssignments } from './region-assignments';

describe('RegionAssignments', () => {
  let component: RegionAssignments;
  let fixture: ComponentFixture<RegionAssignments>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegionAssignments]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegionAssignments);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
