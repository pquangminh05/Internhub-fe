import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { BreadcrumbService, BreadcrumbOutput, BreadcrumbItem } from '../breadcrumb.service';

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './breadcrumb.component.html',
  // Removed styleUrl as it will be empty and relying on inline Tailwind
})
export class BreadcrumbComponent implements OnInit {
  breadcrumbData$: Observable<BreadcrumbOutput>;

  constructor(private breadcrumbService: BreadcrumbService) {
    this.breadcrumbData$ = this.breadcrumbService.breadcrumbs$;
  }

  ngOnInit(): void {
  }
}
