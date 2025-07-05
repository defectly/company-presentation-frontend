import { TestBed } from '@angular/core/testing';
import { ToastService, ToastMessage } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should add success toast', () => {
    let toasts: ToastMessage[] = [];
    service.getToasts().subscribe(t => toasts = t);

    service.showSuccess('Success Title', 'Success Message');

    expect(toasts.length).toBe(1);
    expect(toasts[0].type).toBe('success');
    expect(toasts[0].title).toBe('Success Title');
    expect(toasts[0].message).toBe('Success Message');
  });

  it('should add error toast', () => {
    let toasts: ToastMessage[] = [];
    service.getToasts().subscribe(t => toasts = t);

    service.showError('Error Title', 'Error Message');

    expect(toasts.length).toBe(1);
    expect(toasts[0].type).toBe('error');
    expect(toasts[0].title).toBe('Error Title');
    expect(toasts[0].message).toBe('Error Message');
  });

  it('should add warning toast', () => {
    let toasts: ToastMessage[] = [];
    service.getToasts().subscribe(t => toasts = t);

    service.showWarning('Warning Title', 'Warning Message');

    expect(toasts.length).toBe(1);
    expect(toasts[0].type).toBe('warning');
    expect(toasts[0].title).toBe('Warning Title');
    expect(toasts[0].message).toBe('Warning Message');
  });

  it('should add info toast', () => {
    let toasts: ToastMessage[] = [];
    service.getToasts().subscribe(t => toasts = t);

    service.showInfo('Info Title', 'Info Message');

    expect(toasts.length).toBe(1);
    expect(toasts[0].type).toBe('info');
    expect(toasts[0].title).toBe('Info Title');
    expect(toasts[0].message).toBe('Info Message');
  });

  it('should remove toast by id', () => {
    let toasts: ToastMessage[] = [];
    service.getToasts().subscribe(t => toasts = t);

    service.showSuccess('Test', 'Test');
    const toastId = toasts[0].id;

    service.removeToast(toastId);

    expect(toasts.length).toBe(0);
  });

  it('should auto-remove toasts after timeout', (done) => {
    jasmine.clock().install();
    let toasts: ToastMessage[] = [];
    service.getToasts().subscribe(t => toasts = t);

    service.showSuccess('Test', 'Test');
    expect(toasts.length).toBe(1);

    jasmine.clock().tick(5001);
    expect(toasts.length).toBe(0);
    
    jasmine.clock().uninstall();
    done();
  });
}); 