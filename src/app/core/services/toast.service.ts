import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toasts$ = new BehaviorSubject<ToastMessage[]>([]);

  getToasts() {
    return this.toasts$.asObservable();
  }

  showSuccess(title: string, message: string) {
    this.addToast('success', title, message);
  }

  showError(title: string, message: string) {
    this.addToast('error', title, message);
  }

  showWarning(title: string, message: string) {
    this.addToast('warning', title, message);
  }

  showInfo(title: string, message: string) {
    this.addToast('info', title, message);
  }

  private addToast(type: ToastMessage['type'], title: string, message: string) {
    const toast: ToastMessage = {
      id: Date.now().toString(),
      type,
      title,
      message,
      timestamp: new Date()
    };

    const currentToasts = this.toasts$.value;
    this.toasts$.next([...currentToasts, toast]);

    setTimeout(() => {
      this.removeToast(toast.id);
    }, 5000);
  }

  removeToast(id: string) {
    const currentToasts = this.toasts$.value;
    const updatedToasts = currentToasts.filter(toast => toast.id !== id);
    this.toasts$.next(updatedToasts);
  }
} 