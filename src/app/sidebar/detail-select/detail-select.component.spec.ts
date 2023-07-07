import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailSelectComponent } from './detail-select.component';

describe('DetailSelectComponent', () => {
  let component: DetailSelectComponent;
  let fixture: ComponentFixture<DetailSelectComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DetailSelectComponent]
    });
    fixture = TestBed.createComponent(DetailSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
