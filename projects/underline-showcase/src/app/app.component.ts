import { Component, ViewChild } from '@angular/core';
import { UndSpinnerComponent } from 'underline';
import { take } from 'rxjs/operators';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent {
    config = {
        withCheckmark: true,
        circleStrokeWidth: 3,
        circleDiameter: 24,
        checkmarkStrokeWidth: 3
    };

    @ViewChild(UndSpinnerComponent) spinner: UndSpinnerComponent;

    onStartSpinner(): void {
        this.spinner.start();
        this.spinner.allAnimationsDone.pipe(take(1)).subscribe(() => {
            console.log('All animations done!');
        });
    }

    onStopSpinner(): void {
        this.spinner.stop();
    }

    onResetSpinner(): void {
        this.spinner.reset();
    }
}
