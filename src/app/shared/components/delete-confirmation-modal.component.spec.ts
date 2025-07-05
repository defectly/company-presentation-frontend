import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DeleteConfirmationModalComponent } from './delete-confirmation-modal.component';

describe('DeleteConfirmationModalComponent', () => {
  let component: DeleteConfirmationModalComponent;
  let fixture: ComponentFixture<DeleteConfirmationModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeleteConfirmationModalComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(DeleteConfirmationModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
      expect(component.isVisible).toBe(false);
      expect(component.employeeName).toBe('');
      expect(component.isLoading).toBe(false);
    });
  });

  describe('Modal Visibility', () => {
    it('should show modal when isVisible is true', () => {
      component.isVisible = true;
      fixture.detectChanges();
      
      const modal = fixture.nativeElement.querySelector('.modal');
      expect(modal.classList.contains('show')).toBe(true);
      expect(modal.style.display).toBe('block');
      
      const backdrop = fixture.nativeElement.querySelector('.modal-backdrop');
      expect(backdrop).toBeTruthy();
      expect(backdrop.classList.contains('show')).toBe(true);
    });

    it('should hide modal when isVisible is false', () => {
      component.isVisible = false;
      fixture.detectChanges();
      
      const modal = fixture.nativeElement.querySelector('.modal');
      expect(modal.classList.contains('show')).toBe(false);
      expect(modal.style.display).toBe('none');
      
      const backdrop = fixture.nativeElement.querySelector('.modal-backdrop');
      expect(backdrop).toBeFalsy();
    });
  });

  describe('Employee Name Display', () => {
    it('should display employee name when provided', () => {
      component.employeeName = 'John Doe';
      fixture.detectChanges();
      
      const nameElement = fixture.nativeElement.querySelector('.text-muted');
      expect(nameElement.textContent.trim()).toBe('John Doe');
    });

    it('should not display name element when no name provided', () => {
      component.employeeName = '';
      fixture.detectChanges();
      
      const nameElement = fixture.nativeElement.querySelector('.text-muted');
      expect(nameElement).toBeFalsy();
    });
  });

  describe('Loading State', () => {
    it('should disable buttons when loading', () => {
      component.isLoading = true;
      fixture.detectChanges();
      
      const cancelButton = fixture.nativeElement.querySelector('.btn-secondary');
      const deleteButton = fixture.nativeElement.querySelector('.btn-danger');
      
      expect(cancelButton.disabled).toBe(true);
      expect(deleteButton.disabled).toBe(true);
    });

    it('should show loading text when loading', () => {
      component.isLoading = true;
      fixture.detectChanges();
      
      const deleteButton = fixture.nativeElement.querySelector('.btn-danger');
      expect(deleteButton.textContent.trim()).toBe('Удаление...');
    });

    it('should enable buttons when not loading', () => {
      component.isLoading = false;
      fixture.detectChanges();
      
      const cancelButton = fixture.nativeElement.querySelector('.btn-secondary');
      const deleteButton = fixture.nativeElement.querySelector('.btn-danger');
      
      expect(cancelButton.disabled).toBe(false);
      expect(deleteButton.disabled).toBe(false);
    });

    it('should show normal text when not loading', () => {
      component.isLoading = false;
      fixture.detectChanges();
      
      const deleteButton = fixture.nativeElement.querySelector('.btn-danger');
      expect(deleteButton.textContent.trim()).toBe('Удалить');
    });
  });

  describe('Event Emissions', () => {
    it('should emit confirm event when delete button clicked', () => {
      spyOn(component.confirm, 'emit');
      
      const deleteButton = fixture.nativeElement.querySelector('.btn-danger');
      deleteButton.click();
      
      expect(component.confirm.emit).toHaveBeenCalled();
    });

    it('should emit cancel event when cancel button clicked', () => {
      spyOn(component.cancel, 'emit');
      
      const cancelButton = fixture.nativeElement.querySelector('.btn-secondary');
      cancelButton.click();
      
      expect(component.cancel.emit).toHaveBeenCalled();
    });

    it('should emit cancel event when close button clicked', () => {
      spyOn(component.cancel, 'emit');
      
      const closeButton = fixture.nativeElement.querySelector('.btn-close');
      closeButton.click();
      
      expect(component.cancel.emit).toHaveBeenCalled();
    });
  });

  describe('Modal Content', () => {
    it('should display correct title', () => {
      const titleElement = fixture.nativeElement.querySelector('.modal-title');
      expect(titleElement.textContent.trim()).toBe('Подтверждение удаления');
    });

    it('should display confirmation message', () => {
      const bodyText = fixture.nativeElement.querySelector('.modal-body p');
      expect(bodyText.textContent.trim()).toBe('Вы уверены, что хотите удалить сотрудника?');
    });

    it('should have cancel button with correct text', () => {
      const cancelButton = fixture.nativeElement.querySelector('.btn-secondary');
      expect(cancelButton.textContent.trim()).toBe('Отмена');
    });
  });

  describe('Accessibility', () => {
    it('should have proper modal attributes', () => {
      const modal = fixture.nativeElement.querySelector('.modal');
      expect(modal.getAttribute('tabindex')).toBe('-1');
      expect(modal.getAttribute('role')).toBe('dialog');
      expect(modal.hasAttribute('aria-hidden')).toBe(true);
    });

    it('should use modal-sm size', () => {
      const modalDialog = fixture.nativeElement.querySelector('.modal-dialog');
      expect(modalDialog.classList.contains('modal-sm')).toBe(true);
    });
  });
}); 