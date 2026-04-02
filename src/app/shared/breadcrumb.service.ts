import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { BehaviorSubject, filter, distinctUntilChanged, map } from 'rxjs';

export interface BreadcrumbItem {
  label: string;        // The text to display
  routerLink?: string;  // The URL for the label itself (only for Dashboard mode if not current)
  backLink?: string;    // The URL for the '<' chevron (for settings mode)
  isCurrent: boolean;   // Is this the current active page?
}

export interface BreadcrumbOutput {
  isSettingsPage: boolean;
  items: BreadcrumbItem[];
}

@Injectable({
  providedIn: 'root'
})
export class BreadcrumbService {
  private readonly _breadcrumbs = new BehaviorSubject<BreadcrumbOutput>({ isSettingsPage: false, items: [] });
  readonly breadcrumbs$ = this._breadcrumbs.asObservable();

  constructor(private router: Router) {
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      distinctUntilChanged((prev: NavigationEnd, curr: NavigationEnd) => prev.url === curr.url),
      map((event: NavigationEnd) => this.buildBreadcrumbOutput(this.router.routerState.snapshot.root, event.urlAfterRedirects.split('?')[0]))
    ).subscribe((output: BreadcrumbOutput) => {
      this._breadcrumbs.next(output);
    });
  }

  private buildBreadcrumbOutput(route: ActivatedRouteSnapshot, currentFullUrl: string): BreadcrumbOutput {
    const isSettingsPage = currentFullUrl.startsWith('/settings');
    const items: BreadcrumbItem[] = [];

    // Collect all snapshots along the path
    const pathSnapshots: ActivatedRouteSnapshot[] = [];
    let currentRoute: ActivatedRouteSnapshot | null = route;
    while (currentRoute) {
        if (currentRoute.routeConfig && currentRoute.routeConfig.path) { // Only add if it has a defined path
            pathSnapshots.push(currentRoute);
        }
        currentRoute = currentRoute.firstChild;
    }

    if (isSettingsPage) {
      // Setting Mode: < [Tên Cấp Cha] < [Tên Cấp Con]
      // Labels should NOT have links, Arrows (`<`) should be clickable.
      let currentAccumulatedPath = '';
      let previousUrl = '/dashboard'; // For the first '<' to link to dashboard

      for (let i = 0; i < pathSnapshots.length; i++) {
        const snapshot = pathSnapshots[i];
        const routeSegment = snapshot.url.map(segment => segment.path).join('/');
        const breadcrumbLabel = snapshot.data['title']; // Using data.title

        if (breadcrumbLabel) {
          if (currentAccumulatedPath === '') {
            currentAccumulatedPath = `/${routeSegment}`;
          } else {
            currentAccumulatedPath += `/${routeSegment}`;
          }

          const isCurrentItem = (currentAccumulatedPath === currentFullUrl);

          // The backLink for the current item
          let backUrl: string;
          if (i === 0) { // This is the root settings item (e.g., '/settings')
            backUrl = '/dashboard';
          } else {
            // Take the URL of the previous item in the path as the backLink
            const pathSegments = currentAccumulatedPath.split('/').filter(s => s.length > 0);
            pathSegments.pop(); // Remove current segment to get parent path
            backUrl = `/${pathSegments.join('/')}`;
            if (backUrl === '/') backUrl = '/dashboard'; // Ensure root is /dashboard
          }

          items.push({
            label: breadcrumbLabel,
            backLink: backUrl,
            isCurrent: isCurrentItem,
            routerLink: undefined // Labels do not have links
          });
          previousUrl = currentAccumulatedPath;
        }
      }
    } else {
      // Dashboard Mode: [Tên Cấp Cha] < [Tên Cấp Con]
      // Labels should NOT have links, '<' is only a separator.
      let currentAccumulatedPath = '';
      for (let i = 0; i < pathSnapshots.length; i++) {
        const snapshot = pathSnapshots[i];
        const routeSegment = snapshot.url.map(segment => segment.path).join('/');
        const breadcrumbLabel = snapshot.data['title']; // Using data.title

        if (breadcrumbLabel) {
          if (currentAccumulatedPath === '') {
            currentAccumulatedPath = `/${routeSegment}`;
          } else {
            currentAccumulatedPath += `/${routeSegment}`;
          }

          const isCurrentItem = (currentAccumulatedPath === currentFullUrl);
          items.push({
            label: breadcrumbLabel,
            isCurrent: isCurrentItem,
            routerLink: undefined, // Labels do not have links
            backLink: undefined // Separator only
          });
        }
      }
    }

    return {
      isSettingsPage: isSettingsPage,
      items: items
    };
  }
}
