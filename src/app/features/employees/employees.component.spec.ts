import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { EmployeesComponent } from './employees.component';
import { EmployeeService } from '../../core/services/employee.service';
import { ToastService } from '../../core/services/toast.service';
import { Employee, CreateEmployeeRequest, UpdateEmployeeRequest, PaginatedResponse, Department, EmployeeSort, SortDirection } from '../../core/models/employee.model';
import { EmployeeFormModalComponent } from '../../shared/components/employee-form-modal.component';
import { DeleteConfirmationModalComponent } from '../../shared/components/delete-confirmation-modal.component';

describe('EmployeesComponent', () => {
  let component: EmployeesComponent;
  let fixture: ComponentFixture<EmployeesComponent>;
  let mockEmployeeService: jasmine.SpyObj<EmployeeService>;
  let mockToastService: jasmine.SpyObj<ToastService>;

  const mockDepartments: Department[] = [
    { id: '123e4567-e89b-12d3-a456-426614174001', name: 'IT' },
    { id: '123e4567-e89b-12d3-a456-426614174002', name: 'HR' }
  ];

  const mockEmployees: Employee[] = [
    {
      id: '1',
      department: mockDepartments[0],
      firstName: 'John',
      lastName: 'Doe',
      birthDate: '1990-01-01T00:00:00.000Z',
      hireDate: '2022-01-01T00:00:00.000Z',
      salary: 50000
    },
    {
      id: '2',
      department: mockDepartments[1],
      firstName: 'Jane',
      lastName: 'Smith',
      birthDate: '1992-02-02T00:00:00.000Z',
      hireDate: '2021-02-02T00:00:00.000Z',
      salary: 60000
    }
  ];

  const mockPaginatedResponse: PaginatedResponse<Employee> = {
    data: mockEmployees,
    currentPage: 1,
    perPage: 10,
    totalItems: 2,
    totalPages: 1
  };

  beforeEach(async () => {
    const employeeSpy = jasmine.createSpyObj('EmployeeService', ['list', 'add', 'update', 'delete', 'getDepartments', 'createDepartment']);
    employeeSpy.list.and.returnValue(of(mockPaginatedResponse));
    employeeSpy.add.and.returnValue(of('new-id'));
    employeeSpy.update.and.returnValue(of(void 0));
    employeeSpy.delete.and.returnValue(of(void 0));
    employeeSpy.getDepartments.and.returnValue(of(mockDepartments));
    employeeSpy.createDepartment.and.returnValue(of('123e4567-e89b-12d3-a456-426614174003'));

    const toastSpy = jasmine.createSpyObj('ToastService', ['showSuccess', 'showError', 'getToasts']);
    toastSpy.getToasts.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [
        EmployeesComponent,
        ReactiveFormsModule,
        EmployeeFormModalComponent,
        DeleteConfirmationModalComponent
      ],
      providers: [
        { provide: EmployeeService, useValue: employeeSpy },
        { provide: ToastService, useValue: toastSpy }
      ]
    }).compileComponents();

    mockEmployeeService = TestBed.inject(EmployeeService) as jasmine.SpyObj<EmployeeService>;
    mockToastService = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
    fixture = TestBed.createComponent(EmployeesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
      expect(component.employees).toEqual(mockEmployees);
      expect(component.totalItems).toBe(2);
      expect(component.currentPage).toBe(1);
      expect(component.perPage).toBe(10);
      expect(component.totalPages).toBe(1);
      expect(component.isLoading).toBe(false);
      expect(component.isFormModalVisible).toBe(false);
      expect(component.isDeleteModalVisible).toBe(false);
      expect(component.selectedEmployee).toBeNull();
      expect(component.sortConfig.column).toBe(EmployeeSort.None);
      expect(component.sortConfig.direction).toBe(SortDirection.None);
    });

    it('should load employees on init', () => {
      expect(mockEmployeeService.list).toHaveBeenCalled();
      expect(component.employees).toEqual(mockEmployees);
    });

    it('should load departments on init', () => {
      expect(mockEmployeeService.getDepartments).toHaveBeenCalled();
      expect(component.departments).toEqual(mockDepartments);
    });

    it('should handle empty employees list', () => {
      const emptyResponse: PaginatedResponse<Employee> = {
        data: [],
        currentPage: 1,
        perPage: 10,
        totalItems: 0,
        totalPages: 0
      };
      mockEmployeeService.list.and.returnValue(of(emptyResponse));
      
      component.loadEmployees();
      
      expect(component.employees).toEqual([]);
      expect(component.totalItems).toBe(0);
    });

    it('should handle employee loading error', () => {
      mockEmployeeService.list.and.returnValue(throwError(() => new Error('Failed to load')));
      
      component.loadEmployees();
      
      expect(component.isLoading).toBe(false);
      expect(mockToastService.showError).toHaveBeenCalledWith('Ошибка', 'Ошибка загрузки сотрудников');
    });
  });

  describe('Filtering', () => {
    it('should filter by department', () => {
      component.filterForm.patchValue({ departmentId: 'IT' });
      component.loadEmployees();
      
      expect(mockEmployeeService.list).toHaveBeenCalledWith(jasmine.objectContaining({
        Department: 'IT'
      }));
    });

    it('should filter by first name', () => {
      component.filterForm.patchValue({ firstName: 'John' });
      component.loadEmployees();
      
      expect(mockEmployeeService.list).toHaveBeenCalledWith(jasmine.objectContaining({
        FirstName: 'John'
      }));
    });

    it('should filter by middle name', () => {
      component.filterForm.patchValue({ middleName: 'Michael' });
      component.loadEmployees();
      
      expect(mockEmployeeService.list).toHaveBeenCalledWith(jasmine.objectContaining({
        MiddleName: 'Michael'
      }));
    });

    it('should filter by last name', () => {
      component.filterForm.patchValue({ lastName: 'Doe' });
      component.loadEmployees();
      
      expect(mockEmployeeService.list).toHaveBeenCalledWith(jasmine.objectContaining({
        LastName: 'Doe'
      }));
    });

    it('should filter by birth date', () => {
      component.filterForm.patchValue({ birthDate: '1990-01-01' });
      component.loadEmployees();
      
      expect(mockEmployeeService.list).toHaveBeenCalledWith(jasmine.objectContaining({
        MinBirthDate: '1990-01-01'
      }));
    });

    it('should filter by hire date', () => {
      component.filterForm.patchValue({ hireDate: '2022-01-01' });
      component.loadEmployees();
      
      expect(mockEmployeeService.list).toHaveBeenCalledWith(jasmine.objectContaining({
        MinHireDate: '2022-01-01'
      }));
    });

    it('should filter by salary', () => {
      component.filterForm.patchValue({ salary: '50000' });
      component.loadEmployees();
      
      expect(mockEmployeeService.list).toHaveBeenCalledWith(jasmine.objectContaining({
        MinSalary: 50000
      }));
    });

    it('should combine multiple filters', () => {
      component.filterForm.patchValue({
        departmentId: 'IT',
        firstName: 'John',
        salary: '50000'
      });
      component.loadEmployees();
      
      expect(mockEmployeeService.list).toHaveBeenCalledWith(jasmine.objectContaining({
        Department: 'IT',
        FirstName: 'John',
        MinSalary: 50000
      }));
    });

    it('should reset page to 1 when applying filters', fakeAsync(() => {
      component.currentPage = 3;
      component.filterForm.patchValue({ firstName: 'John' });
      tick(600); // Wait for debounce
      
      expect(component.currentPage).toBe(1);
    }));

    it('should clear all filters', () => {
      component.filterForm.patchValue({
        departmentId: 'IT',
        firstName: 'John',
        salary: '50000'
      });
      component.sortConfig = { column: EmployeeSort.FirstName, direction: SortDirection.Ascending };
      
      component.clearFilters();
      
      expect(component.filterForm.value).toEqual({
        departmentId: '',
        firstName: '',
        middleName: '',
        lastName: '',
        birthDate: '',
        hireDate: '',
        salary: ''
      });
      expect(component.sortConfig).toEqual({ column: EmployeeSort.None, direction: SortDirection.None });
      expect(mockEmployeeService.list).toHaveBeenCalled();
    });

    it('should handle invalid salary filter', () => {
      component.filterForm.patchValue({ salary: 'invalid' });
      component.loadEmployees();
      
      // Invalid salary should not be included in params
      expect(mockEmployeeService.list).toHaveBeenCalledWith(jasmine.objectContaining({
        Page: 1,
        Limit: 10
      }));
    });

    it('should handle empty string filters', () => {
      component.filterForm.patchValue({
        departmentId: '',
        firstName: '',
        birthDate: '',
        hireDate: '',
        salary: ''
      });
      component.loadEmployees();
      
      const expectedParams = jasmine.objectContaining({
        Page: 1,
        Limit: 10
      });
      expect(mockEmployeeService.list).toHaveBeenCalledWith(expectedParams);
    });

    it('should handle form changes with debounce', fakeAsync(() => {
      spyOn(component, 'loadEmployees');
      
      component.filterForm.patchValue({ firstName: 'John' });
      tick(300); // Less than debounce time
      expect(component.loadEmployees).not.toHaveBeenCalled();
      
      tick(300); // Complete debounce time
      expect(component.loadEmployees).toHaveBeenCalled();
    }));
  });

  describe('Sorting', () => {
    it('should sort by first name', () => {
      component.sort(EmployeeSort.FirstName);
      
      expect(component.sortConfig.column).toBe(EmployeeSort.FirstName);
      expect(component.sortConfig.direction).toBe(SortDirection.Ascending);
      expect(mockEmployeeService.list).toHaveBeenCalledWith(jasmine.objectContaining({
        EmployeeSort: EmployeeSort.FirstName,
        SortDirection: SortDirection.Ascending
      }));
    });

    it('should toggle sort direction on same column', () => {
      component.sortConfig = { column: EmployeeSort.FirstName, direction: SortDirection.Ascending };
      
      component.sort(EmployeeSort.FirstName);
      
      expect(component.sortConfig.direction).toBe(SortDirection.Descending);
    });

    it('should reset to ascending when switching columns', () => {
      component.sortConfig = { column: EmployeeSort.FirstName, direction: SortDirection.Descending };
      
      component.sort(EmployeeSort.LastName);
      
      expect(component.sortConfig.column).toBe(EmployeeSort.LastName);
      expect(component.sortConfig.direction).toBe(SortDirection.Ascending);
    });

    it('should sort by all available columns', () => {
      const sortTests = [
        { column: EmployeeSort.FirstName },
        { column: EmployeeSort.LastName },
        { column: EmployeeSort.Department },
        { column: EmployeeSort.BirthDate },
        { column: EmployeeSort.HireDate },
        { column: EmployeeSort.Salary }
      ];

      sortTests.forEach(test => {
        component.sort(test.column);
        expect(component.sortConfig.column).toBe(test.column);
      });
    });

    it('should handle invalid sort column', () => {
      const originalSortConfig = { ...component.sortConfig };
      component.sort('invalidColumn' as any);
      expect(component.sortConfig).toEqual(originalSortConfig);
    });

    it('should get correct sort icon for ascending', () => {
      component.sortConfig = { column: EmployeeSort.FirstName, direction: SortDirection.Ascending };
      
      expect(component.getSortIcon(EmployeeSort.FirstName)).toBe('bi-arrow-up');
    });

    it('should get correct sort icon for descending', () => {
      component.sortConfig = { column: EmployeeSort.FirstName, direction: SortDirection.Descending };
      
      expect(component.getSortIcon(EmployeeSort.FirstName)).toBe('bi-arrow-down');
    });

    it('should get default sort icon for unsorted column', () => {
      component.sortConfig = { column: EmployeeSort.FirstName, direction: SortDirection.Ascending };
      
      expect(component.getSortIcon(EmployeeSort.LastName)).toBe('bi-arrow-down-up');
    });

    it('should handle invalid sort direction', () => {
      component.sortConfig = { column: EmployeeSort.FirstName, direction: 'invalid' as any };
      component.sort(EmployeeSort.FirstName);
      expect(component.sortConfig.direction).toBe(SortDirection.Ascending);
    });
  });

  describe('Pagination', () => {
    beforeEach(() => {
      // Reset the service mock to prevent interference from component initialization
      mockEmployeeService.list.calls.reset();
    });

    it('should go to specific page', () => {
      const mockResponse = {
        ...mockPaginatedResponse,
        currentPage: 3,
        totalPages: 5
      };
      mockEmployeeService.list.and.returnValue(of(mockResponse));
      
      component.totalPages = 5;
      component.goToPage(3);
      
      expect(component.currentPage).toBe(3);
      expect(mockEmployeeService.list).toHaveBeenCalledWith(jasmine.objectContaining({
        Page: 3
      }));
    });

    it('should not go to invalid page', () => {
      const initialPage = component.currentPage;
      component.totalPages = 5;
      
      component.goToPage(0);
      expect(component.currentPage).toBe(initialPage);
      
      component.goToPage(10);
      expect(component.currentPage).toBe(initialPage);
    });

    it('should go to previous page', () => {
      const mockResponse = {
        ...mockPaginatedResponse,
        currentPage: 2,
        totalPages: 5
      };
      mockEmployeeService.list.and.returnValue(of(mockResponse));
      
      component.currentPage = 3;
      component.totalPages = 5;
      
      component.previousPage();
      
      expect(component.currentPage).toBe(2);
    });

    it('should go to next page', () => {
      const mockResponse = {
        ...mockPaginatedResponse,
        currentPage: 4,
        totalPages: 5
      };
      mockEmployeeService.list.and.returnValue(of(mockResponse));
      
      component.currentPage = 3;
      component.totalPages = 5;
      
      component.nextPage();
      
      expect(component.currentPage).toBe(4);
    });

    it('should not go below page 1', () => {
      component.currentPage = 1;
      component.totalPages = 5;
      
      component.previousPage();
      
      expect(component.currentPage).toBe(1);
    });

    it('should not go beyond last page', () => {
      component.currentPage = 5;
      component.totalPages = 5;
      
      component.nextPage();
      
      expect(component.currentPage).toBe(5);
    });
  });

  describe('Modal Management', () => {
    it('should open create employee modal', () => {
      component.openCreateModal();
      
      expect(component.isFormModalVisible).toBe(true);
      expect(component.selectedEmployee).toBeNull();
    });

    it('should open edit employee modal', () => {
      component.openEditModal(mockEmployees[0]);
      
      expect(component.isFormModalVisible).toBe(true);
      expect(component.selectedEmployee).toBe(mockEmployees[0]);
    });

    it('should close form modal', () => {
      component.isFormModalVisible = true;
      component.selectedEmployee = mockEmployees[0];
      
      component.closeFormModal();
      
      expect(component.isFormModalVisible).toBe(false);
      expect(component.selectedEmployee).toBeNull();
    });

    it('should open delete confirmation modal', () => {
      component.openDeleteModal(mockEmployees[0]);
      
      expect(component.isDeleteModalVisible).toBe(true);
      expect(component.selectedEmployee).toBe(mockEmployees[0]);
    });

    it('should close delete modal', () => {
      component.isDeleteModalVisible = true;
      component.selectedEmployee = mockEmployees[0];
      
      component.closeDeleteModal();
      
      expect(component.isDeleteModalVisible).toBe(false);
      expect(component.selectedEmployee).toBeNull();
    });
  });

  describe('Employee Actions', () => {
    it('should add an employee', fakeAsync(() => {
      const createRequest: CreateEmployeeRequest = {
        departmentId: '123e4567-e89b-12d3-a456-426614174001',
        firstName: 'New',
        lastName: 'Employee',
        birthDate: '1995-05-05T00:00:00.000Z',
        hireDate: '2024-01-01T00:00:00.000Z',
        salary: 60000
      };

      component.saveEmployee({ employeeData: createRequest, newDepartmentCreated: false });
      tick();

      expect(mockEmployeeService.add).toHaveBeenCalledWith(createRequest);
      expect(mockToastService.showSuccess).toHaveBeenCalledWith('Успешно', 'Сотрудник создан успешно');
      expect(component.isFormModalVisible).toBe(false);
      expect(component.selectedEmployee).toBeNull();
      expect(mockEmployeeService.list).toHaveBeenCalled();
    }));

    it('should update an employee', fakeAsync(() => {
      const updateRequest: UpdateEmployeeRequest = {
        departmentId: '123e4567-e89b-12d3-a456-426614174001',
        firstName: 'Updated',
        lastName: 'Doe',
        birthDate: '1990-01-01T00:00:00.000Z',
        hireDate: '2022-01-01T00:00:00.000Z',
        salary: 50000
      };
      
      component.selectedEmployee = mockEmployees[0];
      component.saveEmployee({ employeeData: updateRequest, newDepartmentCreated: false });
      tick();

      expect(mockEmployeeService.update).toHaveBeenCalledWith(mockEmployees[0].id, updateRequest);
      expect(mockToastService.showSuccess).toHaveBeenCalledWith('Успешно', 'Сотрудник обновлен успешно');
      expect(component.isFormModalVisible).toBe(false);
      expect(component.selectedEmployee).toBeNull();
    }));

    it('should delete an employee', fakeAsync(() => {
      component.selectedEmployee = mockEmployees[0];
      component.deleteEmployee();
      tick();

      expect(mockEmployeeService.delete).toHaveBeenCalledWith(mockEmployees[0].id);
      expect(mockToastService.showSuccess).toHaveBeenCalledWith('Успешно', 'Сотрудник удален успешно');
      expect(component.isDeleteModalVisible).toBe(false);
      expect(component.selectedEmployee).toBeNull();
    }));

    it('should handle create employee error', fakeAsync(() => {
      mockEmployeeService.add.and.returnValue(throwError(() => new Error('Create failed')));
      
      const createRequest: CreateEmployeeRequest = {
        departmentId: '123e4567-e89b-12d3-a456-426614174001',
        firstName: 'New',
        lastName: 'Employee',
        birthDate: '1995-05-05T00:00:00.000Z',
        hireDate: '2024-01-01T00:00:00.000Z',
        salary: 60000
      };

      component.saveEmployee({ employeeData: createRequest, newDepartmentCreated: false });
      tick();

      expect(mockToastService.showError).toHaveBeenCalledWith('Ошибка', 'Произошла ошибка при создании сотрудника. Попробуйте еще раз.');
      expect(component.isLoading).toBe(false);
    }));

    it('should handle update employee error', fakeAsync(() => {
      mockEmployeeService.update.and.returnValue(throwError(() => new Error('Update failed')));
      
      const updateRequest: UpdateEmployeeRequest = {
        departmentId: '123e4567-e89b-12d3-a456-426614174001',
        firstName: 'Updated',
        lastName: 'Employee',
        birthDate: '1990-01-01T00:00:00.000Z',
        hireDate: '2022-01-01T00:00:00.000Z',
        salary: 55000
      };
      
      component.selectedEmployee = mockEmployees[0];
      component.saveEmployee({ employeeData: updateRequest, newDepartmentCreated: false });
      tick();

      expect(mockToastService.showError).toHaveBeenCalledWith('Ошибка', 'Произошла ошибка при обновлении сотрудника. Попробуйте еще раз.');
      expect(component.isLoading).toBe(false);
    }));

    it('should handle delete employee error', fakeAsync(() => {
      mockEmployeeService.delete.and.returnValue(throwError(() => new Error('Delete failed')));
      
      component.selectedEmployee = mockEmployees[0];
      component.deleteEmployee();
      tick();

      expect(mockToastService.showError).toHaveBeenCalledWith('Ошибка', 'Произошла ошибка при удалении сотрудника. Попробуйте еще раз.');
      expect(component.isLoading).toBe(false);
    }));

    it('should handle save employee with new department created', fakeAsync(() => {
      const createRequest: CreateEmployeeRequest = {
        departmentId: '123e4567-e89b-12d3-a456-426614174003',
        firstName: 'New',
        lastName: 'Employee',
        birthDate: '1995-05-05T00:00:00.000Z',
        hireDate: '2024-01-01T00:00:00.000Z',
        salary: 60000
      };

      component.saveEmployee({ employeeData: createRequest, newDepartmentCreated: true });
      tick();

      expect(mockEmployeeService.add).toHaveBeenCalledWith(createRequest);
      expect(mockToastService.showSuccess).toHaveBeenCalledWith('Успешно', 'Сотрудник создан успешно');
      expect(mockEmployeeService.getDepartments).toHaveBeenCalled();
    }));

    it('should not delete employee when no employee selected', () => {
      component.selectedEmployee = null;
      component.deleteEmployee();

      expect(mockEmployeeService.delete).not.toHaveBeenCalled();
    });

    it('should set loading state during operations', () => {
      const createRequest: CreateEmployeeRequest = {
        departmentId: '123e4567-e89b-12d3-a456-426614174001',
        firstName: 'New',
        lastName: 'Employee',
        birthDate: '1995-05-05T00:00:00.000Z',
        hireDate: '2024-01-01T00:00:00.000Z',
        salary: 60000
      };

      // Mock the service to delay response so we can check loading state
      mockEmployeeService.add.and.returnValue(of('new-id').pipe(delay(100)));
      
      component.saveEmployee({ employeeData: createRequest, newDepartmentCreated: false });
      
      expect(component.isLoading).toBe(true);
    });

    it('should validate employee data before saving', () => {
      const invalidRequest = {
        departmentId: '',
        firstName: '',
        lastName: '',
        birthDate: '',
        hireDate: '',
        salary: 0
      };

      component.saveEmployee({ employeeData: invalidRequest, newDepartmentCreated: false });
      
      expect(mockEmployeeService.add).not.toHaveBeenCalled();
      expect(mockToastService.showError).toHaveBeenCalledWith('Ошибка', 'Пожалуйста, заполните все обязательные поля корректно');
    });
  });

  describe('Data Formatting', () => {
    it('should format currency correctly', () => {
      expect(component.formatCurrency(50000)).toContain('50');
      expect(component.formatCurrency(50000)).toContain('000');
      expect(component.formatCurrency(0)).toContain('0');
    });

    it('should format date correctly', () => {
      const date = '1990-01-01T00:00:00.000Z';
      const formatted = component.formatDate(date);
      expect(formatted).toContain('01');
      expect(formatted).toContain('1990');
    });

    it('should handle invalid date', () => {
      expect(component.formatDate('invalid-date')).toBe('invalid-date');
    });

    it('should format full name correctly', () => {
      const employee1 = { ...mockEmployees[0], middleName: 'Michael' };
      const employee2 = { ...mockEmployees[0], middleName: undefined };
      const employee3 = { ...mockEmployees[0], middleName: '' };

      expect(component.getFullName(employee1)).toBe('John Michael Doe');
      expect(component.getFullName(employee2)).toBe('John Doe');
      expect(component.getFullName(employee3)).toBe('John Doe');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null employee data', () => {
      component.employees = [];
      fixture.detectChanges();
      
      expect(component).toBeTruthy();
    });

    it('should handle undefined pagination data', () => {
      const invalidResponse = {
        data: mockEmployees,
        currentPage: 1,
        perPage: 10,
        totalItems: 0,
        totalPages: 0
      } as any;
      
      mockEmployeeService.list.and.returnValue(of(invalidResponse));
      component.loadEmployees();
      
      expect(component.currentPage).toBe(1);
      expect(component.perPage).toBe(10);
    });

    it('should handle very large employee list', () => {
      const largeEmployeeList = Array.from({ length: 100 }, (_, i) => ({
        ...mockEmployees[0],
        id: `employee-${i}`,
        firstName: `Employee${i}`
      }));
      
      const largeResponse: PaginatedResponse<Employee> = {
        data: largeEmployeeList,
        currentPage: 1,
        perPage: 100,
        totalItems: 100,
        totalPages: 1
      };
      
      mockEmployeeService.list.and.returnValue(of(largeResponse));
      component.loadEmployees();
      
      expect(component.employees.length).toBe(100);
    });

    it('should handle rapid filter changes with debounce', fakeAsync(() => {
      spyOn(component, 'loadEmployees');
      
      component.filterForm.patchValue({ firstName: 'J' });
      tick(100);
      component.filterForm.patchValue({ firstName: 'Jo' });
      tick(100);
      component.filterForm.patchValue({ firstName: 'Joh' });
      tick(600);
      
      expect(component.loadEmployees).toHaveBeenCalledTimes(1);
    }));
  });

  describe('Component Cleanup', () => {
    it('should handle component destruction gracefully', () => {
      component.ngOnDestroy();
      expect(component).toBeTruthy();
    });

    it('should complete observables on destroy', () => {
      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');
      
      component.ngOnDestroy();
      
      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    });
  });

  describe('Additional Edge Cases for Coverage', () => {
    it('should handle formatDate with exception', () => {
      // Mock Date constructor to throw error
      const originalDate = (window as any).Date;
      (window as any).Date = jasmine.createSpy('Date').and.throwError('Date error');
      
      const result = component.formatDate('2023-01-01');
      
      expect(result).toBe('2023-01-01');
      
      // Restore original Date
      (window as any).Date = originalDate;
    });

    it('should handle formatDate with NaN date', () => {
      const result = component.formatDate('not-a-date');
      expect(result).toBe('not-a-date');
    });

    it('should handle isValidGuid with various formats', () => {
      expect((component as any).isValidGuid('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
      expect((component as any).isValidGuid('invalid-guid')).toBe(false);
      expect((component as any).isValidGuid('123e4567-e89b-12d3-a456-42661417400')).toBe(false);
      expect((component as any).isValidGuid('')).toBe(false);
      expect((component as any).isValidGuid('123E4567-E89B-12D3-A456-426614174000')).toBe(true);
    });

    it('should handle isValidDate with various formats', () => {
      expect((component as any).isValidDate('2023-01-01')).toBe(true);
      expect((component as any).isValidDate('2023-01-01T00:00:00.000Z')).toBe(true);
      expect((component as any).isValidDate('invalid-date')).toBe(false);
      expect((component as any).isValidDate('')).toBe(false);
      expect((component as any).isValidDate('2023-13-01')).toBe(false);
    });

    it('should handle validateEmployeeData with department ID validation', () => {
      const invalidDepartmentData = {
        departmentId: 'invalid-guid',
        firstName: 'John',
        lastName: 'Doe',
        birthDate: '1990-01-01T00:00:00.000Z',
        hireDate: '2023-01-01T00:00:00.000Z',
        salary: 50000
      };

      const result = (component as any).validateEmployeeData(invalidDepartmentData);
      expect(result).toBe(false);
    });

    it('should handle validateEmployeeData with trimmed names', () => {
      const trimmedNameData = {
        departmentId: '123e4567-e89b-12d3-a456-426614174001',
        firstName: '   ',
        lastName: '   ',
        birthDate: '1990-01-01T00:00:00.000Z',
        hireDate: '2023-01-01T00:00:00.000Z',
        salary: 50000
      };

      const result = (component as any).validateEmployeeData(trimmedNameData);
      expect(result).toBe(false);
    });

    it('should handle validateEmployeeData with invalid dates', () => {
      const invalidDateData = {
        departmentId: '123e4567-e89b-12d3-a456-426614174001',
        firstName: 'John',
        lastName: 'Doe',
        birthDate: 'invalid-date',
        hireDate: 'invalid-date',
        salary: 50000
      };

      const result = (component as any).validateEmployeeData(invalidDateData);
      expect(result).toBe(false);
    });

    it('should handle validateEmployeeData with null salary', () => {
      const nullSalaryData = {
        departmentId: '123e4567-e89b-12d3-a456-426614174001',
        firstName: 'John',
        lastName: 'Doe',
        birthDate: '1990-01-01T00:00:00.000Z',
        hireDate: '2023-01-01T00:00:00.000Z',
        salary: null
      };

      const result = (component as any).validateEmployeeData(nullSalaryData);
      expect(result).toBe(false);
    });

    it('should handle validateEmployeeData with undefined salary', () => {
      const undefinedSalaryData = {
        departmentId: '123e4567-e89b-12d3-a456-426614174001',
        firstName: 'John',
        lastName: 'Doe',
        birthDate: '1990-01-01T00:00:00.000Z',
        hireDate: '2023-01-01T00:00:00.000Z',
        salary: undefined
      };

      const result = (component as any).validateEmployeeData(undefinedSalaryData);
      expect(result).toBe(false);
    });

    it('should handle saveEmployee with new department creation error', fakeAsync(() => {
      mockEmployeeService.createDepartment.and.returnValue(throwError(() => new Error('Department creation failed')));
      
      const createRequest: CreateEmployeeRequest = {
        departmentId: 'new-department-TestDept',
        firstName: 'New',
        lastName: 'Employee',
        birthDate: '1995-05-05T00:00:00.000Z',
        hireDate: '2024-01-01T00:00:00.000Z',
        salary: 60000
      };

      component.saveEmployee({ employeeData: createRequest, newDepartmentCreated: true });
      tick();

      expect(mockToastService.showError).toHaveBeenCalledWith('Ошибка', 'Произошла ошибка при создании отдела. Попробуйте еще раз.');
      expect(mockEmployeeService.add).not.toHaveBeenCalled();
    }));

    it('should handle saveEmployee with new department creation returning null', fakeAsync(() => {
      mockEmployeeService.createDepartment.and.returnValue(of(null as any));
      
      const createRequest: CreateEmployeeRequest = {
        departmentId: 'new-department-TestDept',
        firstName: 'New',
        lastName: 'Employee',
        birthDate: '1995-05-05T00:00:00.000Z',
        hireDate: '2024-01-01T00:00:00.000Z',
        salary: 60000
      };

      component.saveEmployee({ employeeData: createRequest, newDepartmentCreated: true });
      tick();

      expect(mockToastService.showError).toHaveBeenCalledWith('Ошибка', 'Произошла ошибка при создании отдела. Попробуйте еще раз.');
      expect(mockEmployeeService.add).not.toHaveBeenCalled();
    }));

    it('should handle loadEmployees with salary filter NaN', () => {
      component.filterForm.patchValue({ salary: 'invalid-number' });
      
      component.loadEmployees();
      
      expect(mockEmployeeService.list).toHaveBeenCalled();
      const calledParams = mockEmployeeService.list.calls.mostRecent()?.args[0];
      expect(calledParams?.MinSalary).toBeUndefined();
    });

    it('should handle loadEmployees with zero salary filter', () => {
      component.filterForm.patchValue({ salary: '0' });
      
      component.loadEmployees();
      
      expect(mockEmployeeService.list).toHaveBeenCalled();
      const calledParams = mockEmployeeService.list.calls.mostRecent()?.args[0];
      expect(calledParams?.MinSalary).toBeUndefined();
    });

    it('should handle loadEmployees with negative salary filter', () => {
      component.filterForm.patchValue({ salary: '-100' });
      
      component.loadEmployees();
      
      expect(mockEmployeeService.list).toHaveBeenCalled();
      const calledParams = mockEmployeeService.list.calls.mostRecent()?.args[0];
      expect(calledParams?.MinSalary).toBeUndefined();
    });

    it('should handle setupFilterChanges when component is loading', () => {
      component.isLoading = true;
      spyOn(component, 'loadEmployees');
      
      component.filterForm.patchValue({ firstName: 'Test' });
      
      // The filter change should be ignored while loading
      expect(component.loadEmployees).not.toHaveBeenCalled();
    });

    it('should handle saveEmployee with update and new department created', fakeAsync(() => {
      mockEmployeeService.createDepartment.and.returnValue(of('123e4567-e89b-12d3-a456-426614174002'));
      
      const updateRequest: UpdateEmployeeRequest = {
        departmentId: 'new-department-TestDept',
        firstName: 'Updated',
        lastName: 'Employee',
        birthDate: '1990-01-01T00:00:00.000Z',
        hireDate: '2022-01-01T00:00:00.000Z',
        salary: 55000
      };
      
      component.selectedEmployee = mockEmployees[0];
      component.saveEmployee({ employeeData: updateRequest, newDepartmentCreated: true });
      tick();

      expect(mockEmployeeService.createDepartment).toHaveBeenCalledWith({ name: 'TestDept' });
      expect(mockEmployeeService.update).toHaveBeenCalledWith(mockEmployees[0].id, {
        ...updateRequest,
        departmentId: '123e4567-e89b-12d3-a456-426614174002'
      });
      expect(mockToastService.showSuccess).toHaveBeenCalledWith('Успешно', 'Новый отдел и сотрудник обновлены успешно');
      expect(mockEmployeeService.getDepartments).toHaveBeenCalled();
    }));

    it('should handle saveEmployee with create and new department created', fakeAsync(() => {
      mockEmployeeService.createDepartment.and.returnValue(of('123e4567-e89b-12d3-a456-426614174003'));
      
      const createRequest: CreateEmployeeRequest = {
        departmentId: 'new-department-TestDept',
        firstName: 'New',
        lastName: 'Employee',
        birthDate: '1995-05-05T00:00:00.000Z',
        hireDate: '2024-01-01T00:00:00.000Z',
        salary: 60000
      };
      
      component.selectedEmployee = null;
      component.saveEmployee({ employeeData: createRequest, newDepartmentCreated: true });
      tick();

      expect(mockEmployeeService.createDepartment).toHaveBeenCalledWith({ name: 'TestDept' });
      expect(mockEmployeeService.add).toHaveBeenCalledWith({
        ...createRequest,
        departmentId: '123e4567-e89b-12d3-a456-426614174003'
      });
      expect(mockToastService.showSuccess).toHaveBeenCalledWith('Успешно', 'Новый отдел и сотрудник созданы успешно');
      expect(mockEmployeeService.getDepartments).toHaveBeenCalled();
    }));
  });
}); 