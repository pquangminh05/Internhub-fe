import { Component, ViewEncapsulation, OnInit } from '@angular/core'; // Import OnInit
import { Sidebar } from '../sidebar/sidebar'; // Import Sidebar component
import { Topbar } from '../topbar/topbar'; // Import Topbar component
import { RouterModule } from '@angular/router'; // Import RouterModule

@Component({
  selector: 'app-main-layout',
  imports: [Sidebar, Topbar, RouterModule], // Add RouterModule to imports
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css',
  encapsulation: ViewEncapsulation.None,
})
export class MainLayout implements OnInit { // Implement OnInit
  isSidebarVisible: boolean = true; // State to control sidebar visibility

  constructor() {
    console.log('MainLayout constructor - Initializing.');
  }

  ngOnInit() {
    console.log('MainLayout ngOnInit - Main layout initialized.');
  }

  toggleSidebar() {
    this.isSidebarVisible = !this.isSidebarVisible;
    console.log('MainLayout toggleSidebar - isSidebarVisible:', this.isSidebarVisible);
  }
}
