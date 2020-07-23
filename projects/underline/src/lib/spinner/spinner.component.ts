import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    HostBinding,
    Inject,
    InjectionToken,
    Input,
    OnDestroy,
    Optional,
    Renderer2,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';
import { UndSpinnerAccessor } from './models/spinner-accessor.interface';
import { UndSpinnerConfig } from './spinner-config';
import { degToRad, diffObj, hasAnyKey, percentageAsDecimal } from '../core/utils';
import { animate, AnimationBuilder, AnimationFactory, AnimationPlayer, keyframes, style } from '@angular/animations';
import { combineLatest, Observable, Subject } from 'rxjs';
import { mapTo, take } from 'rxjs/operators';


const CIRCLE_HIDDEN_CLASS = 'und-spinner__circle--hidden';
const CHECKMARK_HIDDEN_CLASS = 'und-spinner__checkmark--hidden';

export interface SpinnerCircleDashArray {
    min: number;
    max: number;
    full: number;
}

export const UND_SPINNER_DEFAULT_CONFIG = new InjectionToken<UndSpinnerConfig>('UND_SPINNER_DEFAULT_CONFIG');

@Component({
    selector: 'und-spinner',
    templateUrl: './spinner.component.html',
    styleUrls: ['./spinner.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None
})
export class UndSpinnerComponent implements UndSpinnerAccessor, OnDestroy {

    @Input() config: Partial<UndSpinnerConfig>;

    private _currentConfig: UndSpinnerConfig;

    get currentConfig(): UndSpinnerConfig {
        return this._currentConfig;
    }

    private _animationInProgress = false;
    private _isStopped = false;

    private _spinAnimationPlayer: AnimationPlayer;
    private _spinAnimationDone: Subject<void> = new Subject<void>();

    get spinAnimationDone(): Observable<void> {
        return this._spinAnimationDone.asObservable();
    }

    private _fillAnimationPlayer: AnimationPlayer;
    private _fillAnimationDone: Subject<void> = new Subject<void>();

    get fillAnimationDone(): Observable<void> {
        return this._fillAnimationDone.asObservable();
    }

    private _checkmarkAnimationPlayer: AnimationPlayer;
    private _checkmarkAnimationDone: Subject<void> = new Subject<void>();

    get checkmarkAnimationDone(): Observable<void> {
        return this._checkmarkAnimationDone.asObservable();
    }

    get allAnimationsDone(): Observable<void> {
        return this.withCheckmark
            ? combineLatest([
                this.spinAnimationDone,
                this.fillAnimationDone,
                this.checkmarkAnimationDone
            ]).pipe(mapTo(undefined))
            : this.spinAnimationDone;
    }

    get isStopped(): boolean {
        return this._isStopped;
    }

    @HostBinding('class') className = 'und-spinner';

    /*
     *  The spinner circle diameter.
     */
    @HostBinding('style.width.px')
    @HostBinding('style.height.px')
    circleDiameter: number;

    /*
     *  The spinner circle stroke width.
     */
    circleStrokeWidth: number;

    /*
     *  The spinner circle stroke color.
     */
    circleStroke: string;

    /*
     *  The color of filled spinner circle, showing that operation is complete.
     */
    circleStrokeSuccess: string;

    /*
     *  The smallest filled part of the circle during the spin animation in percents. Allowed values: 0-100.
     */
    circleStrokeMinLength: number;

    /*
     *  The largest filled part of the circle during the spin animation in percents. Allowed values: 0-100.
     */
    circleStrokeMaxLength: number;

    /*
     *  Time in seconds, which spinner needs to make one spin
     */
    spinningTiming: number;

    /*
     *  Determines, if user should see the filled circle with checkmark after operation is completed
     */
    withCheckmark: boolean;

    checkmarkStroke: string;

    checkmarkStrokeWidth: number;

    checkmarkDistance: number;

    /*
     *  Time in seconds, which circle fill and checkmark animations need to complete
     */
    checkmarkTiming: number;

    checkmarkPoints: string;

    /*
     *  The outer radius of the spinner circle.
     */
    outerRadius: number;

    /*
     *  The inner radius of the spinner circle'.
     */
    innerRadius: number;

    /*
     *  The stroke circumference of the spinner circle'.
     */
    private _circleStrokeCircumference: number;

    /*
     *  The calculated dash array of spinner circle, used to animate spinning.
     */
    private _circleDashArray: SpinnerCircleDashArray;

    @ViewChild('circle') private _circle: ElementRef<SVGCircleElement>;
    @ViewChild('checkmark') private _checkmark: ElementRef<SVGPolylineElement>;

    constructor(
        private _cdRef: ChangeDetectorRef,
        private _animationBuilder: AnimationBuilder,
        private _renderer: Renderer2,
        @Optional() @Inject(UND_SPINNER_DEFAULT_CONFIG) private _defaultConfig?: UndSpinnerConfig
    ) {
    }

    ngOnDestroy(): void {
        this._spinAnimationDone.complete();
        this._destroyAnimationPlayers();
    }

    getCurrentConfig(): UndSpinnerConfig {
        return applyConfigDefaults(this._defaultConfig, this.config);
    }

    reset(): void {
        this._isStopped = false;
        this._animationInProgress = false;
        this._destroyAnimationPlayers();
        this._hideCircle();

        if (this.withCheckmark) {
            this._hideCheckmark();
        }
    }

    start(): void {
        if (!this._animationInProgress) {
            this._animationInProgress = true;
            this.allAnimationsDone.pipe(take(1)).subscribe(() => this._animationInProgress = false);
            this._checkConfig();

            this._showCircle();
            this._playSpinAnimation();

            if (this.withCheckmark) {
                this.spinAnimationDone
                    .pipe(take(1))
                    .subscribe(() => {
                        this._playFillAnimation();
                        this._showCheckmark();
                        this._playCheckmarkAnimation();
                    });
            }
        }
    }

    stop(): void {
        this._isStopped = true;
    }

    private _hideCircle(): void {
        this._renderer.addClass(this._circle.nativeElement, CIRCLE_HIDDEN_CLASS);
    }

    private _showCircle(): void {
        this._renderer.removeClass(this._circle.nativeElement, CIRCLE_HIDDEN_CLASS);
    }

    private _hideCheckmark(): void {
        this._renderer.addClass(this._checkmark.nativeElement, CHECKMARK_HIDDEN_CLASS);
    }

    private _showCheckmark(): void {
        this._renderer.removeClass(this._checkmark.nativeElement, CHECKMARK_HIDDEN_CLASS);
    }

    private _updateConfigValues(config: Partial<UndSpinnerConfig> | UndSpinnerConfig): void {
        for (const key in config) {
            if (config.hasOwnProperty(key)) {
                this[key] = config[key];
            }
        }
    }

    private _updateValuesBasedOnDiameterAndStrokeWidth(): void {
        this.outerRadius = calculateRadius(this.circleDiameter);
        this.innerRadius = calculateCircleRadius(this.circleDiameter, this.circleStrokeWidth);
        this._circleStrokeCircumference = calculateCircumference(this.circleDiameter, this.circleStrokeWidth);

        if (this.withCheckmark) {
            this.checkmarkPoints = calculateCheckmarkPoints(this.circleDiameter, this.circleStrokeWidth, this.checkmarkDistance);
        }
    }

    private _updateValuesBasedOnStrokeLengths(): void {
        this._circleDashArray = calculateCircleDashArray(
            this._circleStrokeCircumference,
            this.circleStrokeMinLength,
            this.circleStrokeMaxLength
        );
    }

    private _applyConfig(difference: Partial<UndSpinnerConfig>, config: UndSpinnerConfig): void {
        this._updateConfigValues(difference);

        if (hasAnyKey(difference, ['circleStrokeWidth', 'circleDiameter'])) {
            this._updateValuesBasedOnDiameterAndStrokeWidth();
            this._updateValuesBasedOnStrokeLengths();
        } else if (hasAnyKey(difference, ['circleStrokeMinLength', 'circleStrokeMaxLength'])) {
            this._updateValuesBasedOnStrokeLengths();
        }

        this._currentConfig = config;
        this._cdRef.markForCheck();
    }

    private _checkConfig(): void {
        const config = this.getCurrentConfig();
        const difference = this._currentConfig ? diffObj<UndSpinnerConfig>(config, this._currentConfig || {}) : config;

        if (difference) {
            this._applyConfig(difference, config);
        }
    }

    private _buildSpinAnimation(min: number, max: number, full: number, timing: number): AnimationFactory {
        return this._animationBuilder.build([
            animate(`${timing}s`, keyframes([
                style({
                    transform: 'rotate(0)',
                    'stroke-dasharray': `${min} ${full}`
                }),
                style({
                    transform: 'rotate(180deg)',
                    'stroke-dasharray': `${max} ${max}`
                }),
                style({
                    transform: 'rotate(720deg)',
                    'stroke-dasharray': `${min} ${full}`
                })
            ]))
        ]);
    }

    private _playSpinAnimation(): void {
        this._spinAnimationPlayer = this._buildSpinAnimation(
            this._circleDashArray.min,
            this._circleDashArray.max,
            this._circleDashArray.full,
            this.spinningTiming
        ).create(this._circle.nativeElement);

        this._spinAnimationPlayer.play();

        this._spinAnimationPlayer.onDone(() => {
            this._destroyAnimationPlayerIfExists('_spinAnimationPlayer');

            if (!this._isStopped) {
                this._playSpinAnimation();
            } else {
                this._spinAnimationDone.next();
            }
        });
    }

    private _buildFillAnimation(full: number,
                                circleStroke: string,
                                circleStrokeSuccess: string,
                                timing: number): AnimationFactory {
        return this._animationBuilder.build([
            animate(`${timing}s ease-out`, keyframes([
                style({
                    'stroke-dasharray': `${full}`,
                    'stroke-dashoffset': `${full}`,
                    stroke: `${circleStroke}`,
                }),
                style({
                    'stroke-dashoffset': '0',
                    stroke: `${circleStrokeSuccess}`,
                })
            ]))
        ]);
    }

    private _playFillAnimation(): void {
        this._fillAnimationPlayer = this._buildFillAnimation(
            this._circleDashArray.full,
            this.circleStroke,
            this.circleStrokeSuccess,
            this.checkmarkTiming
        ).create(this._circle.nativeElement);
        this._fillAnimationPlayer.play();
        this._fillAnimationPlayer.onDone(() => this._fillAnimationDone.next());
    }

    private _buildCheckmarkAnimation(circleDiameter: number, timing: number): AnimationFactory {
        return this._animationBuilder.build([
            animate(`${timing}s ease-in`, keyframes([
                style({
                    'stroke-dashoffset': `-${circleDiameter}`
                }),
                style({
                    'stroke-dashoffset': '0'
                })
            ]))
        ]);
    }

    private _playCheckmarkAnimation(): void {
        this._checkmarkAnimationPlayer = this._buildCheckmarkAnimation(this.circleDiameter, this.checkmarkTiming)
            .create(this._checkmark.nativeElement);
        this._checkmarkAnimationPlayer.play();
        this._checkmarkAnimationPlayer.onDone(() => this._checkmarkAnimationDone.next());
    }

    private _destroyAnimationPlayerIfExists(animationPlayerName: string): void {
        if (this[animationPlayerName]) {
            this[animationPlayerName].destroy();
            delete this[animationPlayerName];
        }
    }

    private _destroyAnimationPlayers(): void {
        this._destroyAnimationPlayerIfExists('_fillAnimationPlayer');
        this._destroyAnimationPlayerIfExists('_checkmarkAnimationPlayer');
    }
}

function applyConfigDefaults(defaultOptions?: UndSpinnerConfig, config?: Partial<UndSpinnerConfig>): UndSpinnerConfig {
    return {...(defaultOptions || new UndSpinnerConfig()), ...config};
}

export function calculateRadius(diameter: number): number {
    return diameter / 2;
}

export function calculateInnerDiameter(diameter: number, strokeWidth: number): number {
    return diameter - strokeWidth * 2;
}

export function calculateCircleRadius(diameter: number, strokeWidth: number): number {
    return calculateRadius(diameter - strokeWidth);
}

export function calculateCircumference(diameter: number, strokeWidth: number): number {
    return 2 * Math.PI * calculateCircleRadius(diameter, strokeWidth);
}

export function calculateDashValue(circumference: number, percentage: number): number {
    return circumference * percentageAsDecimal(percentage);
}

export function calculateCircleDashArray(circumference: number, minLength: number, maxLength: number): SpinnerCircleDashArray {
    return {
        min: calculateDashValue(circumference, minLength),
        max: calculateDashValue(circumference, maxLength),
        full: circumference
    };
}

export function calculateCheckmarkPoints(diameter: number, strokeWidth: number, distance: number): string {
    const innerDiameter = calculateInnerDiameter(diameter, strokeWidth);
    const inscribedSquareSide = innerDiameter / Math.sqrt(2);
    const inscribedSquareOffset = (diameter - inscribedSquareSide) / 2;
    const checkmarkContainerOffset = inscribedSquareOffset + (innerDiameter * percentageAsDecimal(distance) * Math.sin(degToRad(45)));
    const checkmarkContainerSide = diameter - (checkmarkContainerOffset * 2);
    const topLeftPoint = {x: checkmarkContainerOffset, y: checkmarkContainerOffset};

    return `${topLeftPoint.x + checkmarkContainerSide} ${topLeftPoint.y},
         ${topLeftPoint.x + (checkmarkContainerSide * 0.4)} ${topLeftPoint.y + checkmarkContainerSide},
          ${topLeftPoint.x} ${topLeftPoint.x + checkmarkContainerSide * 0.6}`;
}
