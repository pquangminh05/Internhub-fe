import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ui-page-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 animate-fade-in-up">
      <div class="space-y-1">
        <h1 class="text-3xl font-extrabold text-gray-900 tracking-tight leading-tight">{{ title }}</h1>
        <p *ngIf="subtitle" class="text-sm text-gray-400 font-medium tracking-wide uppercase">{{ subtitle }}</p>
      </div>
      <div class="flex items-center space-x-3 flex-wrap">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .animate-fade-in-up {
      animation: fadeInUp 0.5s ease-out forwards;
    }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class UiPageHeaderComponent {
  @Input({ required: true }) title!: string;
  @Input() subtitle?: string;
}
