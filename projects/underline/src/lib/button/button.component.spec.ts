import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UndButtonComponent } from './button.component';

describe('UndButtonComponent', () => {
    let component: UndButtonComponent;
    let fixture: ComponentFixture<UndButtonComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [UndButtonComponent]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(UndButtonComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
