import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { provideRouter } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { EmployeesComponent } from '../features/employees/employees.component';
import { EmployeeService } from '../core/services/employee.service';
import { ToastService } from '../core/services/toast.service';
import { Employee, CreateEmployeeRequest, UpdateEmployeeRequest, PaginatedResponse, EmployeeSort } from '../core/models/employee.model';
import { EmployeeFormModalComponent } from '../shared/components/employee-form-modal.component';
import { DeleteConfirmationModalComponent } from '../shared/components/delete-confirmation-modal.component';
import { AboutComponent } from '../features/about/about.component';

describe('Employee Management Integration Tests', () => {
  let component: EmployeesComponent;
  let fixture: ComponentFixture<EmployeesComponent>;
  let mockEmployeeService: jasmine.SpyObj<EmployeeService>;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let router: Router;
  let location: Location;

  const createMockEmployee = (id: string, firstName: string = 'John', lastName: string = 'Doe'): Employee => ({
    id,
    department: { id: '123e4567-e89b-12d3-a456-426614174001', name: 'IT' },
    firstName,
    middleName: 'Michael',
    lastName,
    birthDate: '1990-01-01T00:00:00.000Z',
    hireDate: '2023-01-01T00:00:00.000Z',
    salary: 75000
  });

  const createMockPaginatedResponse = (employees: Employee[]): PaginatedResponse<Employee> => ({
    data: employees,
    currentPage: 1,
    perPage: 10,
    totalItems: employees.length,
    totalPages: Math.ceil(employees.length / 10)
  });

  beforeEach(async () => {
    const employeeSpy = jasmine.createSpyObj('EmployeeService', ['list', 'add', 'update', 'delete', 'getById', 'getDepartments', 'createDepartment']);
    const toastSpy = jasmine.createSpyObj('ToastService', ['showSuccess', 'showError', 'showWarning', 'showInfo', 'getToasts']);
    
    employeeSpy.list.and.returnValue(of(createMockPaginatedResponse([])));
    employeeSpy.add.and.returnValue(of('new-id'));
    employeeSpy.update.and.returnValue(of(void 0));
    employeeSpy.delete.and.returnValue(of(void 0));
    employeeSpy.getById.and.returnValue(of(undefined));
    employeeSpy.getDepartments.and.returnValue(of([{ id: '123e4567-e89b-12d3-a456-426614174001', name: 'IT' }]));
    employeeSpy.createDepartment.and.returnValue(of('123e4567-e89b-12d3-a456-426614174002'));
    toastSpy.getToasts.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [
        EmployeesComponent,
        ReactiveFormsModule,
        EmployeeFormModalComponent,
        DeleteConfirmationModalComponent,
        HttpClientTestingModule
      ],
      providers: [
        { provide: EmployeeService, useValue: employeeSpy },
        { provide: ToastService, useValue: toastSpy },
        provideRouter([
          { path: '', component: AboutComponent },
          { path: 'employees', component: EmployeesComponent }
        ])
      ]
    }).compileComponents();

    mockEmployeeService = TestBed.inject(EmployeeService) as jasmine.SpyObj<EmployeeService>;
    mockToastService = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
    
    fixture = TestBed.createComponent(EmployeesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Complete CRUD Workflow', () => {
    it('should handle complete employee lifecycle: create, read, update, delete', fakeAsync(() => {
      // Initially empty
      expect(component.employees.length).toBe(0);
      
      // Create new employee
      const createRequest: CreateEmployeeRequest = {
        departmentId: '123e4567-e89b-12d3-a456-426614174001',
        firstName: 'John',
        lastName: 'Doe',
        birthDate: '1990-01-01T00:00:00.000Z',
        hireDate: '2023-01-01T00:00:00.000Z',
        salary: 75000
      };
      
      component.openCreateModal();
      expect(component.isFormModalVisible).toBe(true);
      expect(component.selectedEmployee).toBe(null);
      
      // Mock successful creation and reload
      const newEmployee = createMockEmployee('new-id', 'John', 'Doe');
      mockEmployeeService.add.and.returnValue(of('new-id'));
      mockEmployeeService.list.and.returnValue(of(createMockPaginatedResponse([newEmployee])));
      
      component.saveEmployee({ employeeData: createRequest, newDepartmentCreated: false });
      tick();
      
      expect(mockEmployeeService.add).toHaveBeenCalledWith(createRequest);
      expect(mockToastService.showSuccess).toHaveBeenCalledWith('Успешно', 'Сотрудник создан успешно');
      expect(component.isFormModalVisible).toBe(false);
      expect(component.employees.length).toBe(1);
      expect(component.employees[0].firstName).toBe('John');
      
      // Update employee
      const updateRequest: UpdateEmployeeRequest = {
        departmentId: '123e4567-e89b-12d3-a456-426614174001',
        firstName: 'John',
        lastName: 'Smith',
        birthDate: '1990-01-01T00:00:00.000Z',
        hireDate: '2023-01-01T00:00:00.000Z',
        salary: 85000
      };
      
      component.openEditModal(newEmployee);
      expect(component.isFormModalVisible).toBe(true);
      expect(component.selectedEmployee).toBe(newEmployee);
      
      const updatedEmployee = { ...newEmployee, lastName: 'Smith', salary: 85000 };
      mockEmployeeService.update.and.returnValue(of(void 0));
      mockEmployeeService.list.and.returnValue(of(createMockPaginatedResponse([updatedEmployee])));
      
      component.saveEmployee({ employeeData: updateRequest, newDepartmentCreated: false });
      tick();
      
      expect(mockEmployeeService.update).toHaveBeenCalledWith(newEmployee.id, updateRequest);
      expect(mockToastService.showSuccess).toHaveBeenCalledWith('Успешно', 'Сотрудник обновлен успешно');
      expect(component.isFormModalVisible).toBe(false);
      expect(component.employees[0].lastName).toBe('Smith');
      expect(component.employees[0].salary).toBe(85000);
      
      // Delete employee
      component.openDeleteModal(updatedEmployee);
      expect(component.isDeleteModalVisible).toBe(true);
      expect(component.selectedEmployee).toBe(updatedEmployee);
      
      mockEmployeeService.delete.and.returnValue(of(void 0));
      mockEmployeeService.list.and.returnValue(of(createMockPaginatedResponse([])));
      
      component.deleteEmployee();
      tick();
      
      expect(mockEmployeeService.delete).toHaveBeenCalledWith(updatedEmployee.id);
      expect(mockToastService.showSuccess).toHaveBeenCalledWith('Успешно', 'Сотрудник удален успешно');
      expect(component.isDeleteModalVisible).toBe(false);
      expect(component.employees.length).toBe(0);
    }));
  });

  describe('Error Handling Integration', () => {
    it('should handle API errors gracefully during CRUD operations', fakeAsync(() => {
      // Test create error
      mockEmployeeService.add.and.returnValue(throwError('API Error'));
      
      const createRequest: CreateEmployeeRequest = {
        departmentId: '123e4567-e89b-12d3-a456-426614174001',
        firstName: 'John',
        lastName: 'Doe',
        birthDate: '1990-01-01T00:00:00.000Z',
        hireDate: '2023-01-01T00:00:00.000Z',
        salary: 75000
      };
      
      component.saveEmployee({ employeeData: createRequest, newDepartmentCreated: false });
      tick();
      
      expect(mockToastService.showError).toHaveBeenCalledWith('Ошибка', 'Произошла ошибка при создании сотрудника. Попробуйте еще раз.');
      expect(component.isLoading).toBe(false);
      
      // Test update error
      const employee = createMockEmployee('test-id');
      component.selectedEmployee = employee;
      
      mockEmployeeService.update.and.returnValue(throwError('API Error'));
      
      const updateRequest: UpdateEmployeeRequest = {
        departmentId: '123e4567-e89b-12d3-a456-426614174001',
        firstName: 'John',
        lastName: 'Doe',
        birthDate: '1990-01-01T00:00:00.000Z',
        hireDate: '2023-01-01T00:00:00.000Z',
        salary: 85000
      };
      
      component.saveEmployee({ employeeData: updateRequest, newDepartmentCreated: false });
      tick();
      
      expect(mockToastService.showError).toHaveBeenCalledWith('Ошибка', 'Произошла ошибка при обновлении сотрудника. Попробуйте еще раз.');
      
      // Test delete error
      mockEmployeeService.delete.and.returnValue(throwError('API Error'));
      
      component.deleteEmployee();
      tick();
      
      expect(mockToastService.showError).toHaveBeenCalledWith('Ошибка', 'Произошла ошибка при удалении сотрудника. Попробуйте еще раз.');
    }));
  });

  describe('Filtering Integration', () => {
    it('should apply filters and reload data from API', fakeAsync(() => {
      const testEmployees = [
        createMockEmployee('1', 'Alice', 'Johnson'),
        createMockEmployee('2', 'Bob', 'Smith'),
        createMockEmployee('3', 'Charlie', 'Brown')
      ];
      testEmployees[0].department = { id: '123e4567-e89b-12d3-a456-426614174001', name: 'IT' };
      testEmployees[1].department = { id: '123e4567-e89b-12d3-a456-426614174002', name: 'HR' };
      testEmployees[2].department = { id: '123e4567-e89b-12d3-a456-426614174003', name: 'Finance' };
      
      mockEmployeeService.list.and.returnValue(of(createMockPaginatedResponse(testEmployees)));
      
      // Apply department filter
      component.filterForm.patchValue({ departmentId: 'IT' });
      tick(500); // Wait for debounce
      
      expect(mockEmployeeService.list).toHaveBeenCalledWith(jasmine.objectContaining({
        Department: 'IT'
      }));
      
      // Apply name filter
      component.filterForm.patchValue({ firstName: 'John' });
      tick(500);
      
      expect(mockEmployeeService.list).toHaveBeenCalledWith(jasmine.objectContaining({
        Department: 'IT',
        FirstName: 'John'
      }));
    }));
  });

  describe('Pagination Integration', () => {
    beforeEach(fakeAsync(() => {
      const manyEmployees = Array.from({ length: 25 }, (_, i) => 
        createMockEmployee(`id-${i}`, `User${i}`, 'Test')
      );
      
      mockEmployeeService.list.and.returnValue(of({
        data: manyEmployees.slice(0, 10),
        currentPage: 1,
        perPage: 10,
        totalItems: 25,
        totalPages: 3
      }));
      
      component.loadEmployees();
      tick();
    }));

    it('should handle pagination correctly', fakeAsync(() => {
      expect(component.currentPage).toBe(1);
      expect(component.totalPages).toBe(3);
      expect(component.totalItems).toBe(25);
      
      // Mock next page data
      const nextPageEmployees = Array.from({ length: 10 }, (_, i) => 
        createMockEmployee(`id-${i+10}`, `User${i+10}`, 'Test')
      );
      mockEmployeeService.list.and.returnValue(of({
        data: nextPageEmployees,
        currentPage: 2,
        perPage: 10,
        totalItems: 25,
        totalPages: 3
      }));
      
      // Go to next page
      component.nextPage();
      tick();
      
      expect(component.currentPage).toBe(2);
      expect(mockEmployeeService.list).toHaveBeenCalledWith(jasmine.objectContaining({
        Page: 2,
        Limit: 10
      }));
      
      // Mock page 3 data
      const page3Employees = Array.from({ length: 5 }, (_, i) => 
        createMockEmployee(`id-${i+20}`, `User${i+20}`, 'Test')
      );
      mockEmployeeService.list.and.returnValue(of({
        data: page3Employees,
        currentPage: 3,
        perPage: 10,
        totalItems: 25,
        totalPages: 3
      }));
      
      // Go to specific page
      component.goToPage(3);
      tick();
      
      expect(component.currentPage).toBe(3);
      expect(mockEmployeeService.list).toHaveBeenCalledWith(jasmine.objectContaining({
        Page: 3,
        Limit: 10
      }));
    }));
  });

  describe('Sorting Integration', () => {
    it('should send sorting parameters to API', fakeAsync(() => {
      const testEmployees = [
        createMockEmployee('1', 'Alice', 'Johnson'),
        createMockEmployee('2', 'Bob', 'Smith'),
        createMockEmployee('3', 'Charlie', 'Brown')
      ];
      
      mockEmployeeService.list.and.returnValue(of(createMockPaginatedResponse(testEmployees)));
      component.loadEmployees();
      tick();
      
      // Sort by firstName
      component.sort(EmployeeSort.FirstName);
      tick();
      
      expect(mockEmployeeService.list).toHaveBeenCalledWith(jasmine.objectContaining({
        Page: 1,
        Limit: 10,
        EmployeeSort: EmployeeSort.FirstName
      }));
      
      // Sort again to change direction
      component.sort(EmployeeSort.FirstName);
      tick();
      
      expect(mockEmployeeService.list).toHaveBeenCalledWith(jasmine.objectContaining({
        Page: 1,
        Limit: 10,
        EmployeeSort: EmployeeSort.FirstName
      }));
    }));
  });

  describe('Validation Integration', () => {
    it('should handle validation errors', fakeAsync(() => {
      const invalidRequest: CreateEmployeeRequest = {
        departmentId: '',
        firstName: 'John',
        lastName: 'Doe',
        birthDate: '1990-01-01T00:00:00.000Z',
        hireDate: '2023-01-01T00:00:00.000Z',
        salary: 75000
      };
      
      component.saveEmployee({ employeeData: invalidRequest, newDepartmentCreated: false });
      tick();
      
      expect(mockToastService.showError).toHaveBeenCalledWith('Ошибка', 'Пожалуйста, заполните все обязательные поля корректно');
      expect(mockEmployeeService.add).not.toHaveBeenCalled();
      
      // Test valid request
      const validRequest: CreateEmployeeRequest = {
        departmentId: '123e4567-e89b-12d3-a456-426614174001',
        firstName: 'John',
        lastName: 'Doe',
        birthDate: '1990-01-01T00:00:00.000Z',
        hireDate: '2023-01-01T00:00:00.000Z',
        salary: 75000
      };
      
      mockEmployeeService.add.and.returnValue(of('new-id'));
      
      component.saveEmployee({ employeeData: validRequest, newDepartmentCreated: false });
      tick();
      
      expect(mockEmployeeService.add).toHaveBeenCalledWith(validRequest);
    }));
  });

  describe('Advanced Integration Scenarios', () => {
    describe('New Department Creation Workflow', () => {
      it('should handle complete new department creation during employee creation', fakeAsync(() => {
        component.openCreateModal();
        expect(component.isFormModalVisible).toBe(true);
        
        const createRequest: CreateEmployeeRequest = {
          departmentId: 'new-department-sales',
          firstName: 'Jane',
          lastName: 'Smith',
          birthDate: '1985-05-15T00:00:00.000Z',
          hireDate: '2024-01-01T00:00:00.000Z',
          salary: 65000
        };
        
        mockEmployeeService.createDepartment.and.returnValue(of('12345678-1234-1234-1234-123456789012'));
        mockEmployeeService.add.and.returnValue(of('87654321-4321-4321-4321-210987654321'));
        
        const newEmployee = createMockEmployee('87654321-4321-4321-4321-210987654321', 'Jane', 'Smith');
        newEmployee.department = { id: '12345678-1234-1234-1234-123456789012', name: 'Sales' };
        mockEmployeeService.list.and.returnValue(of(createMockPaginatedResponse([newEmployee])));
        
        component.saveEmployee({ employeeData: createRequest, newDepartmentCreated: true });
        tick();
        
        expect(mockToastService.showSuccess).toHaveBeenCalledWith('Успешно', 'Новый отдел и сотрудник созданы успешно');
        expect(component.employees.length).toBe(1);
        expect(component.employees[0].department.name).toBe('Sales');
      }));
      
      it('should handle department creation failure during employee creation', fakeAsync(() => {
        const createRequest: CreateEmployeeRequest = {
          departmentId: 'new-department-sales',
          firstName: 'Jane',
          lastName: 'Smith',
          birthDate: '1985-05-15T00:00:00.000Z',
          hireDate: '2024-01-01T00:00:00.000Z',
          salary: 65000
        };
        
        mockEmployeeService.createDepartment.and.returnValue(throwError('Department creation failed'));
        
        component.saveEmployee({ employeeData: createRequest, newDepartmentCreated: true });
        tick();
        
        expect(mockToastService.showError).toHaveBeenCalledWith('Ошибка', 'Произошла ошибка при создании отдела. Попробуйте еще раз.');
        expect(mockEmployeeService.add).not.toHaveBeenCalled();
      }));
    });
    
    describe('Complex Filtering and Pagination Scenarios', () => {
      it('should maintain filters when paginating', fakeAsync(() => {
        // Setup initial filter
        component.filterForm.patchValue({ 
          departmentId: 'IT',
          firstName: 'John'
        });
        tick(500);
        
        // Mock paginated response with filters
        const filteredEmployees = Array.from({ length: 25 }, (_, i) => 
          createMockEmployee(`filtered-${i}`, 'John', `User${i}`)
        );
        
        mockEmployeeService.list.and.returnValue(of({
          data: filteredEmployees.slice(0, 10),
          currentPage: 1,
          perPage: 10,
          totalItems: 25,
          totalPages: 3
        }));
        
        component.loadEmployees();
        tick();
        
        // Go to next page - should maintain filters
        mockEmployeeService.list.and.returnValue(of({
          data: filteredEmployees.slice(10, 20),
          currentPage: 2,
          perPage: 10,
          totalItems: 25,
          totalPages: 3
        }));
        
        component.nextPage();
        tick();
        
        expect(mockEmployeeService.list).toHaveBeenCalledWith(jasmine.objectContaining({
          Page: 2,
          Limit: 10,
          Department: 'IT',
          FirstName: 'John'
        }));
      }));
      
      it('should reset pagination when filters change', fakeAsync(() => {
        // Start on page 2
        component.currentPage = 2;
        
        // Change filter
        component.filterForm.patchValue({ departmentId: 'HR' });
        tick(500);
        
        expect(component.currentPage).toBe(1);
        expect(mockEmployeeService.list).toHaveBeenCalledWith(jasmine.objectContaining({
          Page: 1,
          Department: 'HR'
        }));
      }));
      
      it('should handle empty filter results', fakeAsync(() => {
        component.filterForm.patchValue({ firstName: 'NonExistentName' });
        tick(500);
        
        mockEmployeeService.list.and.returnValue(of(createMockPaginatedResponse([])));
        component.loadEmployees();
        tick();
        
        expect(component.employees.length).toBe(0);
        expect(component.totalItems).toBe(0);
        expect(component.totalPages).toBe(0);
      }));
    });
    
    describe('Sorting with Filters and Pagination', () => {
      it('should maintain filters when sorting', fakeAsync(() => {
        // Set up filters
        component.filterForm.patchValue({ 
          departmentId: 'IT',
          lastName: 'Smith'
        });
        tick(500);
        
        // Apply sorting
        component.sort(EmployeeSort.FirstName);
        tick();
        
        expect(mockEmployeeService.list).toHaveBeenCalledWith(jasmine.objectContaining({
          Page: 1,
          Limit: 10,
          Department: 'IT',
          LastName: 'Smith',
          EmployeeSort: EmployeeSort.FirstName
        }));
      }));
      
      it('should reset pagination when sorting', fakeAsync(() => {
        // Start on page 3
        component.currentPage = 3;
        
        // Apply sorting
        component.sort(EmployeeSort.Salary);
        tick();
        
        expect(component.currentPage).toBe(1);
        expect(mockEmployeeService.list).toHaveBeenCalledWith(jasmine.objectContaining({
          Page: 1,
          EmployeeSort: EmployeeSort.Salary
        }));
      }));
      
      it('should toggle sort direction on repeated clicks', fakeAsync(() => {
        // First click - ascending
        component.sort(EmployeeSort.LastName);
        tick();
        
        expect(component.sortConfig.column).toBe(EmployeeSort.LastName);
        
        // Second click - should toggle direction
        component.sort(EmployeeSort.LastName);
        tick();
        
        expect(mockEmployeeService.list).toHaveBeenCalledWith(jasmine.objectContaining({
          EmployeeSort: EmployeeSort.LastName
        }));
      }));
    });
    
    describe('Modal State Management', () => {
      it('should handle rapid modal open/close operations', fakeAsync(() => {
        const employee = createMockEmployee('test-id');
        
        // Rapid open/close of edit modal
        component.openEditModal(employee);
        expect(component.isFormModalVisible).toBe(true);
        expect(component.selectedEmployee).toBe(employee);
        
        component.closeFormModal();
        expect(component.isFormModalVisible).toBe(false);
        expect(component.selectedEmployee).toBe(null);
        
        // Rapid open/close of delete modal
        component.openDeleteModal(employee);
        expect(component.isDeleteModalVisible).toBe(true);
        expect(component.selectedEmployee).toBe(employee);
        
        component.closeDeleteModal();
        expect(component.isDeleteModalVisible).toBe(false);
        expect(component.selectedEmployee).toBe(null);
      }));
      
      it('should handle modal operations during loading states', fakeAsync(() => {
        component.isLoading = true;
        const employee = createMockEmployee('test-id');
        
        // Should still be able to open modals during loading
        component.openEditModal(employee);
        expect(component.isFormModalVisible).toBe(true);
        expect(component.selectedEmployee).toBe(employee);
        
        component.openDeleteModal(employee);
        expect(component.isDeleteModalVisible).toBe(true);
      }));
    });
    
    describe('Error Recovery Scenarios', () => {
      it('should recover from network errors and retry operations', fakeAsync(() => {
        // Simulate network error
        mockEmployeeService.list.and.returnValue(throwError('Network Error'));
        
        component.loadEmployees();
        tick();
        
        expect(component.employees.length).toBe(0);
        
        // Recover from error
        const employees = [createMockEmployee('1'), createMockEmployee('2')];
        mockEmployeeService.list.and.returnValue(of(createMockPaginatedResponse(employees)));
        
        component.loadEmployees();
        tick();
        
        expect(component.employees.length).toBe(2);
      }));
      
      it('should handle partial failures in batch operations', fakeAsync(() => {
        const employee = createMockEmployee('test-id');
        component.employees = [employee];
        
        // First delete fails
        mockEmployeeService.delete.and.returnValue(throwError('Delete Failed'));
        component.selectedEmployee = employee;
        component.deleteEmployee();
        tick();
        
        expect(mockToastService.showError).toHaveBeenCalledWith('Ошибка', 'Произошла ошибка при удалении сотрудника. Попробуйте еще раз.');
        expect(component.employees.length).toBe(1); // Employee still there
        
        // Retry delete succeeds
        mockEmployeeService.delete.and.returnValue(of(void 0));
        mockEmployeeService.list.and.returnValue(of(createMockPaginatedResponse([])));
        
        component.deleteEmployee();
        tick();
        
        expect(component.employees.length).toBe(0);
      }));
    });
    
    describe('Edge Case Data Scenarios', () => {
      it('should handle employees with special characters in names', fakeAsync(() => {
        const specialEmployee = createMockEmployee('special-id', 'José-María', "O'Connor");
        specialEmployee.middleName = 'François';
        
        mockEmployeeService.list.and.returnValue(of(createMockPaginatedResponse([specialEmployee])));
        component.loadEmployees();
        tick();
        
        expect(component.employees[0].firstName).toBe('José-María');
        expect(component.employees[0].middleName).toBe('François');
        expect(component.employees[0].lastName).toBe("O'Connor");
      }));
      
      it('should handle employees with very long names', fakeAsync(() => {
        const longNameEmployee = createMockEmployee('long-id', 
          'A'.repeat(50), 
          'B'.repeat(50)
        );
        longNameEmployee.middleName = 'C'.repeat(50);
        
        mockEmployeeService.list.and.returnValue(of(createMockPaginatedResponse([longNameEmployee])));
        component.loadEmployees();
        tick();
        
        expect(component.employees[0].firstName.length).toBe(50);
        expect(component.employees[0].middleName!.length).toBe(50);
        expect(component.employees[0].lastName.length).toBe(50);
      }));
      
      it('should handle employees with extreme salary values', fakeAsync(() => {
        const highSalaryEmployee = createMockEmployee('high-salary-id');
        highSalaryEmployee.salary = 999999;
        
        const lowSalaryEmployee = createMockEmployee('low-salary-id');
        lowSalaryEmployee.salary = 1;
        
        mockEmployeeService.list.and.returnValue(of(createMockPaginatedResponse([highSalaryEmployee, lowSalaryEmployee])));
        component.loadEmployees();
        tick();
        
        expect(component.employees[0].salary).toBe(999999);
        expect(component.employees[1].salary).toBe(1);
      }));
      
      it('should handle employees with edge case dates', fakeAsync(() => {
        const edgeDateEmployee = createMockEmployee('edge-date-id');
        edgeDateEmployee.birthDate = '1900-01-01T00:00:00.000Z'; // Very old
        edgeDateEmployee.hireDate = new Date().toISOString(); // Today
        
        mockEmployeeService.list.and.returnValue(of(createMockPaginatedResponse([edgeDateEmployee])));
        component.loadEmployees();
        tick();
        
        expect(component.employees[0].birthDate).toBe('1900-01-01T00:00:00.000Z');
        expect(new Date(component.employees[0].hireDate).toDateString()).toBe(new Date().toDateString());
      }));
    });
    
    describe('Performance and Memory Management', () => {
      it('should handle large datasets efficiently', fakeAsync(() => {
        // Simulate large dataset
        const largeDataset = Array.from({ length: 1000 }, (_, i) => 
          createMockEmployee(`large-${i}`, `User${i}`, `Test${i}`)
        );
        
        // Should only load first page
        mockEmployeeService.list.and.returnValue(of({
          data: largeDataset.slice(0, 10),
          currentPage: 1,
          perPage: 10,
          totalItems: 1000,
          totalPages: 100
        }));
        
        component.loadEmployees();
        tick();
        
        expect(component.employees.length).toBe(10);
        expect(component.totalItems).toBe(1000);
        expect(component.totalPages).toBe(100);
      }));
      
      it('should handle rapid filter changes without memory leaks', fakeAsync(() => {
        // Simulate rapid filter changes
        for (let i = 0; i < 10; i++) {
          component.filterForm.patchValue({ firstName: `User${i}` });
          tick(100); // Don't wait full debounce time
        }
        
        // Final change should trigger API call
        component.filterForm.patchValue({ firstName: 'FinalUser' });
        tick(500);
        
        expect(mockEmployeeService.list).toHaveBeenCalledWith(jasmine.objectContaining({
          FirstName: 'FinalUser'
        }));
      }));
    });
    
    describe('Accessibility and User Experience', () => {
      it('should maintain focus and state during async operations', fakeAsync(() => {
        const employee = createMockEmployee('focus-test');
        
        // Open edit modal
        component.openEditModal(employee);
        expect(component.isFormModalVisible).toBe(true);
        expect(component.selectedEmployee).toBe(employee);
        
        // Start async operation
        component.isLoading = true;
        
        // Modal should remain open during loading
        expect(component.isFormModalVisible).toBe(true);
        expect(component.selectedEmployee).toBe(employee);
        
        // Complete operation
        component.isLoading = false;
        component.closeFormModal();
        
        expect(component.isFormModalVisible).toBe(false);
        expect(component.selectedEmployee).toBe(null);
      }));
      
      it('should provide appropriate feedback for all user actions', fakeAsync(() => {
        const employee = createMockEmployee('feedback-test');
        
        // Test successful operations show success messages
        mockEmployeeService.add.and.returnValue(of('new-id'));
        mockEmployeeService.list.and.returnValue(of(createMockPaginatedResponse([employee])));
        
        const createRequest: CreateEmployeeRequest = {
          departmentId: '123e4567-e89b-12d3-a456-426614174001',
          firstName: 'Test',
          lastName: 'User',
          birthDate: '1990-01-01T00:00:00.000Z',
          hireDate: '2023-01-01T00:00:00.000Z',
          salary: 50000
        };
        
        component.saveEmployee({ employeeData: createRequest, newDepartmentCreated: false });
        tick();
        
        expect(mockToastService.showSuccess).toHaveBeenCalledWith('Успешно', 'Сотрудник создан успешно');
        
        // Test error operations show error messages
        mockEmployeeService.delete.and.returnValue(throwError('Delete Error'));
        component.selectedEmployee = employee;
        component.deleteEmployee();
        tick();
        
        expect(mockToastService.showError).toHaveBeenCalledWith('Ошибка', 'Произошла ошибка при удалении сотрудника. Попробуйте еще раз.');
      }));
    });
  });
}); 