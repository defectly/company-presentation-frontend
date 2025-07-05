import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { 
  Employee, 
  EmployeeFilter, 
  SortConfig, 
  CreateEmployeeRequest, 
  UpdateEmployeeRequest, 
  EmployeeListParams,
  Department,
  EmployeeSort,
  SortDirection,
  ColumnConfig
} from '../../core/models/employee.model';
import { EmployeeService } from '../../core/services/employee.service';
import { ToastService } from '../../core/services/toast.service';
import { EmployeeFormModalComponent } from '../../shared/components/employee-form-modal.component';
import { DeleteConfirmationModalComponent } from '../../shared/components/delete-confirmation-modal.component';
import { AutocompleteDropdownComponent, AutocompleteOption } from '../../shared/components/autocomplete-dropdown.component';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    EmployeeFormModalComponent, 
    DeleteConfirmationModalComponent,
    AutocompleteDropdownComponent
  ],
  templateUrl: './employees.component.html',
  styleUrl: './employees.component.css'
})
export class EmployeesComponent implements OnInit, OnDestroy {
  // Make enums available in template
  readonly EmployeeSort = EmployeeSort;
  readonly SortDirection = SortDirection;

  filterForm: FormGroup;
  sortConfig: SortConfig = { column: EmployeeSort.None, direction: SortDirection.None };
  employees: Employee[] = [];
  departments: Department[] = [];
  departmentOptions: AutocompleteOption[] = [];
  
  // Pagination
  currentPage = 1;
  perPage = 10;
  totalItems = 0;
  totalPages = 0;

  isFormModalVisible = false;
  isDeleteModalVisible = false;
  selectedEmployee: Employee | null = null;
  isLoading = false;

  private destroy$ = new Subject<void>();

  constructor(
    private employeeService: EmployeeService,
    private fb: FormBuilder,
    private toastService: ToastService
  ) {
    this.filterForm = this.createFilterForm();
  }

  ngOnInit(): void {
    this.loadEmployees();
    this.setupFilterChanges();
    this.loadDepartments();
  }

  private loadDepartments(): void {
    this.employeeService.getDepartments().subscribe((departments: Department[]) => {
      this.departments = departments;
      this.departmentOptions = departments.map(dept => ({
        value: dept.name,
        label: dept.name
      }));
    });
  } 

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createFilterForm(): FormGroup {
    return this.fb.group({
      departmentId: [''],
      firstName: [''],
      middleName: [''],
      lastName: [''],
      birthDate: [''],
      hireDate: [''],
      salary: ['']
    });
  }

  private setupFilterChanges(): void {
    this.filterForm.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        if (!this.isLoading) {
          this.currentPage = 1;
          this.loadEmployees();
        }
      });
  }

  loadEmployees(): void {
    this.isLoading = true;
    const filters = this.filterForm.value;
    
    const params: EmployeeListParams = {
      Page: this.currentPage,
      Limit: this.perPage
    };

    // Add filters to params with proper type checking
    if (this.isValidFilterValue(filters.departmentId)) params.Department = filters.departmentId;
    if (this.isValidFilterValue(filters.firstName)) params.FirstName = filters.firstName;
    if (this.isValidFilterValue(filters.middleName)) params.MiddleName = filters.middleName;
    if (this.isValidFilterValue(filters.lastName)) params.LastName = filters.lastName;
    if (this.isValidFilterValue(filters.birthDate)) params.MinBirthDate = filters.birthDate;
    if (this.isValidFilterValue(filters.hireDate)) params.MinHireDate = filters.hireDate;
    if (this.isValidFilterValue(filters.salary)) {
      const salaryNumber = parseFloat(filters.salary);
      if (!isNaN(salaryNumber) && salaryNumber > 0) {
        params.MinSalary = salaryNumber;
      }
    }

    // Add sorting parameters with enum validation
    if (this.isValidEmployeeSort(this.sortConfig.column) && this.sortConfig.column !== EmployeeSort.None) {
      params.EmployeeSort = this.sortConfig.column;
      params.SortDirection = this.sortConfig.direction;
    }

    this.employeeService.list(params)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response) => {
          this.employees = response.data;
          this.currentPage = response.currentPage;
          this.perPage = response.perPage;
          this.totalItems = response.totalItems;
          this.totalPages = response.totalPages;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading employees:', error);
          this.toastService.showError('Ошибка', 'Ошибка загрузки сотрудников');
          this.isLoading = false;
        }
      });
  }

  sort(column: EmployeeSort): void {
    if (!this.isValidEmployeeSort(column)) {
      console.warn('Invalid EmployeeSort value:', column);
      return;
    }

    if (this.sortConfig.column === column) {
      this.sortConfig.direction = this.sortConfig.direction === SortDirection.Ascending 
        ? SortDirection.Descending 
        : SortDirection.Ascending;
    } else {
      this.sortConfig = { column, direction: SortDirection.Ascending };
    }
    
    // Reset pagination when sorting
    this.currentPage = 1;
    this.loadEmployees();
  }

  getSortIcon(column: EmployeeSort): string {
    if (!this.isValidEmployeeSort(column) || this.sortConfig.column !== column) {
      return 'bi-arrow-down-up';
    }
    return this.sortConfig.direction === SortDirection.Ascending ? 'bi-arrow-up' : 'bi-arrow-down';
  }

  clearFilters(): void {
    this.filterForm.reset({
      departmentId: '',
      firstName: '',
      middleName: '',
      lastName: '',
      birthDate: '',
      hireDate: '',
      salary: ''
    });
    this.sortConfig = { column: EmployeeSort.None, direction: SortDirection.None };
    this.loadEmployees();
  }

  // Pagination methods
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadEmployees();
    }
  }

  previousPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  openCreateModal(): void {
    this.selectedEmployee = null;
    this.isFormModalVisible = true;
  }

  openEditModal(employee: Employee): void {
    this.selectedEmployee = employee;
    this.isFormModalVisible = true;
  }

  openDeleteModal(employee: Employee): void {
    this.selectedEmployee = employee;
    this.isDeleteModalVisible = true;
  }

  closeFormModal(): void {
    this.isFormModalVisible = false;
    this.selectedEmployee = null;
  }

  closeDeleteModal(): void {
    this.isDeleteModalVisible = false;
    this.selectedEmployee = null;
  }

  async saveEmployee(event: { employeeData: UpdateEmployeeRequest | CreateEmployeeRequest; newDepartmentCreated: boolean }): Promise<void> {
    const { employeeData, newDepartmentCreated } = event;
    let actuallyCreatedDepartment = false;
    
    // Handle new department creation if needed
    if (newDepartmentCreated && employeeData.departmentId && employeeData.departmentId.startsWith('new-department-')) {
      const departmentName = employeeData.departmentId.replace('new-department-', '');
      
      try {
        const newDepartmentId = await this.employeeService.createDepartment({ name: departmentName }).toPromise();
        if (!newDepartmentId) {
          throw new Error('Department creation failed: no ID returned.');
        }
        employeeData.departmentId = newDepartmentId;
        actuallyCreatedDepartment = true;
      } catch (error) {
        this.toastService.showError('Ошибка', 'Произошла ошибка при создании отдела. Попробуйте еще раз.');
        return;
      }
    }
    
    if (!this.validateEmployeeData(employeeData)) {
      console.error('invalid employee data', employeeData);
      this.toastService.showError('Ошибка', 'Пожалуйста, заполните все обязательные поля корректно');
      return;
    }

    this.isLoading = true;
    
    if (this.selectedEmployee) {
      // Update existing employee
      this.employeeService.update(this.selectedEmployee.id, employeeData as UpdateEmployeeRequest).subscribe({
        next: () => {
          this.isLoading = false;
          this.closeFormModal();
          const message = actuallyCreatedDepartment ? 'Новый отдел и сотрудник обновлены успешно' : 'Сотрудник обновлен успешно';
          this.toastService.showSuccess('Успешно', message);
          if (newDepartmentCreated) {
            this.loadDepartments();
          }
          this.loadEmployees();
        },
        error: (error: any) => {
          this.isLoading = false;
          this.toastService.showError('Ошибка', 'Произошла ошибка при обновлении сотрудника. Попробуйте еще раз.');
        }
      });
    } else {
      // Create new employee
      this.employeeService.add(employeeData as CreateEmployeeRequest).subscribe({
        next: () => {
          this.isLoading = false;
          this.closeFormModal();
          const message = actuallyCreatedDepartment ? 'Новый отдел и сотрудник созданы успешно' : 'Сотрудник создан успешно';
          this.toastService.showSuccess('Успешно', message);
          if (newDepartmentCreated) {
            this.loadDepartments();
          }
          this.loadEmployees();
        },
        error: (error: any) => {
          this.isLoading = false;
          this.toastService.showError('Ошибка', 'Произошла ошибка при создании сотрудника. Попробуйте еще раз.');
        }
      });
    }
  }

  private validateEmployeeData(employeeData: UpdateEmployeeRequest | CreateEmployeeRequest): boolean {
    const validationErrors: string[] = [];

    if (!employeeData.departmentId) {
      validationErrors.push('Department ID is required');
    } else if (!this.isValidGuid(employeeData.departmentId)) {
      validationErrors.push('Department ID is not a valid GUID');
    }

    if (!employeeData.firstName) {
      validationErrors.push('First name is required');
    } else if (employeeData.firstName.trim().length === 0) {
      validationErrors.push('First name cannot be empty');
    }

    if (!employeeData.lastName) {
      validationErrors.push('Last name is required');
    } else if (employeeData.lastName.trim().length === 0) {
      validationErrors.push('Last name cannot be empty');
    }

    if (!employeeData.birthDate) {
      validationErrors.push('Birth date is required');
    } else if (!this.isValidDate(employeeData.birthDate)) {
      validationErrors.push('Birth date is not valid');
    }

    if (!employeeData.hireDate) {
      validationErrors.push('Hire date is required');
    } else if (!this.isValidDate(employeeData.hireDate)) {
      validationErrors.push('Hire date is not valid');
    }

    if (employeeData.salary === undefined || employeeData.salary === null) {
      validationErrors.push('Salary is required');
    } else if (employeeData.salary <= 0) {
      validationErrors.push('Salary must be greater than 0');
    }

    if (validationErrors.length > 0) {
      console.error('Validation errors:', validationErrors);
      return false;
    }

    return true;
  }

  deleteEmployee(): void {
    if (!this.selectedEmployee) return;
    
    this.isLoading = true;
    this.employeeService.delete(this.selectedEmployee.id).subscribe({
      next: () => {
        this.isLoading = false;
        this.closeDeleteModal();
        this.toastService.showSuccess('Успешно', 'Сотрудник удален успешно');
        this.loadEmployees();
      },
      error: (error) => {
        console.error('Error deleting employee:', error);
        this.isLoading = false;
        this.toastService.showError('Ошибка', 'Произошла ошибка при удалении сотрудника. Попробуйте еще раз.');
      }
    });
  }

  getFullName(employee: Employee): string {
    const parts = [employee.firstName, employee.middleName, employee.lastName].filter(Boolean);
    return parts.join(' ');
  }

  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString;
      }
      return date.toLocaleDateString('ru-RU');
    } catch {
      return dateString;
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB'
    }).format(amount);
  }

  // Type guard methods for robust type checking
  private isValidEmployeeSort(value: any): value is EmployeeSort {
    return Object.values(EmployeeSort).includes(value);
  }

  private isValidFilterValue(value: any): value is string {
    return typeof value === 'string' && value.trim().length > 0;
  }

  private isValidGuid(value: string): boolean {
    const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return guidRegex.test(value);
  }

  private isValidDate(value: string): boolean {
    const date = new Date(value);
    return date instanceof Date && !isNaN(date.getTime());
  }
} 