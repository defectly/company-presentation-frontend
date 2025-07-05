import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { ToastService, ToastMessage } from '../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast-container.component.html',
  styleUrls: ['./toast-container.component.css']
})
export class ToastContainerComponent implements OnInit {
  toasts$: Observable<ToastMessage[]>;

  constructor(private toastService: ToastService) {
    this.toasts$ = this.toastService.getToasts();
  }

  ngOnInit() {}

  removeToast(id: string) {
    this.toastService.removeToast(id);
  }

  getToastClass(type: string): string {
    switch (type) {
      case 'success': return 'bg-success text-white';
      case 'error': return 'bg-danger text-white';
      case 'warning': return 'bg-warning text-dark';
      case 'info': return 'bg-info text-white';
      default: return 'bg-secondary text-white';
    }
  }

  getIconClass(type: string): string {
    switch (type) {
      case 'success': return 'bi bi-check-circle-fill text-dark';
      case 'error': return 'bi bi-exclamation-triangle-fill text-white';
      case 'warning': return 'bi bi-exclamation-triangle-fill text-dark';
      case 'info': return 'bi bi-info-circle-fill text-dark';
      default: return 'bi bi-bell-fill text-white';
    }
  }

  getTimeAgo(timestamp: Date): string {
    const now = new Date();
    const diff = Math.floor((now.getTime() - timestamp.getTime()) / 1000);
    
    if (diff < 60) return 'сейчас';
    if (diff < 3600) return `${Math.floor(diff / 60)} мин. назад`;
    return `${Math.floor(diff / 3600)} ч. назад`;
  }
} 