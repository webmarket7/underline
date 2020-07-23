import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UndSpinnerComponent } from './spinner.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';


@NgModule({
    declarations: [
        UndSpinnerComponent
    ],
    imports: [
        CommonModule,
        BrowserAnimationsModule
    ],
    exports: [
        UndSpinnerComponent
    ]
})
export class UndSpinnerModule {
}
