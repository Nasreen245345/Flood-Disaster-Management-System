import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HelpRequestDialog } from './help-request-dialog';

describe('HelpRequestDialog', () => {
  let component: HelpRequestDialog;
  let fixture: ComponentFixture<HelpRequestDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HelpRequestDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HelpRequestDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
