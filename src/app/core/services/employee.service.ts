import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { 
  Employee, 
  CreateEmployeeRequest, 
  UpdateEmployeeRequest, 
  EmployeeListParams, 
  PaginatedResponse,
  Department,
  DepartmentListParams,
  CreateDepartmentRequest,
  EmployeeSort,
  SortDirection,
  DepartmentSort
} from '../models/employee.model';
import { environment } from '../../../environments/environment';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private readonly apiUrl = `${environment.apiBaseUrl}/Employees`;
  private readonly departmentApiUrl = `${environment.apiBaseUrl}/Departments`;

  constructor(private http: HttpClient, private toastService: ToastService) {}

  list(params?: EmployeeListParams): Observable<PaginatedResponse<Employee>> {
    let httpParams = new HttpParams();

    if (params) {
      // Type-safe parameter building
      const validatedParams = this.validateEmployeeListParams(params);
      Object.entries(validatedParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }

    return this.http.get<PaginatedResponse<Employee>>(this.apiUrl, { params: httpParams })
      .pipe(
        map(response => this.validatePaginatedResponse(response)),
        catchError(error => {
          console.error('Error fetching employees:', error);
          return of({
            data: [],
            currentPage: 1,
            perPage: 10,
            totalItems: 0,
            totalPages: 0
          } as PaginatedResponse<Employee>);
        })
      );
  }

  add(employee: CreateEmployeeRequest): Observable<string> {
    const validatedEmployee = this.validateCreateEmployeeRequest(employee);
    if (!validatedEmployee) {
      throw new Error('Invalid employee data provided');
    }

    return this.http.post<string>(this.apiUrl, validatedEmployee)
      .pipe(
        catchError(error => {
          this.toastService.showError('Ошибка создания', 'Не удалось создать сотрудника. Пожалуйста, попробуйте еще раз.');
          console.error('Error creating employee:', error);
          throw error;
        })
      );
  }

  update(id: string, employee: UpdateEmployeeRequest): Observable<void> {
    if (!this.isValidGuid(id)) {
      throw new Error('Invalid employee ID provided');
    }

    const validatedEmployee = this.validateUpdateEmployeeRequest(employee);
    if (!validatedEmployee) {
      throw new Error('Invalid employee data provided');
    }

    const updateUrl = `${this.apiUrl}/${id}`;

    return this.http.put<void>(updateUrl, validatedEmployee)
      .pipe(
        catchError(error => {
          this.toastService.showError('Ошибка обновления', 'Не удалось обновить сотрудника. Пожалуйста, попробуйте еще раз.');
          console.error('Error updating employee:', error);
          throw error;
        })
      );
  }

  delete(id: string): Observable<void> {
    if (!this.isValidGuid(id)) {
      throw new Error('Invalid employee ID provided');
    }

    const deleteUrl = `${this.apiUrl}/${id}`;
    console.log('Attempting to delete employee at URL:', deleteUrl);
    
    return this.http.delete<void>(deleteUrl)
      .pipe(
        catchError(error => {
          this.toastService.showError('Ошибка удаления', 'Не удалось удалить сотрудника. Пожалуйста, попробуйте еще раз.');
          console.error('Error deleting employee:', error);
          console.error('Request URL:', deleteUrl);
          console.error('Error details:', {
            status: error.status,
            statusText: error.statusText,
            url: error.url,
            message: error.message
          });
          
          if (error.error && typeof error.error === 'string' && error.error.includes('<!DOCTYPE')) {
            console.error('Server returned HTML instead of JSON - this suggests a proxy or routing issue');
          }
          
          throw error;
        })
      );
  }

  getById(id: string): Observable<Employee | undefined> {
    if (!this.isValidGuid(id)) {
      return of(undefined);
    }

    return this.http.get<Employee>(`${this.apiUrl}/${id}`)
      .pipe(
        map(employee => this.validateEmployee(employee)),
        catchError(error => {
          console.error('Error fetching employee by id:', error);
          return of(undefined);
        })
      );
  }

  // Department methods with enhanced type checking
  getDepartments(params?: DepartmentListParams): Observable<Department[]> {
    let httpParams = new HttpParams();

    if (params) {
      const validatedParams = this.validateDepartmentListParams(params);
      Object.entries(validatedParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }

    return this.http.get<Department[]>(this.departmentApiUrl, { params: httpParams })
      .pipe(
        map(departments => departments.map((dept: any) => this.validateDepartment(dept)).filter(Boolean) as Department[]),
        catchError(error => {
          console.error('Error fetching departments:', error);
          return of([]);
        })
      );
  }

  getDepartmentById(id: string): Observable<Department | undefined> {
    if (!this.isValidGuid(id)) {
      return of(undefined);
    }

    return this.http.get<Department>(`${this.departmentApiUrl}/${id}`)
      .pipe(
        map(department => this.validateDepartment(department)),
        catchError(error => {
          console.error('Error fetching department by id:', error);
          return of(undefined);
        })
      );
  }

  createDepartment(department: CreateDepartmentRequest): Observable<string> {
    const validatedDepartment = this.validateCreateDepartmentRequest(department);
    if (!validatedDepartment) {
      throw new Error('Invalid department data provided');
    }

    return this.http.post<string>(this.departmentApiUrl, validatedDepartment)
      .pipe(
        catchError(error => {
          this.toastService.showError('Ошибка создания', 'Не удалось создать отдел. Пожалуйста, попробуйте еще раз.');
          console.error('Error creating department:', error);
          throw error;
        })
      );
  }

  updateDepartment(id: string, name: string): Observable<void> {
    if (!this.isValidGuid(id)) {
      throw new Error('Invalid department ID provided');
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new Error('Invalid department name provided');
    }

    const updateUrl = `${this.departmentApiUrl}/${id}`;
    
    return this.http.put<void>(updateUrl, { name: name.trim() })
      .pipe(
        catchError(error => {
          this.toastService.showError('Ошибка обновления', 'Не удалось обновить отдел. Пожалуйста, попробуйте еще раз.');
          console.error('Error updating department:', error);
          throw error;
        })
      );
  }

  deleteDepartment(id: string): Observable<void> {
    if (!this.isValidGuid(id)) {
      throw new Error('Invalid department ID provided');
    }

    const deleteUrl = `${this.departmentApiUrl}/${id}`;
    
    return this.http.delete<void>(deleteUrl)
      .pipe(
        catchError(error => {
          this.toastService.showError('Ошибка удаления', 'Не удалось удалить отдел. Пожалуйста, попробуйте еще раз.');
          console.error('Error deleting department:', error);
          throw error;
        })
      );
  }

  // Type validation methods
  private validateEmployeeListParams(params: EmployeeListParams): EmployeeListParams {
    const validated: EmployeeListParams = {};

    // Handle Page - set default to 1 for negative or zero values
    if (params.Page !== undefined && params.Page !== null) {
      validated.Page = params.Page <= 0 ? 1 : Math.floor(params.Page);
    }
    
    // Handle Limit - set default to 10 for negative or zero values
    if (params.Limit !== undefined && params.Limit !== null) {
      validated.Limit = params.Limit <= 0 ? 10 : Math.min(100, Math.floor(params.Limit));
    }
    
    if (params.Department !== undefined) {
      validated.Department = params.Department === null ? '' : (typeof params.Department === 'string' ? params.Department.trim() : '');
    }
    if (params.FirstName !== undefined) {
      validated.FirstName = params.FirstName === null ? '' : (typeof params.FirstName === 'string' ? params.FirstName.trim() : '');
    }
    if (params.MiddleName && typeof params.MiddleName === 'string') validated.MiddleName = params.MiddleName.trim();
    if (params.LastName && typeof params.LastName === 'string') validated.LastName = params.LastName.trim();
    if (params.BirthDate && this.isValidDateString(params.BirthDate)) validated.BirthDate = params.BirthDate;
    if (params.HireDate && this.isValidDateString(params.HireDate)) validated.HireDate = params.HireDate;
    if (params.Salary !== undefined && typeof params.Salary === 'number' && params.Salary >= 0) validated.Salary = params.Salary;
    if (params.MinBirthDate && this.isValidDateString(params.MinBirthDate)) validated.MinBirthDate = params.MinBirthDate;
    if (params.MaxBirthDate && this.isValidDateString(params.MaxBirthDate)) validated.MaxBirthDate = params.MaxBirthDate;
    if (params.MinHireDate && this.isValidDateString(params.MinHireDate)) validated.MinHireDate = params.MinHireDate;
    if (params.MaxHireDate && this.isValidDateString(params.MaxHireDate)) validated.MaxHireDate = params.MaxHireDate;
    if (params.MinSalary !== undefined && typeof params.MinSalary === 'number' && params.MinSalary >= 0) validated.MinSalary = params.MinSalary;
    if (params.MaxSalary !== undefined && typeof params.MaxSalary === 'number' && params.MaxSalary >= 0) validated.MaxSalary = params.MaxSalary;
    if (this.isValidSortDirection(params.SortDirection)) validated.SortDirection = params.SortDirection;
    if (this.isValidEmployeeSort(params.EmployeeSort)) validated.EmployeeSort = params.EmployeeSort;

    return validated;
  }

  private validateDepartmentListParams(params: DepartmentListParams): DepartmentListParams {
    const validated: DepartmentListParams = {};

    if (params.Name && typeof params.Name === 'string') validated.Name = params.Name.trim();
    if (this.isValidDepartmentSort(params.DepartmentSort)) validated.DepartmentSort = params.DepartmentSort;
    if (this.isValidSortDirection(params.SortDirection)) validated.SortDirection = params.SortDirection;

    return validated;
  }

  private validateCreateEmployeeRequest(employee: CreateEmployeeRequest): CreateEmployeeRequest | null {
    if (!employee.departmentId || !this.isValidGuid(employee.departmentId)) return null;
    if (!employee.firstName || typeof employee.firstName !== 'string' || employee.firstName.trim().length === 0) return null;
    if (!employee.lastName || typeof employee.lastName !== 'string' || employee.lastName.trim().length === 0) return null;
    if (!employee.birthDate || !this.isValidDateString(employee.birthDate)) return null;
    if (!employee.hireDate || !this.isValidDateString(employee.hireDate)) return null;
    if (employee.salary === undefined || employee.salary === null || typeof employee.salary !== 'number' || employee.salary <= 0) return null;

    // Validate middleName - if provided, it must not be empty
    if (employee.middleName !== undefined && employee.middleName !== null) {
      if (typeof employee.middleName !== 'string' || employee.middleName.trim().length === 0) {
        return null;
      }
    }

    const result: CreateEmployeeRequest = {
      departmentId: employee.departmentId,
      firstName: employee.firstName.trim(),
      lastName: employee.lastName.trim(),
      birthDate: employee.birthDate,
      hireDate: employee.hireDate,
      salary: employee.salary
    };

    // Only include middleName if it's provided and valid
    if (employee.middleName !== undefined && employee.middleName !== null && typeof employee.middleName === 'string' && employee.middleName.trim().length > 0) {
      result.middleName = employee.middleName.trim();
    }

    return result;
  }

  private validateUpdateEmployeeRequest(employee: UpdateEmployeeRequest): UpdateEmployeeRequest | null {
    const validated: UpdateEmployeeRequest = {};
    let hasValidFields = false;

    if (employee.departmentId !== undefined) {
      if (this.isValidGuid(employee.departmentId)) {
        validated.departmentId = employee.departmentId;
        hasValidFields = true;
      } else {
        // Invalid department ID provided
        return null;
      }
    }

    if (employee.firstName !== undefined) {
      if (typeof employee.firstName === 'string' && employee.firstName.trim().length > 0) {
        validated.firstName = employee.firstName.trim();
        hasValidFields = true;
      } else {
        // Invalid first name provided
        return null;
      }
    }

    if (employee.middleName !== undefined) {
      if (employee.middleName === null || employee.middleName === '') {
        // Reject empty middle name when provided
        return null;
      } else if (typeof employee.middleName === 'string' && employee.middleName.trim().length > 0) {
        validated.middleName = employee.middleName.trim();
        hasValidFields = true;
      }
    }

    if (employee.lastName !== undefined) {
      if (typeof employee.lastName === 'string' && employee.lastName.trim().length > 0) {
        validated.lastName = employee.lastName.trim();
        hasValidFields = true;
      } else {
        // Invalid last name provided
        return null;
      }
    }

    if (employee.birthDate !== undefined) {
      if (this.isValidDateString(employee.birthDate)) {
        validated.birthDate = employee.birthDate;
        hasValidFields = true;
      } else {
        // Invalid birth date provided
        return null;
      }
    }

    if (employee.hireDate !== undefined) {
      if (this.isValidDateString(employee.hireDate)) {
        validated.hireDate = employee.hireDate;
        hasValidFields = true;
      } else {
        // Invalid hire date provided
        return null;
      }
    }

    if (employee.salary !== undefined) {
      if (typeof employee.salary === 'number' && employee.salary > 0) {
        validated.salary = employee.salary;
        hasValidFields = true;
      } else {
        // Invalid salary provided
        return null;
      }
    }

    return hasValidFields ? validated : null;
  }

  private validateCreateDepartmentRequest(department: CreateDepartmentRequest): CreateDepartmentRequest | null {
    if (!department.name || typeof department.name !== 'string' || department.name.trim().length === 0) {
      return null;
    }

    return {
      name: department.name.trim()
    };
  }

  private validateEmployee(employee: any): Employee | undefined {
    // Basic object validation
    if (!employee || typeof employee !== 'object') {
      console.warn('Employee validation failed: not an object', employee);
      return undefined;
    }

    // Required fields validation
    if (!employee.id || !this.isValidGuid(employee.id)) {
      console.warn('Employee validation failed: invalid ID', employee.id);
      return undefined;
    }

    if (!employee.department || !this.validateDepartment(employee.department)) {
      console.warn('Employee validation failed: invalid department', employee.department);
      return undefined;
    }

    if (typeof employee.firstName !== 'string' || employee.firstName.trim().length === 0) {
      console.warn('Employee validation failed: firstName not a string or empty', employee.firstName);
      return undefined;
    }

    if (typeof employee.lastName !== 'string' || employee.lastName.trim().length === 0) {
      console.warn('Employee validation failed: lastName not a string or empty', employee.lastName);
      return undefined;
    }

    if (!employee.birthDate || !this.isValidDateString(employee.birthDate)) {
      console.warn('Employee validation failed: invalid birthDate', employee.birthDate);
      return undefined;
    }

    if (!employee.hireDate || !this.isValidDateString(employee.hireDate)) {
      console.warn('Employee validation failed: invalid hireDate', employee.hireDate);
      return undefined;
    }

    if (typeof employee.salary !== 'number' || employee.salary < 0) {
      console.warn('Employee validation failed: invalid salary', employee.salary);
      return undefined;
    }

    // middleName is optional, but if present, should be a non-empty string
    if (employee.middleName !== undefined && employee.middleName !== null) {
      if (typeof employee.middleName !== 'string' || employee.middleName.trim().length === 0) {
        console.warn('Employee validation failed: middleName not a string or empty', employee.middleName);
        return undefined;
      }
    }

    return employee as Employee;
  }

  private validateDepartment(department: any): Department | undefined {
    if (!department || typeof department !== 'object') {
      console.warn('Department validation failed: not an object', department);
      return undefined;
    }

    if (!department.id || !this.isValidGuid(department.id)) {
      console.warn('Department validation failed: invalid ID', department.id);
      return undefined;
    }

    if (typeof department.name !== 'string' || department.name.trim().length === 0) {
      console.warn('Department validation failed: name not a string or empty', department.name);
      return undefined;
    }

    return department as Department;
  }

  private validatePaginatedResponse(response: any): PaginatedResponse<Employee> {
    if (!response || typeof response !== 'object') {
      return { data: [], currentPage: 1, perPage: 10, totalItems: 0, totalPages: 0 };
    }

    const data = Array.isArray(response.data) 
      ? response.data.map((emp: any) => this.validateEmployee(emp)).filter(Boolean) as Employee[]
      : [];

    // Handle missing data array case
    if (!Array.isArray(response.data)) {
      return {
        data: [],
        currentPage: 1,
        perPage: 10,
        totalItems: 0,
        totalPages: 0
      };
    }

    // Handle invalid pagination values
    const currentPage = (response.currentPage && response.currentPage > 0) ? Math.floor(response.currentPage) : 1;
    const perPage = (response.perPage && response.perPage > 0) ? Math.min(100, Math.floor(response.perPage)) : 10;
    const totalItems = (response.totalItems && response.totalItems >= 0) ? Math.floor(response.totalItems) : 0;
    const totalPages = (response.totalPages && response.totalPages >= 0) ? Math.floor(response.totalPages) : 0;

    return {
      data,
      currentPage,
      perPage,
      totalItems,
      totalPages
    };
  }

  // Type guard methods
  private isValidEmployeeSort(value: any): value is EmployeeSort {
    return typeof value === 'number' && Object.values(EmployeeSort).includes(value);
  }

  private isValidDepartmentSort(value: any): value is DepartmentSort {
    return typeof value === 'number' && Object.values(DepartmentSort).includes(value);
  }

  private isValidSortDirection(value: any): value is SortDirection {
    return typeof value === 'number' && Object.values(SortDirection).includes(value);
  }

  private isValidGuid(value: any): value is string {
    if (typeof value !== 'string') return false;
    const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return guidRegex.test(value);
  }

  private isValidDateString(value: any): value is string {
    if (typeof value !== 'string') return false;
    const date = new Date(value);
    return date instanceof Date && !isNaN(date.getTime());
  }
} 