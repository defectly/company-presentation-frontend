import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-delete-confirmation-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './delete-confirmation-modal.component.html',
  styleUrl: './delete-confirmation-modal.component.css'
})
export class DeleteConfirmationModalComponent {
  @Input() isVisible = false;
  @Input() employeeName = '';
  @Input() isLoading = false;
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
} 