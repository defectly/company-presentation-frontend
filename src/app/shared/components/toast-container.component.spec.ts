import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { ToastContainerComponent } from './toast-container.component';
import { ToastService, ToastMessage } from '../../core/services/toast.service';

describe('ToastContainerComponent', () => {
  let component: ToastContainerComponent;
  let fixture: ComponentFixture<ToastContainerComponent>;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let toastsSubject: BehaviorSubject<ToastMessage[]>;

  const mockToasts: ToastMessage[] = [
    {
      id: '1',
      type: 'success',
      title: 'Success',
      message: 'Operation completed successfully',
      timestamp: new Date('2023-01-01T10:00:00Z')
    },
    {
      id: '2',
      type: 'error',
      title: 'Error',
      message: 'Something went wrong',
      timestamp: new Date('2023-01-01T10:01:00Z')
    }
  ];

  beforeEach(async () => {
    toastsSubject = new BehaviorSubject<ToastMessage[]>([]);
    const toastSpy = jasmine.createSpyObj('ToastService', ['getToasts', 'removeToast']);
    toastSpy.getToasts.and.returnValue(toastsSubject.asObservable());

    await TestBed.configureTestingModule({
      imports: [ToastContainerComponent],
      providers: [
        { provide: ToastService, useValue: toastSpy }
      ]
    }).compileComponents();

    mockToastService = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
    fixture = TestBed.createComponent(ToastContainerComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display toasts', () => {
    toastsSubject.next(mockToasts);
    fixture.detectChanges();

    const toastElements = fixture.nativeElement.querySelectorAll('.toast');
    expect(toastElements.length).toBe(2);
  });

  it('should display success toast with correct styling', () => {
    toastsSubject.next([mockToasts[0]]);
    fixture.detectChanges();

    const toast = fixture.nativeElement.querySelector('.toast');
    expect(toast.classList.contains('bg-success')).toBe(true);
    expect(toast.classList.contains('text-white')).toBe(true);
  });

  it('should display error toast with correct styling', () => {
    toastsSubject.next([mockToasts[1]]);
    fixture.detectChanges();

    const toast = fixture.nativeElement.querySelector('.toast');
    expect(toast.classList.contains('bg-danger')).toBe(true);
    expect(toast.classList.contains('text-white')).toBe(true);
  });

  it('should call removeToast when close button is clicked', () => {
    toastsSubject.next([mockToasts[0]]);
    fixture.detectChanges();

    const closeButton = fixture.nativeElement.querySelector('.btn-close');
    closeButton.click();

    expect(mockToastService.removeToast).toHaveBeenCalledWith('1');
  });

  it('should return correct CSS class for each toast type', () => {
    expect(component.getToastClass('success')).toBe('bg-success text-white');
    expect(component.getToastClass('error')).toBe('bg-danger text-white');
    expect(component.getToastClass('warning')).toBe('bg-warning text-dark');
    expect(component.getToastClass('info')).toBe('bg-info text-white');
    expect(component.getToastClass('unknown')).toBe('bg-secondary text-white');
  });

  it('should return correct icon class for each toast type', () => {
    expect(component.getIconClass('success')).toBe('bi bi-check-circle-fill text-dark');
    expect(component.getIconClass('error')).toBe('bi bi-exclamation-triangle-fill text-white');
    expect(component.getIconClass('warning')).toBe('bi bi-exclamation-triangle-fill text-dark');
    expect(component.getIconClass('info')).toBe('bi bi-info-circle-fill text-dark');
    expect(component.getIconClass('unknown')).toBe('bi bi-bell-fill text-white');
  });

  it('should format time correctly', () => {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const recent = new Date(now.getTime() - 30 * 1000);

    expect(component.getTimeAgo(recent)).toBe('сейчас');
    expect(component.getTimeAgo(oneMinuteAgo)).toBe('1 мин. назад');
    expect(component.getTimeAgo(oneHourAgo)).toBe('1 ч. назад');
  });
}); 