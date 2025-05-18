import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegsitrationformComponent } from './regsitrationform.component';

describe('RegsitrationformComponent', () => {
  let component: RegsitrationformComponent;
  let fixture: ComponentFixture<RegsitrationformComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegsitrationformComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegsitrationformComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
