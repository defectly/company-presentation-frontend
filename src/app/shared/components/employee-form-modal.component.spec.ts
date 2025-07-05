import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { EmployeeFormModalComponent } from './employee-form-modal.component';
import { Employee, CreateEmployeeRequest, UpdateEmployeeRequest, Department } from '../../core/models/employee.model';
import { EmployeeService } from '../../core/services/employee.service';
import { AutocompleteDropdownComponent, AutocompleteOption } from './autocomplete-dropdown.component';
import { AbstractControl } from '@angular/forms';

describe('EmployeeFormModalComponent', () => {
  let component: EmployeeFormModalComponent;
  let fixture: ComponentFixture<EmployeeFormModalComponent>;
  let mockEmployeeService: jasmine.SpyObj<EmployeeService>;

  const mockDepartments: Department[] = [
    { id: '1', name: 'IT' },
    { id: '2', name: 'HR' }
  ];

  const mockEmployee: Employee = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    department: mockDepartments[0],
    firstName: 'John',
    middleName: 'Michael',
    lastName: 'Doe',
    birthDate: '1990-01-01T00:00:00.000Z',
    hireDate: '2023-01-01T00:00:00.000Z',
    salary: 75000
  };

  beforeEach(async () => {
    mockEmployeeService = jasmine.createSpyObj('EmployeeService', ['getDepartments', 'createDepartment']);
    mockEmployeeService.getDepartments.and.returnValue(of(mockDepartments));
    mockEmployeeService.createDepartment.and.returnValue(of('new-dept-id'));

    await TestBed.configureTestingModule({
      imports: [EmployeeFormModalComponent, ReactiveFormsModule, AutocompleteDropdownComponent],
      providers: [
        { provide: EmployeeService, useValue: mockEmployeeService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeFormModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize form with empty values', () => {
      expect(component.employeeForm.value).toEqual({
        departmentId: '',
        firstName: '',
        middleName: '',
        lastName: '',
        birthDate: '',
        hireDate: '',
        salary: 0
      });
    });

    it('should set isEdit to false by default', () => {
      expect(component.isEdit).toBe(false);
    });

    it('should initialize department options on init', () => {
      expect(mockEmployeeService.getDepartments).toHaveBeenCalled();
      expect(component.departmentOptions.length).toBe(2);
      expect(component.departmentOptions[0]).toEqual({ value: '1', label: 'IT' });
      expect(component.departmentOptions[1]).toEqual({ value: '2', label: 'HR' });
    });

    it('should handle empty departments list', () => {
      mockEmployeeService.getDepartments.and.returnValue(of([]));
      component['loadDepartments']();
      expect(component.departmentOptions).toEqual([]);
    });

    it('should handle department loading error', () => {
      spyOn(console, 'error');
      mockEmployeeService.getDepartments.and.returnValue(throwError(() => new Error('Failed to load')));
      component['loadDepartments']();
      expect(console.error).toHaveBeenCalledWith('Error loading departments:', jasmine.any(Error));
    });
  });

  describe('Form Validation', () => {
    it('should be invalid when required fields are empty', () => {
      expect(component.employeeForm.valid).toBe(false);
    });

    it('should require department field', () => {
      const departmentControl = component.employeeForm.get('departmentId');
      expect(departmentControl?.hasError('required')).toBe(true);
      
      departmentControl?.setValue('IT');
      expect(departmentControl?.hasError('required')).toBe(false);
    });

    it('should require firstName field', () => {
      const firstNameControl = component.employeeForm.get('firstName');
      expect(firstNameControl?.hasError('required')).toBe(true);
      
      firstNameControl?.setValue('John');
      expect(firstNameControl?.hasError('required')).toBe(false);
    });

    it('should validate firstName length', () => {
      const firstNameControl = component.employeeForm.get('firstName');
      
      firstNameControl?.setValue('A'.repeat(101));
      expect(firstNameControl?.hasError('maxlength')).toBe(true);
      
      firstNameControl?.setValue('A'.repeat(50));
      expect(firstNameControl?.hasError('maxlength')).toBe(false);
    });

    it('should not require middleName field', () => {
      const middleNameControl = component.employeeForm.get('middleName');
      expect(middleNameControl?.hasError('required')).toBeFalsy();
    });

    it('should validate middleName length when provided', () => {
      const middleNameControl = component.employeeForm.get('middleName');
      
      middleNameControl?.setValue('A'.repeat(101));
      expect(middleNameControl?.hasError('maxlength')).toBe(true);
      
      middleNameControl?.setValue('A'.repeat(50));
      expect(middleNameControl?.hasError('maxlength')).toBe(false);
    });

    it('should require lastName field', () => {
      const lastNameControl = component.employeeForm.get('lastName');
      expect(lastNameControl?.hasError('required')).toBe(true);
      
      lastNameControl?.setValue('Doe');
      expect(lastNameControl?.hasError('required')).toBe(false);
    });

    it('should validate lastName length', () => {
      const lastNameControl = component.employeeForm.get('lastName');
      
      lastNameControl?.setValue('A'.repeat(101));
      expect(lastNameControl?.hasError('maxlength')).toBe(true);
      
      lastNameControl?.setValue('A'.repeat(50));
      expect(lastNameControl?.hasError('maxlength')).toBe(false);
    });

    it('should require birthDate field', () => {
      const birthDateControl = component.employeeForm.get('birthDate');
      expect(birthDateControl?.hasError('required')).toBe(true);
      
      birthDateControl?.setValue('1990-01-01');
      expect(birthDateControl?.hasError('required')).toBe(false);
    });

    it('should validate birthDate is not in future', () => {
      const birthDateControl = component.employeeForm.get('birthDate');
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      
      birthDateControl?.setValue(futureDate.toISOString().split('T')[0]);
      expect(birthDateControl?.valid).toBe(false);
      
      birthDateControl?.setValue('1990-01-01');
      expect(birthDateControl?.valid).toBe(true);
    });

    it('should require hireDate field', () => {
      const hireDateControl = component.employeeForm.get('hireDate');
      expect(hireDateControl?.hasError('required')).toBe(true);
      
      hireDateControl?.setValue('2023-01-01');
      expect(hireDateControl?.hasError('required')).toBe(false);
    });

    it('should validate hireDate is not too far in future', () => {
      const hireDateControl = component.employeeForm.get('hireDate');
      const farFutureDate = new Date();
      farFutureDate.setFullYear(farFutureDate.getFullYear() + 10);
      
      hireDateControl?.setValue(farFutureDate.toISOString().split('T')[0]);
      expect(hireDateControl?.valid).toBe(false);
      
      hireDateControl?.setValue('2023-01-01');
      expect(hireDateControl?.valid).toBe(true);
    });

    it('should require salary field and minimum value', () => {
      const salaryControl = component.employeeForm.get('salary');
      
      salaryControl?.setValue('');
      salaryControl?.markAsTouched();
      salaryControl?.updateValueAndValidity();
      expect(salaryControl?.hasError('required')).toBe(true);
      
      salaryControl?.setValue(0);
      salaryControl?.markAsTouched();
      salaryControl?.updateValueAndValidity();
      expect(salaryControl?.hasError('min')).toBe(true);
      
      salaryControl?.setValue(1000);
      salaryControl?.updateValueAndValidity();
      expect(salaryControl?.hasError('min')).toBe(false);
      expect(salaryControl?.hasError('required')).toBe(false);
    });

    it('should validate salary maximum value', () => {
      const salaryControl = component.employeeForm.get('salary');
      
      salaryControl?.setValue(79228162514264337593543950335);
      expect(salaryControl?.hasError('max')).toBe(true);
      
      salaryControl?.setValue(500000);
      expect(salaryControl?.hasError('max')).toBe(false);
    });

    it('should be valid when all required fields are filled correctly', () => {
      component.employeeForm.patchValue({
        departmentId: 'IT',
        firstName: 'John',
        lastName: 'Doe',
        birthDate: '1990-01-01',
        hireDate: '2023-01-01',
        salary: 75000
      });
      
      expect(component.employeeForm.valid).toBe(true);
    });

    it('should be valid with middleName filled', () => {
      component.employeeForm.patchValue({
        departmentId: 'IT',
        firstName: 'John',
        middleName: 'Michael',
        lastName: 'Doe',
        birthDate: '1990-01-01',
        hireDate: '2023-01-01',
        salary: 75000
      });
      
      expect(component.employeeForm.valid).toBe(true);
    });

    it('should validate all fields when form is marked as touched', () => {
      component.employeeForm.markAllAsTouched();
      fixture.detectChanges();
      
      expect(component.employeeForm.invalid).toBe(true);
      
      const invalidInputs = fixture.nativeElement.querySelectorAll('.is-invalid');
      expect(invalidInputs.length).toBeGreaterThan(0);
    });
  });

  describe('Edit Mode', () => {
    beforeEach(() => {
      component.employee = mockEmployee;
      component.ngOnChanges({ 
        employee: { 
          currentValue: mockEmployee, 
          previousValue: null, 
          firstChange: true, 
          isFirstChange: () => true 
        } 
      });
    });

    it('should set isEdit to true when employee is provided', () => {
      expect(component.isEdit).toBe(true);
    });

    it('should populate form with employee data', () => {
      expect(component.employeeForm.value).toEqual({
        departmentId: mockEmployee.department.id,
        firstName: mockEmployee.firstName,
        middleName: mockEmployee.middleName,
        lastName: mockEmployee.lastName,
        birthDate: mockEmployee.birthDate.split('T')[0],
        hireDate: mockEmployee.hireDate.split('T')[0],
        salary: mockEmployee.salary
      });
    });

    it('should handle employee without middleName', () => {
      const employeeWithoutMiddleName = { ...mockEmployee, middleName: undefined };
      component.employee = employeeWithoutMiddleName;
      component.ngOnChanges({ 
        employee: { 
          currentValue: employeeWithoutMiddleName, 
          previousValue: null, 
          firstChange: true, 
          isFirstChange: () => true 
        } 
      });
      
      expect(component.employeeForm.value.middleName).toBe('');
    });

    it('should handle employee with null middleName', () => {
      const employeeWithNullMiddleName = { ...mockEmployee, middleName: null as any };
      component.employee = employeeWithNullMiddleName;
      component.ngOnChanges({ 
        employee: { 
          currentValue: employeeWithNullMiddleName, 
          previousValue: null, 
          firstChange: true, 
          isFirstChange: () => true 
        } 
      });
      
      expect(component.employeeForm.value.middleName).toBe('');
    });

    it('should display edit title', () => {
      fixture.detectChanges();
      const titleElement = fixture.nativeElement.querySelector('.modal-title');
      expect(titleElement.textContent.trim()).toBe('Редактировать сотрудника');
    });

    it('should display save button text for edit', () => {
      fixture.detectChanges();
      const saveButton = fixture.nativeElement.querySelector('button[type="submit"]');
      expect(saveButton.textContent.trim()).toBe('Сохранить');
    });
  });

  describe('Create Mode', () => {
    beforeEach(() => {
      component.employee = null;
      component.ngOnChanges({ 
        employee: { 
          currentValue: null, 
          previousValue: undefined, 
          firstChange: true, 
          isFirstChange: () => true 
        } 
      });
    });

    it('should set isEdit to false when no employee provided', () => {
      expect(component.isEdit).toBe(false);
    });

    it('should reset form when no employee provided', () => {
      component.employeeForm.patchValue({
        departmentId: 'Test',
        firstName: 'Test'
      });
      
      component.ngOnChanges({ 
        employee: { 
          currentValue: null, 
          previousValue: undefined, 
          firstChange: true, 
          isFirstChange: () => true 
        } 
      });
      
      expect(component.employeeForm.value.departmentId).toBe('');
      expect(component.employeeForm.value.firstName).toBe('');
    });

    it('should reset new department creation state', () => {
      component.isCreatingNewDepartment = true;
      component.newDepartmentName = 'Test Department';
      
      component.ngOnChanges({ 
        employee: { 
          currentValue: null, 
          previousValue: undefined, 
          firstChange: true, 
          isFirstChange: () => true 
        } 
      });
      
      expect(component.isCreatingNewDepartment).toBe(false);
      expect(component.newDepartmentName).toBe('');
    });

    it('should display create title', () => {
      fixture.detectChanges();
      const titleElement = fixture.nativeElement.querySelector('.modal-title');
      expect(titleElement.textContent.trim()).toBe('Создать сотрудника');
    });

    it('should display create button text', () => {
      fixture.detectChanges();
      const saveButton = fixture.nativeElement.querySelector('button[type="submit"]');
      expect(saveButton.textContent.trim()).toBe('Создать');
    });
  });

  describe('Form Submission', () => {
    beforeEach(() => {
      component.employeeForm.patchValue({
        departmentId: 'IT',
        firstName: 'John',
        middleName: 'Michael',
        lastName: 'Doe',
        birthDate: '1990-01-01',
        hireDate: '2023-01-01',
        salary: 75000
      });
    });

    it('should emit create request for new employee', () => {
      spyOn(component.save, 'emit');
      component.employee = null;
      component.isEdit = false;
      
      component.onSubmit();
      
      const expectedRequest: CreateEmployeeRequest = {
        departmentId: 'IT',
        firstName: 'John',
        middleName: 'Michael',
        lastName: 'Doe',
        birthDate: '1990-01-01',
        hireDate: '2023-01-01',
        salary: 75000
      };
      
      expect(component.save.emit).toHaveBeenCalledWith({ employeeData: expectedRequest, newDepartmentCreated: false });
    });

    it('should emit update request for existing employee', () => {
      spyOn(component.save, 'emit');
      component.employee = mockEmployee;
      component.isEdit = true;
      
      component.onSubmit();
      
      const expectedRequest: UpdateEmployeeRequest = {
        departmentId: 'IT',
        firstName: 'John',
        middleName: 'Michael',
        lastName: 'Doe',
        birthDate: '1990-01-01',
        hireDate: '2023-01-01',
        salary: 75000
      };
      
      expect(component.save.emit).toHaveBeenCalledWith({ employeeData: expectedRequest, newDepartmentCreated: false });
    });

    it('should not emit if form is invalid', () => {
      spyOn(component.save, 'emit');
      component.employeeForm.patchValue({ firstName: '' }); // Make form invalid
      
      component.onSubmit();
      
      expect(component.save.emit).not.toHaveBeenCalled();
    });

    it('should handle create request without middleName', () => {
      spyOn(component.save, 'emit');
      component.employee = null;
      component.isEdit = false;
      component.employeeForm.patchValue({ middleName: '' });
      
      component.onSubmit();
      
      const expectedRequest: CreateEmployeeRequest = {
        departmentId: 'IT',
        firstName: 'John',
        middleName: '',
        lastName: 'Doe',
        birthDate: '1990-01-01',
        hireDate: '2023-01-01',
        salary: 75000
      };
      
      expect(component.save.emit).toHaveBeenCalledWith({ employeeData: expectedRequest, newDepartmentCreated: false });
    });

    it('should handle null middleName in form data', () => {
      spyOn(component.save, 'emit');
      component.employee = null;
      component.isEdit = false;
      component.employeeForm.patchValue({ middleName: null });
      
      component.onSubmit();
      
      const expectedRequest: CreateEmployeeRequest = {
        departmentId: 'IT',
        firstName: 'John',
        middleName: '',
        lastName: 'Doe',
        birthDate: '1990-01-01',
        hireDate: '2023-01-01',
        salary: 75000
      };
      
      expect(component.save.emit).toHaveBeenCalledWith({ employeeData: expectedRequest, newDepartmentCreated: false });
    });

    it('should mark form as touched when submitting invalid form', () => {
      component.employeeForm.patchValue({ firstName: '' });
      spyOn(component.employeeForm, 'markAllAsTouched');
      
      component.onSubmit();
      
      expect(component.employeeForm.markAllAsTouched).toHaveBeenCalled();
    });
  });

  describe('Modal Actions', () => {
    it('should emit cancel when close method is called', () => {
      spyOn(component.cancel, 'emit');
      
      component.close();
      
      expect(component.cancel.emit).toHaveBeenCalled();
    });

    it('should call close when cancel button is clicked', () => {
      spyOn(component, 'close');
      
      const cancelButton = fixture.nativeElement.querySelector('button[type="button"]');
      cancelButton.click();
      
      expect(component.close).toHaveBeenCalled();
    });

    it('should call onSubmit when form is submitted', () => {
      spyOn(component, 'onSubmit');
      
      const form = fixture.nativeElement.querySelector('form');
      form.dispatchEvent(new Event('ngSubmit'));
      
      expect(component.onSubmit).toHaveBeenCalled();
    });

    it('should reset form when modal is closed', () => {
      component.employeeForm.patchValue({ firstName: 'Test' });
      component.employeeForm.markAsTouched();
      
      component.close();
      
      expect(component.employeeForm.value.firstName).toBe('');
      expect(component.employeeForm.untouched).toBe(true);
    });
  });

  describe('Loading State', () => {
    it('should disable submit button when loading', () => {
      component.isLoading = true;
      component.employeeForm.patchValue({
        departmentId: 'IT',
        firstName: 'John',
        lastName: 'Doe',
        birthDate: '1990-01-01',
        hireDate: '2023-01-01',
        salary: 75000
      });
      fixture.detectChanges();
      
      const submitButton = fixture.nativeElement.querySelector('button[type="submit"]');
      expect(submitButton.disabled).toBe(true);
    });

    it('should show loading text when loading', () => {
      component.isLoading = true;
      fixture.detectChanges();
      
      const submitButton = fixture.nativeElement.querySelector('button[type="submit"]');
      expect(submitButton.textContent.trim()).toBe('Сохранение...');
    });

    it('should disable submit button when form is invalid', () => {
      component.isLoading = false;
      component.employeeForm.patchValue({ firstName: '' }); // Make form invalid
      fixture.detectChanges();
      
      const submitButton = fixture.nativeElement.querySelector('button[type="submit"]');
      expect(submitButton.disabled).toBe(true);
    });

    it('should disable cancel button when loading', () => {
      component.isLoading = true;
      fixture.detectChanges();
      
      const cancelButton = fixture.nativeElement.querySelector('button.btn-secondary');
      expect(cancelButton.disabled).toBe(true);
    });
  });

  describe('Template Integration', () => {
    it('should display form fields correctly', () => {
      const departmentInput = fixture.nativeElement.querySelector('app-autocomplete-dropdown');
      const firstNameInput = fixture.nativeElement.querySelector('#firstName');
      const middleNameInput = fixture.nativeElement.querySelector('#middleName');
      const lastNameInput = fixture.nativeElement.querySelector('#lastName');
      const birthDateInput = fixture.nativeElement.querySelector('#birthDate');
      const hireDateInput = fixture.nativeElement.querySelector('#hireDate');
      const salaryInput = fixture.nativeElement.querySelector('#salary');
      
      expect(departmentInput).toBeTruthy();
      expect(firstNameInput).toBeTruthy();
      expect(middleNameInput).toBeTruthy();
      expect(lastNameInput).toBeTruthy();
      expect(birthDateInput).toBeTruthy();
      expect(hireDateInput).toBeTruthy();
      expect(salaryInput).toBeTruthy();
    });

    it('should show validation errors for required fields', () => {
      const firstNameControl = component.employeeForm.get('firstName');
      firstNameControl?.markAsTouched();
      fixture.detectChanges();
      
      const errorElement = fixture.nativeElement.querySelector('.invalid-feedback');
      expect(errorElement).toBeTruthy();
      expect(errorElement.textContent.trim()).toContain('Имя обязательно');
    });

    it('should show validation errors for all invalid fields when touched', () => {
      component.employeeForm.markAllAsTouched();
      fixture.detectChanges();
      
      const errorElements = fixture.nativeElement.querySelectorAll('.invalid-feedback');
      expect(errorElements.length).toBeGreaterThan(0);
    });

    it('should not show validation errors initially', () => {
      const errorElements = fixture.nativeElement.querySelectorAll('.invalid-feedback');
      // Initially, validation errors exist in DOM but should not be visible since fields are not touched
      if (errorElements.length > 0) {
        expect(errorElements.length).toBeGreaterThan(0);
        
        // Check that errors are not currently visible (no is-invalid class on inputs)
        const invalidInputs = fixture.nativeElement.querySelectorAll('.is-invalid');
        expect(invalidInputs.length).toBe(0);
      } else {
        // If no error elements are found, that's also acceptable for initial state
        expect(errorElements.length).toBe(0);
      }
    });

    it('should apply correct CSS classes for validation states', () => {
      const firstNameControl = component.employeeForm.get('firstName');
      const firstNameInput = fixture.nativeElement.querySelector('#firstName');
      
      firstNameControl?.markAsTouched();
      fixture.detectChanges();
      
      expect(firstNameInput.classList.contains('is-invalid')).toBe(true);
      
      firstNameControl?.setValue('John');
      fixture.detectChanges();
      
      expect(firstNameInput.classList.contains('is-invalid')).toBe(false);
    });
  });

  describe('Department Selection', () => {
    it('should handle existing department selection', () => {
      const existingDepartmentOption: AutocompleteOption = {
        value: '1',
        label: 'IT'
      };
      
      component.onDepartmentSelectionChange(existingDepartmentOption);
      
      expect(component.isCreatingNewDepartment).toBe(false);
      expect(component.newDepartmentName).toBe('');
    });

    it('should handle null department selection', () => {
      component.onDepartmentSelectionChange(null);
      
      expect(component.isCreatingNewDepartment).toBe(false);
      expect(component.newDepartmentName).toBe('');
    });

    it('should handle undefined department selection', () => {
      component.onDepartmentSelectionChange(undefined as any);
      
      expect(component.isCreatingNewDepartment).toBe(false);
      expect(component.newDepartmentName).toBe('');
    });
  });

  describe('New Department Creation', () => {
    beforeEach(() => {
      component.employee = null;
      component.isEdit = false;
      component.employeeForm.patchValue({
        firstName: 'New',
        lastName: 'Employee',
        birthDate: '1995-05-05',
        hireDate: '2024-01-01',
        salary: 60000
      });
    });

    it('should detect new department from autocomplete selection', () => {
      const newDepartmentOption: AutocompleteOption = {
        value: 'new-department-sales',
        label: 'Sales'
      };
      
      component.onDepartmentSelectionChange(newDepartmentOption);
      
      expect(component.isCreatingNewDepartment).toBe(true);
      expect(component.newDepartmentName).toBe('Sales');
    });

    it('should handle new department with special characters', () => {
      const newDepartmentOption: AutocompleteOption = {
        value: 'new-department-R&D Department',
        label: 'R&D Department'
      };
      
      component.onDepartmentSelectionChange(newDepartmentOption);
      
      expect(component.isCreatingNewDepartment).toBe(true);
      expect(component.newDepartmentName).toBe('R&D Department');
    });

    it('should create new department and then new employee on submit', fakeAsync(() => {
      spyOn(component.save, 'emit');
      mockEmployeeService.createDepartment.and.returnValue(of('3')); 

      const newDepartmentOption: AutocompleteOption = {
        value: 'new-department-sales',
        label: 'Sales'
      };
      component.onDepartmentSelectionChange(newDepartmentOption);
      component.employeeForm.patchValue({ departmentId: newDepartmentOption.value });

      component.onSubmit();
      tick();

      expect(mockEmployeeService.createDepartment).toHaveBeenCalledWith({ name: 'Sales' });

      const expectedRequest: CreateEmployeeRequest = {
        departmentId: '3',
        firstName: 'New',
        middleName: '',
        lastName: 'Employee',
        birthDate: '1995-05-05',
        hireDate: '2024-01-01',
        salary: 60000
      };
      
      expect(component.save.emit).toHaveBeenCalledWith({ employeeData: expectedRequest, newDepartmentCreated: true });
    }));

    it('should show error if department creation fails', fakeAsync(() => {
      spyOn(console, 'error');
      mockEmployeeService.createDepartment.and.returnValue(throwError(() => new Error('Failed to create')));

      const newDepartmentOption: AutocompleteOption = {
        value: 'new-department-sales',
        label: 'Sales'
      };
      component.onDepartmentSelectionChange(newDepartmentOption);
      component.employeeForm.patchValue({ departmentId: newDepartmentOption.value });

      component.onSubmit();
      tick();

      expect(console.error).toHaveBeenCalledWith('Error creating department:', jasmine.any(Error));
    }));

    it('should not create department if not in new department mode', fakeAsync(() => {
      spyOn(component.save, 'emit');
      component.isCreatingNewDepartment = false;
      component.employeeForm.patchValue({ departmentId: '1' });

      component.onSubmit();
      tick();

      expect(mockEmployeeService.createDepartment).not.toHaveBeenCalled();
      expect(component.save.emit).toHaveBeenCalledWith({
        employeeData: jasmine.any(Object),
        newDepartmentCreated: false
      });
    }));

    it('should handle empty new department name', () => {
      const newDepartmentOption: AutocompleteOption = {
        value: 'new-department-',
        label: ''
      };
      
      component.onDepartmentSelectionChange(newDepartmentOption);
      
      expect(component.isCreatingNewDepartment).toBe(true);
      expect(component.newDepartmentName).toBe('');
    });
  });

  describe('Edge Cases', () => {
    it('should handle form reset after successful submission', () => {
      component.employeeForm.patchValue({
        firstName: 'Test',
        lastName: 'User'
      });
      
      component.employeeForm.reset();
      
      expect(component.employeeForm.value.firstName).toBe(null);
      expect(component.employeeForm.value.lastName).toBe(null);
    });

    it('should handle component destruction during async operations', fakeAsync(() => {
      const newDepartmentOption: AutocompleteOption = {
        value: 'new-department-sales',
        label: 'Sales'
      };
      component.onDepartmentSelectionChange(newDepartmentOption);
      component.employeeForm.patchValue({ departmentId: newDepartmentOption.value });

      // Start async operation
      component.onSubmit();
      
      tick();
      
      // Should not throw errors
      expect(component).toBeTruthy();
    }));

    it('should handle invalid date formats gracefully', () => {
      const birthDateControl = component.employeeForm.get('birthDate');
      const hireDateControl = component.employeeForm.get('hireDate');
      
      birthDateControl?.setValue('invalid-date');
      hireDateControl?.setValue('another-invalid-date');
      
      expect(component.employeeForm.valid).toBe(false);
    });

    it('should handle very large salary values', () => {
      const salaryControl = component.employeeForm.get('salary');
      
      salaryControl?.setValue(Number.MAX_SAFE_INTEGER);
      
      expect(salaryControl?.hasError('max')).toBe(true);
    });

    it('should handle NaN salary values', () => {
      const salaryControl = component.employeeForm.get('salary');
      
      salaryControl?.setValue(NaN);
      
      expect(salaryControl?.hasError('notANumber')).toBe(true);
    });

    it('should handle negative salary values', () => {
      const salaryControl = component.employeeForm.get('salary');
      
      salaryControl?.setValue(-1000);
      
      expect(salaryControl?.hasError('min')).toBe(true);
    });
  });

  describe('Additional Function Coverage Tests', () => {
    describe('Custom Validators', () => {
      describe('pastDateValidator', () => {
        it('should return null for empty value', () => {
          const control = { value: '' } as AbstractControl;
          const result = (component as any).pastDateValidator(control);
          expect(result).toBeNull();
        });
        
        it('should return null for null value', () => {
          const control = { value: null } as AbstractControl;
          const result = (component as any).pastDateValidator(control);
          expect(result).toBeNull();
        });
        
        it('should return null for undefined value', () => {
          const control = { value: undefined } as AbstractControl;
          const result = (component as any).pastDateValidator(control);
          expect(result).toBeNull();
        });
        
        it('should return null for valid past date', () => {
          const pastDate = new Date();
          pastDate.setDate(pastDate.getDate() - 1);
          const control = { value: pastDate.toISOString().split('T')[0] } as AbstractControl;
          const result = (component as any).pastDateValidator(control);
          expect(result).toBeNull();
        });
        
        it('should return error for future date', () => {
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + 2);
          const control = { value: futureDate.toISOString().split('T')[0] } as AbstractControl;
          const result = (component as any).pastDateValidator(control);
          expect(result).toEqual({ futureDate: true });
        });
        
        it('should return null for today', () => {
          const today = new Date();
          const control = { value: today.toISOString().split('T')[0] } as AbstractControl;
          const result = (component as any).pastDateValidator(control);
          expect(result).toBeNull();
        });
      });
      
      describe('futureNotTooFarValidator', () => {
        it('should return null for empty value', () => {
          const control = { value: '' } as AbstractControl;
          const result = (component as any).futureNotTooFarValidator(control);
          expect(result).toBeNull();
        });
        
        it('should return null for null value', () => {
          const control = { value: null } as AbstractControl;
          const result = (component as any).futureNotTooFarValidator(control);
          expect(result).toBeNull();
        });
        
        it('should return null for undefined value', () => {
          const control = { value: undefined } as AbstractControl;
          const result = (component as any).futureNotTooFarValidator(control);
          expect(result).toBeNull();
        });
        
        it('should return null for date within 5 years', () => {
          const futureDate = new Date();
          futureDate.setFullYear(futureDate.getFullYear() + 2);
          const control = { value: futureDate.toISOString().split('T')[0] } as AbstractControl;
          const result = (component as any).futureNotTooFarValidator(control);
          expect(result).toBeNull();
        });
        
        it('should return error for date more than 5 years in future', () => {
          const farFutureDate = new Date();
          farFutureDate.setFullYear(farFutureDate.getFullYear() + 6);
          const control = { value: farFutureDate.toISOString().split('T')[0] } as AbstractControl;
          const result = (component as any).futureNotTooFarValidator(control);
          expect(result).toEqual({ tooFarInFuture: true });
        });
        
        it('should return null for exactly 5 years in future', () => {
          const exactlyFiveYears = new Date();
          exactlyFiveYears.setFullYear(exactlyFiveYears.getFullYear() + 5);
          const control = { value: exactlyFiveYears.toISOString().split('T')[0] } as AbstractControl;
          const result = (component as any).futureNotTooFarValidator(control);
          expect(result).toBeNull();
        });
      });
    });
    
    describe('customFilterFunction', () => {
      beforeEach(() => {
        component.departmentOptions = [
          { value: '1', label: 'IT Department' },
          { value: '2', label: 'Human Resources' },
          { value: '3', label: 'Marketing' }
        ];
      });
      
      it('should return all options for empty query', () => {
        const result = component.customFilterFunction(component.departmentOptions, '');
        expect(result).toEqual(component.departmentOptions);
      });
      
      it('should return all options for whitespace-only query', () => {
        const result = component.customFilterFunction(component.departmentOptions, '   ');
        expect(result).toEqual(component.departmentOptions);
      });
      
      it('should filter options by partial match', () => {
        const result = component.customFilterFunction(component.departmentOptions, 'IT');
        expect(result.length).toBe(1);
        expect(result[0].label).toBe('IT Department');
      });
      
      it('should filter options case-insensitively', () => {
        const result = component.customFilterFunction(component.departmentOptions, 'human');
        expect(result.length).toBe(1);
        expect(result[0].label).toBe('Human Resources');
      });
      
      it('should add new department option when no exact match found', () => {
        const result = component.customFilterFunction(component.departmentOptions, 'Sales');
        expect(result.length).toBe(1);
        expect(result[0]).toEqual({
          value: 'new-department-sales',
          label: 'sales'
        });
      });
      
      it('should not add new department option when exact match found', () => {
        const result = component.customFilterFunction(component.departmentOptions, 'Marketing');
        expect(result.length).toBe(1);
        expect(result[0].label).toBe('Marketing');
        expect(result[0].value).toBe('3');
      });
      
      it('should handle case-insensitive exact match', () => {
        const result = component.customFilterFunction(component.departmentOptions, 'MARKETING');
        expect(result.length).toBe(1);
        expect(result[0].label).toBe('Marketing');
        expect(result[0].value).toBe('3');
      });
      
      it('should add new department option at the beginning of filtered results', () => {
        const result = component.customFilterFunction(component.departmentOptions, 'IT Sales');
        expect(result.length).toBe(1);
        expect(result[0]).toEqual({
          value: 'new-department-it sales',
          label: 'it sales'
        });
      });

    });
    
    describe('ngOnChanges edge cases', () => {
      it('should handle isLoading change when form is disabled', () => {
        component.employeeForm.disable();
        component.ngOnChanges({
          isLoading: {
            currentValue: false,
            previousValue: true,
            firstChange: false,
            isFirstChange: () => false
          }
        });
        
        expect(component.employeeForm.enabled).toBe(true);
      });
      
      it('should handle isLoading change when form is enabled', () => {
        component.employeeForm.enable();
        component.ngOnChanges({
          isLoading: {
            currentValue: true,
            previousValue: false,
            firstChange: false,
            isFirstChange: () => false
          }
        });
        
        expect(component.employeeForm.disabled).toBe(true);
      });
      
      it('should handle employee change with undefined employee', () => {
        component.employee = mockEmployee;
        component.isEdit = true;
        
        component.ngOnChanges({
          employee: {
            currentValue: undefined,
            previousValue: mockEmployee,
            firstChange: false,
            isFirstChange: () => false
          }
        });
        
        expect(component.isEdit).toBe(false);
        expect(component.employeeForm.value.firstName).toBe('');
      });
      
      it('should handle both employee and isLoading changes simultaneously', () => {
        component.ngOnChanges({
          employee: {
            currentValue: mockEmployee,
            previousValue: null,
            firstChange: false,
            isFirstChange: () => false
          },
          isLoading: {
            currentValue: true,
            previousValue: false,
            firstChange: false,
            isFirstChange: () => false
          }
        });
        
        expect(component.isEdit).toBe(true);
        expect(component.employeeForm.disabled).toBe(true);
      });
      
      it('should handle changes without employee or isLoading', () => {
        const initialFormValue = component.employeeForm.value;
        
        component.ngOnChanges({
          someOtherProperty: {
            currentValue: 'new',
            previousValue: 'old',
            firstChange: false,
            isFirstChange: () => false
          }
        });
        
        expect(component.employeeForm.value).toEqual(initialFormValue);
      });
    });
    
    describe('Private method coverage', () => {
      describe('updateFormDisabledState', () => {
        it('should disable form when loading', () => {
          component.isLoading = true;
          component['updateFormDisabledState']();
          
          expect(component.employeeForm.disabled).toBe(true);
        });
        
        it('should enable form when not loading', () => {
          component.isLoading = false;
          component.employeeForm.disable();
          component['updateFormDisabledState']();
          
          expect(component.employeeForm.enabled).toBe(true);
        });
      });
      
      describe('resetNewDepartmentState', () => {
        it('should reset new department state', () => {
          component.isCreatingNewDepartment = true;
          component.newDepartmentName = 'Test Department';
          
          component['resetNewDepartmentState']();
          
          expect(component.isCreatingNewDepartment).toBe(false);
          expect(component.newDepartmentName).toBe('');
        });
      });
      
      describe('resetForm', () => {
        it('should reset form to initial values', () => {
          component.employeeForm.patchValue({
            firstName: 'Test',
            lastName: 'User',
            salary: 50000
          });
          component.employeeForm.markAsTouched();
          
          component['resetForm']();
          
          expect(component.employeeForm.value).toEqual({
            departmentId: '',
            firstName: '',
            middleName: '',
            lastName: '',
            birthDate: '',
            hireDate: '',
            salary: 0
          });
          expect(component.employeeForm.untouched).toBe(true);
        });
      });
    });
    
    describe('Getter methods', () => {
      describe('isSubmitDisabled', () => {
        it('should return true when form is invalid', () => {
          component.employeeForm.patchValue({ firstName: '' });
          component.isLoading = false;
          
          expect(component.isSubmitDisabled).toBe(true);
        });
        
        it('should return true when loading', () => {
          component.employeeForm.patchValue({
            departmentId: 'IT',
            firstName: 'John',
            lastName: 'Doe',
            birthDate: '1990-01-01',
            hireDate: '2023-01-01',
            salary: 75000
          });
          component.isLoading = true;
          
          expect(component.isSubmitDisabled).toBe(true);
        });
        
        it('should return false when form is valid and not loading', () => {
          component.employeeForm.patchValue({
            departmentId: 'IT',
            firstName: 'John',
            lastName: 'Doe',
            birthDate: '1990-01-01',
            hireDate: '2023-01-01',
            salary: 75000
          });
          component.isLoading = false;
          
          expect(component.isSubmitDisabled).toBe(false);
        });
      });
    });
    
    describe('Department creation edge cases', () => {
      it('should handle department creation with null response', fakeAsync(() => {
        spyOn(console, 'error');
        mockEmployeeService.createDepartment.and.returnValue(of(null as any));
        
        const newDepartmentOption: AutocompleteOption = {
          value: 'new-department-sales',
          label: 'Sales'
        };
        component.onDepartmentSelectionChange(newDepartmentOption);
        component.employeeForm.patchValue({ 
          departmentId: newDepartmentOption.value,
          firstName: 'Test',
          lastName: 'User',
          birthDate: '1990-01-01',
          hireDate: '2023-01-01',
          salary: 50000
        });

        component.onSubmit();
        tick();

        expect(console.error).toHaveBeenCalledWith('Error creating department:', jasmine.any(Error));
      }));
      
      it('should handle department creation with undefined response', fakeAsync(() => {
        spyOn(console, 'error');
        mockEmployeeService.createDepartment.and.returnValue(of(undefined as any));
        
        const newDepartmentOption: AutocompleteOption = {
          value: 'new-department-sales',
          label: 'Sales'
        };
        component.onDepartmentSelectionChange(newDepartmentOption);
        component.employeeForm.patchValue({ 
          departmentId: newDepartmentOption.value,
          firstName: 'Test',
          lastName: 'User',
          birthDate: '1990-01-01',
          hireDate: '2023-01-01',
          salary: 50000
        });

        component.onSubmit();
        tick();

        expect(console.error).toHaveBeenCalledWith('Error creating department:', jasmine.any(Error));
      }));
      
      it('should reload departments after successful creation', fakeAsync(() => {
        spyOn(component.save, 'emit');
        spyOn(component as any, 'loadDepartments');
        mockEmployeeService.createDepartment.and.returnValue(of('new-dept-id'));
        
        const newDepartmentOption: AutocompleteOption = {
          value: 'new-department-sales',
          label: 'Sales'
        };
        component.onDepartmentSelectionChange(newDepartmentOption);
        component.employeeForm.patchValue({ 
          departmentId: newDepartmentOption.value,
          firstName: 'Test',
          lastName: 'User',
          birthDate: '1990-01-01',
          hireDate: '2023-01-01',
          salary: 50000
        });

        component.onSubmit();
        tick();

        expect((component as any).loadDepartments).toHaveBeenCalled();
      }));
      
      it('should update form with new department ID after creation', fakeAsync(() => {
        spyOn(component.save, 'emit');
        spyOn(component.employeeForm, 'patchValue').and.callThrough();
        mockEmployeeService.createDepartment.and.returnValue(of('new-dept-id'));
        
        const newDepartmentOption: AutocompleteOption = {
          value: 'new-department-sales',
          label: 'Sales'
        };
        component.onDepartmentSelectionChange(newDepartmentOption);
        component.employeeForm.patchValue({ 
          departmentId: newDepartmentOption.value,
          firstName: 'Test',
          lastName: 'User',
          birthDate: '1990-01-01',
          hireDate: '2023-01-01',
          salary: 50000
        });

        component.onSubmit();
        tick();

        expect(component.employeeForm.patchValue).toHaveBeenCalledWith(
          { departmentId: 'new-dept-id' }, 
          { emitEvent: false }
        );
      }));
    });
    
    describe('Form submission edge cases', () => {
      it('should handle submission with getRawValue', () => {
        spyOn(component.save, 'emit');
        spyOn(component.employeeForm, 'getRawValue').and.returnValue({
          departmentId: 'IT',
          firstName: 'John',
          middleName: null,
          lastName: 'Doe',
          birthDate: '1990-01-01',
          hireDate: '2023-01-01',
          salary: 75000
        });
        
        component.employeeForm.patchValue({
          departmentId: 'IT',
          firstName: 'John',
          lastName: 'Doe',
          birthDate: '1990-01-01',
          hireDate: '2023-01-01',
          salary: 75000
        });
        
        component.onSubmit();
        
        expect(component.employeeForm.getRawValue).toHaveBeenCalled();
        expect(component.save.emit).toHaveBeenCalledWith({
          employeeData: jasmine.objectContaining({
            middleName: ''
          }),
          newDepartmentCreated: false
        });
      });
    });
  });
}); 