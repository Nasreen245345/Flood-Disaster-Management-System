import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Disasters } from './disasters';

describe('Disasters', () => {
  let component: Disasters;
  let fixture: ComponentFixture<Disasters>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Disasters]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Disasters);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
