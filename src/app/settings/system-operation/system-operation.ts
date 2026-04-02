import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { UiPageHeaderComponent } from '../../shared/components/ui-page-header/ui-page-header.component';
import { UiCardComponent } from '../../shared/components/ui-card/ui-card.component';

@Component({
  selector: 'app-system-operation',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatIconModule,
    MatSlideToggleModule,
    UiPageHeaderComponent,
    UiCardComponent,
  ],
  templateUrl: './system-operation.html',
  styleUrl: './system-operation.css',
})
export class SystemOperation {
  config = {
    cycleType: 'END_OF_TERM',
    startDay: 25,
    durationDays: 5,
    benchmark: {
      excellent: 8.5,
      pass: 5.0,
      warning: 4.0,
    },
    useWeights: true,
  };

  saveSettings() {
    console.log('System Configuration Saved:', this.config);
    // Thực hiện gọi API lưu cấu hình tại đây
  }
}
