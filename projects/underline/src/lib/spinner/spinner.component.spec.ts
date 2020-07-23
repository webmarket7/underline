import { By } from '@angular/platform-browser';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UND_SPINNER_DEFAULT_CONFIG, UndSpinnerComponent } from './spinner.component';
import { UndSpinnerConfig } from './spinner-config';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';


describe('UndSpinnerComponent', () => {
    let component: UndSpinnerComponent;
    let fixture: ComponentFixture<UndSpinnerComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [BrowserAnimationsModule],
            declarations: [UndSpinnerComponent]
        });
    }));

    const customConfig = {
        circleStroke: 'red',
        minCircleLength: 5
    };

    describe('test spinner with default config', () => {
        beforeEach(() => {
            TestBed.compileComponents();
            fixture = TestBed.createComponent(UndSpinnerComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();
        });

        it('should create', () => {
            expect(component).toBeTruthy();
        });

        it('should use default config if no custom default config was provided and no custom config was passed through an input', () => {
            expect(component.getCurrentConfig()).toEqual({...new UndSpinnerConfig()});
        });

        it('should merge custom config with default config', () => {
            component.config = customConfig;

            expect(component.getCurrentConfig()).toEqual({...new UndSpinnerConfig(), ...customConfig});
        });

        it('should check config and apply changes', () => {
            component.start();
            fixture.detectChanges();
            const svg = fixture.debugElement.query(By.css('svg'));
            const circle = fixture.debugElement.query(By.css('.kan-spinner__circle'));

            expect(svg.attributes).toEqual({
                version: '1.1',
                xmlns: 'http://www.w3.org/2000/svg',
                baseProfile: 'full',
                preserveAspectRatio: 'xMidYMid',
                width: '18',
                height: '18',
                viewbox: '0 0 18 18'
            });
            expect(circle.attributes).toEqual({
                fill: 'none',
                'transform-origin': 'center',
                class: 'kan-spinner__circle',
                cx: '9',
                cy: '9',
                r: '8',
                stroke: '#7DB0D5',
                'stroke-width': '2'
            });
        });
    });

    describe('test custom default spinner config', () => {
        const customDefaultConfig = new UndSpinnerConfig({
            circleDiameter: 16,
            circleStrokeWidth: 2
        });

        beforeEach(() => {
            TestBed.overrideProvider(UND_SPINNER_DEFAULT_CONFIG, {useValue: customDefaultConfig});
            TestBed.compileComponents();
            fixture = TestBed.createComponent(UndSpinnerComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();
        });

        it('should use custom default config if it was provided and no custom config was passed through an input', () => {
            expect(component.getCurrentConfig()).toEqual({...customDefaultConfig});
        });

        it('should merge custom config with custom default config', () => {
            component.config = customConfig;

            expect(component.getCurrentConfig()).toEqual({...customDefaultConfig, ...customConfig});
        });
    });
});
