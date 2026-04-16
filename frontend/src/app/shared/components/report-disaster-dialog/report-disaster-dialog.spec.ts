import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportDisasterDialog } from './report-disaster-dialog';

describe('ReportDisasterDialog', () => {
  let component: ReportDisasterDialog;
  let fixture: ComponentFixture<ReportDisasterDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportDisasterDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportDisasterDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
