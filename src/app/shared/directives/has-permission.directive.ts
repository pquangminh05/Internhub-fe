import { Directive, Input, TemplateRef, ViewContainerRef, OnDestroy } from '@angular/core';
import { PermissionService } from '../../services/permission.service';
import { Subject, takeUntil } from 'rxjs';

@Directive({
  selector: '[appHasPermission]',
  standalone: true,
})
export class HasPermissionDirective implements OnDestroy {
  private hasView = false;
  private destroy$ = new Subject<void>();

  private functionCode: string | undefined;
  private permissionType: 'canAccess' | 'canCreate' | 'canEdit' | 'canDelete' | undefined;

  @Input()
  set appHasPermission(permissionConfig: { functionCode: string; permissionType: 'canAccess' | 'canCreate' | 'canEdit' | 'canDelete' }) {
    this.functionCode = permissionConfig.functionCode;
    this.permissionType = permissionConfig.permissionType;
    this.updateView();
  }

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private permissionService: PermissionService
  ) {}

  private updateView() {
    if (this.functionCode && this.permissionType) {
      this.permissionService.hasPermission(this.functionCode, this.permissionType)
        .pipe(takeUntil(this.destroy$))
        .subscribe(hasPerm => {
          if (hasPerm && !this.hasView) {
            this.viewContainer.createEmbeddedView(this.templateRef);
            this.hasView = true;
          } else if (!hasPerm && this.hasView) {
            this.viewContainer.clear();
            this.hasView = false;
          }
        });
    } else {
      // If functionCode or permissionType is not provided, clear the view (hide the element)
      if (this.hasView) {
        this.viewContainer.clear();
        this.hasView = false;
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
