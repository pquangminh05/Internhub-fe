import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ui-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-2xl shadow-soft border border-surface-50 overflow-hidden transition-all duration-300 hover:shadow-card">
      <!-- Card Header -->
      <div *ngIf="title || hasHeader" class="px-8 py-5 border-b border-surface-50 flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <ng-content select="[card-icon]"></ng-content>
          <h3 *ngIf="title" class="text-lg font-bold text-gray-800 tracking-tight">{{ title }}</h3>
          <ng-content select="[card-header-title]"></ng-content>
        </div>
        <div class="flex items-center space-x-2">
          <ng-content select="[card-actions]"></ng-content>
        </div>
      </div>

      <!-- Card Content -->
      <div [class]="paddingClass">
        <ng-content></ng-content>
      </div>

      <!-- Card Footer -->
      <div *ngIf="hasFooter" class="px-8 py-4 bg-surface-50 border-t border-surface-100 flex items-center justify-end space-x-3">
        <ng-content select="[card-footer]"></ng-content>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class UiCardComponent {
  @Input() title?: string;
  @Input() hasHeader = false;
  @Input() hasFooter = false;
  @Input() paddingClass = 'p-8';
}
