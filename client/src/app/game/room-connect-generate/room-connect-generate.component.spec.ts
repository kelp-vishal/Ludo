import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoomConnectGenerateComponent } from './room-connect-generate.component';

describe('RoomConnectGenerateComponent', () => {
  let component: RoomConnectGenerateComponent;
  let fixture: ComponentFixture<RoomConnectGenerateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoomConnectGenerateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoomConnectGenerateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
