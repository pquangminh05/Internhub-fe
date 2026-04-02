import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { OnInit } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';

interface Skill {
  id: number;
  name: string;
  parentId: number | null;
  defaultWeight: number;
  open?: boolean;
  children?: Skill[];

}

@Component({
  selector: 'app-config-review',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './config-review.html',
  styleUrl: './config-review.css',

})

export class ConfigReview implements OnInit{
  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}
  lastAffectedMasterId: number | null = null;
  masters: Skill[] = [];
  ngOnInit() {
    this.loadSkills();
  }

  loadSkills() {
    this.http.get<any[]>('http://localhost:8090/api/skills')
      .subscribe(data => {

        const tree = this.buildTree(data);

        // 🔥 MỞ master vừa thao tác
        if (this.lastAffectedMasterId) {
          tree.forEach(m => {
            if (m.id === this.lastAffectedMasterId) {
              m.open = true;
            }
          });

          this.lastAffectedMasterId = null;
        }

        this.masters = tree;

        this.cdr.detectChanges();
      });
  }

  buildTree(data: any[]): Skill[] {
    const map = new Map<number, Skill>();
    const roots: Skill[] = [];

    data.forEach(item => {
      map.set(item.id, {
        id: item.id,
        name: item.name,
        parentId: item.parentId,
        defaultWeight: item.defaultWeight,
        children: [],
        open: false
      });
    });

    data.forEach(item => {
      const node = map.get(item.id)!;

      if (item.parentId) {
        map.get(item.parentId)?.children?.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }
  search = '';

  // Modal state
  showModal = false;
  isEdit = false;
  currentMaster: Skill | null = null;

  form: any = {
    id: null,
    name: '',
    defaultWeight: 1
  };
  filteredMasters() {
    if (!this.search.trim()) return this.masters;

    const q = this.search.toLowerCase();

    return this.masters
      .map(m => {
        const matchMaster = m.name.toLowerCase().includes(q);

        const matchedChildren = m.children?.filter(c =>
          c.name.toLowerCase().includes(q)
        ) || [];

        //
        if (matchMaster) {
          return {
            ...m,
            open: true,
            children: m.children
          };
        }

        //
        if (matchedChildren.length > 0) {
          return {
            ...m,
            open: true,
            children: matchedChildren
          };
        }

        return null;
      })
      .filter(m => m !== null) as Skill[];
  }
  openCreateMaster() {
    this.isEdit = false;
    this.currentMaster = null;
    this.form = { id: null, name: '', defaultWeight: 1 };
    this.showModal = true;
  }

  openCreateSub(master: Skill) {
    this.isEdit = false;
    this.currentMaster = master;
    this.form = { id: null, name: '', defaultWeight: 1 };
    this.showModal = true;
  }

  openEdit(master: Skill, sub?: Skill) {
    this.isEdit = true;

    if (sub) {
      this.currentMaster = master;
      this.form = { ...sub };
    } else {
      this.currentMaster = null;
      this.form = { ...master };
    }

    this.showModal = true;
  }

  save() {
    if (!this.form.name) return;

    const payload = {
      name: this.form.name,
      parentId: this.currentMaster ? this.currentMaster.id : null,
      defaultWeight: this.form.defaultWeight
    };

    // XÁC ĐỊNH MASTER BỊ ẢNH HƯỞNG
    if (this.currentMaster) {
      // thêm hoặc sửa sub
      this.lastAffectedMasterId = this.currentMaster.id;
    } else if (this.isEdit) {
      // sửa master
      this.lastAffectedMasterId = this.form.id;
    }

    const request$ = !this.isEdit
      ? this.http.post('http://localhost:8090/api/skills', payload)
      : this.http.put(
        `http://localhost:8090/api/skills/${this.form.id}`,
        payload
      );

    request$.subscribe({
      next: () => {
        this.loadSkills();
      },
      error: (err) => {
        console.error(err);
      },
      complete: () => {
        this.showModal = false;
      }
    });
  }

  deleteMaster(master: Skill) {
    if (!confirm('Bạn có chắc muốn xóa?')) return;

    this.http.delete(
      `http://localhost:8090/api/skills/${master.id}`
    ).subscribe(() => {
      this.loadSkills();
    });
  }

  deleteSub(master: Skill, sub: Skill) {
    if (!confirm('Bạn có chắc muốn xóa?')) return;
    this.lastAffectedMasterId = master.id;

    this.http.delete(
      `http://localhost:8090/api/skills/${sub.id}`
    ).subscribe(() => {
      this.loadSkills();
    });
  }
}
