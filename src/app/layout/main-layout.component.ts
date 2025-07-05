import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './navbar.component';
import { ToastContainerComponent } from '../shared/components/toast-container.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, ToastContainerComponent],
  templateUrl: './main-layout.component.html'
})
export class MainLayoutComponent {} 