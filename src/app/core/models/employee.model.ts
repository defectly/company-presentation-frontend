export interface Department {
  id: string;
  name: string;
}

export interface Employee {
  id: string;
  department: Department;
  firstName: string;
  middleName?: string;
  lastName: string;
  birthDate: string;
  hireDate: string;
  salary: number;
}

export interface CreateEmployeeRequest {
  departmentId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  birthDate: string;
  hireDate: string;
  salary: number;
}

export interface UpdateEmployeeRequest {
  departmentId?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  birthDate?: string;
  hireDate?: string;
  salary?: number;
}

export interface EmployeeListParams {
  Page?: number;
  Limit?: number;
  Department?: string;
  FirstName?: string;
  MiddleName?: string;
  LastName?: string;
  BirthDate?: string;
  HireDate?: string;
  Salary?: number;
  MinBirthDate?: string;
  MaxBirthDate?: string;
  MinHireDate?: string;
  MaxHireDate?: string;
  MinSalary?: number;
  MaxSalary?: number;
  SortDirection?: SortDirection;
  EmployeeSort?: EmployeeSort;
}

export interface PaginatedResponse<T> {
  data: T[];
  currentPage: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
}

export interface EmployeeFilter {
  department: string;
  fullName: string;
  birthDate: string;
  hireDate: string;
  salary: string;
}

export enum SortDirection {
  None = 0,
  Ascending = 1,
  Descending = 2
}

export enum EmployeeSort {
  None = 0,
  Department = 1,
  FirstName = 2,
  MiddleName = 3,
  LastName = 4,
  BirthDate = 5,
  HireDate = 6,
  Salary = 7
}

export enum DepartmentSort {
  None = 0,
  Name = 1
}

export interface DepartmentListParams {
  Name?: string;
  DepartmentSort?: DepartmentSort;
  SortDirection?: SortDirection;
}

export interface CreateDepartmentRequest {
  name: string;
}

export interface SortConfig {
  column: EmployeeSort;
  direction: SortDirection;
}

export interface ColumnConfig {
  key: string;
  label: string;
  sortable: boolean;
  sortColumn?: EmployeeSort;
  width?: string;
} 