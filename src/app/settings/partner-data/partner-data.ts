import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UiPageHeaderComponent } from '../../shared/components/ui-page-header/ui-page-header.component';
import { UiCardComponent } from '../../shared/components/ui-card/ui-card.component';

export interface UniversityPartner {
  id: number;
  name: string;
  shortName: string;
  address: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  website?: string;
}

@Component({
  selector: 'app-partner-data',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    UiPageHeaderComponent,
    UiCardComponent,
  ],
  templateUrl: './partner-data.html',
  styleUrl: './partner-data.css',
})
export class PartnerData implements OnInit {
  private API_URL = 'http://localhost:8090/api/universities';

  universities: UniversityPartner[] = [];
  filtered: UniversityPartner[] = [];
  isLoading = true;
  searchQuery = '';

  displayedColumns: string[] = ['name', 'shortName', 'contact', 'actions'];

  isFormOpen = false;
  isEditMode = false;
  editingId: number | null = null;
  univForm!: FormGroup;

  isDeleteModalOpen = false;
  deletingItem: UniversityPartner | null = null;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadUniversities();
  }

  initForm() {
    this.univForm = this.fb.group({
      name: ['', [Validators.required]],
      shortName: ['', [Validators.required]],
      address: [''],
      contactPerson: ['', [Validators.required]],
      contactPhone: ['', [Validators.required, Validators.pattern(/^(0|\+84)\d{9,10}$/)]],
      contactEmail: ['', [Validators.required, Validators.email]],
      website: [''],
    });
  }

  loadUniversities() {
    this.isLoading = true;
    this.http.get<UniversityPartner[]>(this.API_URL).subscribe({
      next: (res) => {
        this.universities = res;
        this.applyFilter();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  applyFilter() {
    const q = this.searchQuery.toLowerCase().trim();
    this.filtered = this.universities.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.shortName.toLowerCase().includes(q) ||
        u.contactPerson.toLowerCase().includes(q),
    );
  }

  openAddModal() {
    this.isEditMode = false;
    this.editingId = null;
    this.univForm.reset();
    this.isFormOpen = true;
  }

  openEditModal(item: UniversityPartner) {
    this.isEditMode = true;
    this.editingId = item.id;
    this.univForm.patchValue(item);
    this.isFormOpen = true;
  }

  closeForm() {
    this.isFormOpen = false;
  }

  save() {
    if (this.univForm.invalid) {
      this.univForm.markAllAsTouched();
      return;
    }

    const val = this.univForm.value;
    if (this.isEditMode && this.editingId) {
      this.http.put(`${this.API_URL}/${this.editingId}`, val).subscribe(() => {
        this.loadUniversities();
        this.closeForm();
      });
    } else {
      this.http.post(this.API_URL, val).subscribe(() => {
        this.loadUniversities();
        this.closeForm();
      });
    }
  }

  openDeleteModal(item: UniversityPartner) {
    this.deletingItem = item;
    this.isDeleteModalOpen = true;
  }

  confirmDelete() {
    if (!this.deletingItem) return;
    this.http.delete(`${this.API_URL}/${this.deletingItem.id}`).subscribe(() => {
      this.loadUniversities();
      this.isDeleteModalOpen = false;
    });
  }
}
