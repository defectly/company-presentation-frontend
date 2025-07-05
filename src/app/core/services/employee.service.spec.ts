import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { EmployeeService } from './employee.service';
import { Employee, CreateEmployeeRequest, UpdateEmployeeRequest, PaginatedResponse, Department, EmployeeListParams, DepartmentListParams, CreateDepartmentRequest, DepartmentSort, SortDirection } from '../models/employee.model';
import { environment } from '../../../environments/environment';
import { ToastService } from './toast.service';

describe('EmployeeService', () => {
  let service: EmployeeService;
  let httpMock: HttpTestingController;
  let toastService: jasmine.SpyObj<ToastService>;

  const mockDepartment: Department = {
    id: '123e4567-e89b-12d3-a456-426614174001',
    name: 'IT'
  };

  const mockEmployee: Employee = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    department: mockDepartment,
    firstName: 'John',
    middleName: 'Michael',
    lastName: 'Doe',
    birthDate: '1990-01-01T00:00:00.000Z',
    hireDate: '2023-01-01T00:00:00.000Z',
    salary: 75000
  };

  const mockPaginatedResponse: PaginatedResponse<Employee> = {
    data: [mockEmployee],
    currentPage: 1,
    perPage: 10,
    totalItems: 1,
    totalPages: 1
  };

  beforeEach(() => {
    const toastSpy = jasmine.createSpyObj('ToastService', ['showError', 'showSuccess']);
    
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        EmployeeService,
        { provide: ToastService, useValue: toastSpy }
      ]
    });
    
    service = TestBed.inject(EmployeeService);
    httpMock = TestBed.inject(HttpTestingController);
    toastService = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('list', () => {
    it('should fetch employees from API', () => {
      service.list().subscribe(response => {
        expect(response).toEqual(mockPaginatedResponse);
        expect(response.data.length).toBe(1);
        expect(response.data[0]).toEqual(mockEmployee);
      });

      const req = httpMock.expectOne(`${environment.apiBaseUrl}/Employees`);
      expect(req.request.method).toBe('GET');
      req.flush(mockPaginatedResponse);
    });

    it('should pass query parameters correctly', () => {
      const params: EmployeeListParams = {
        Page: 2,
        Limit: 20,
        Department: 'IT',
        FirstName: 'John'
      };

      service.list(params).subscribe();

      const req = httpMock.expectOne(request => 
        request.url === `${environment.apiBaseUrl}/Employees` &&
        request.params.get('Page') === '2' &&
        request.params.get('Limit') === '20' &&
        request.params.get('Department') === 'IT' &&
        request.params.get('FirstName') === 'John'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockPaginatedResponse);
    });

    it('should handle null/undefined parameters', () => {
      const params: EmployeeListParams = {
        Page: null as any,
        Limit: undefined as any,
        Department: '',
        FirstName: 'John'
      };

      service.list(params).subscribe();

      const req = httpMock.expectOne(request => 
        request.url === `${environment.apiBaseUrl}/Employees` &&
        request.params.get('Page') === null &&
        request.params.get('Limit') === null &&
        request.params.get('Department') === '' &&
        request.params.get('FirstName') === 'John'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockPaginatedResponse);
    });

    it('should handle API errors gracefully', () => {
      service.list().subscribe(response => {
        expect(response.data).toEqual([]);
        expect(response.totalItems).toBe(0);
      });

      const req = httpMock.expectOne(`${environment.apiBaseUrl}/Employees`);
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle invalid response format', () => {
      service.list().subscribe(response => {
        expect(response.data).toEqual([]);
        expect(response.totalItems).toBe(0);
      });

      const req = httpMock.expectOne(`${environment.apiBaseUrl}/Employees`);
      req.flush({ invalidResponse: true });
    });
  });

  describe('add', () => {
    it('should create a new employee', () => {
      const createRequest: CreateEmployeeRequest = {
        departmentId: '123e4567-e89b-12d3-a456-426614174001',
        firstName: 'John',
        middleName: 'Michael',
        lastName: 'Doe',
        birthDate: '1990-01-01T00:00:00.000Z',
        hireDate: '2023-01-01T00:00:00.000Z',
        salary: 75000
      };

      const mockId = '123e4567-e89b-12d3-a456-426614174000';

      service.add(createRequest).subscribe(id => {
        expect(id).toBe(mockId);
      });

      const req = httpMock.expectOne(`${environment.apiBaseUrl}/Employees`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createRequest);
      req.flush(mockId);
    });

    it('should handle optional middle name', () => {
      const createRequest: CreateEmployeeRequest = {
        departmentId: '123e4567-e89b-12d3-a456-426614174001',
        firstName: 'John',
        lastName: 'Doe',
        birthDate: '1990-01-01T00:00:00.000Z',
        hireDate: '2023-01-01T00:00:00.000Z',
        salary: 75000
      };

      service.add(createRequest).subscribe();

      const req = httpMock.expectOne(`${environment.apiBaseUrl}/Employees`);
      expect(req.request.method).toBe('POST');
      req.flush('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should throw error for invalid employee data', () => {
      const invalidRequest = {
        departmentId: 'invalid-guid',
        firstName: '',
        lastName: '',
        birthDate: 'invalid-date',
        hireDate: 'invalid-date',
        salary: -1000
      } as CreateEmployeeRequest;

      expect(() => service.add(invalidRequest)).toThrowError('Invalid employee data provided');
    });

    it('should handle API errors and show toast', () => {
      const createRequest: CreateEmployeeRequest = {
        departmentId: '123e4567-e89b-12d3-a456-426614174001',
        firstName: 'John',
        lastName: 'Doe',
        birthDate: '1990-01-01T00:00:00.000Z',
        hireDate: '2023-01-01T00:00:00.000Z',
        salary: 75000
      };

      let errorThrown = false;
      service.add(createRequest).subscribe({
        error: () => {
          errorThrown = true;
        }
      });

      const req = httpMock.expectOne(`${environment.apiBaseUrl}/Employees`);
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });

      expect(errorThrown).toBe(true);
      expect(toastService.showError).toHaveBeenCalledWith('Ошибка создания', 'Не удалось создать сотрудника. Пожалуйста, попробуйте еще раз.');
    });
  });

  describe('update', () => {
    it('should update an existing employee', () => {
      const updateRequest: UpdateEmployeeRequest = {
        departmentId: '123e4567-e89b-12d3-a456-426614174002',
        salary: 80000
      };

      service.update(mockEmployee.id, updateRequest).subscribe();

      const req = httpMock.expectOne(`${environment.apiBaseUrl}/Employees/${mockEmployee.id}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateRequest);
      req.flush(null);
    });

    it('should handle partial updates', () => {
      const updateRequest: UpdateEmployeeRequest = {
        salary: 85000
      };

      service.update(mockEmployee.id, updateRequest).subscribe();

      const req = httpMock.expectOne(`${environment.apiBaseUrl}/Employees/${mockEmployee.id}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateRequest);
      req.flush(null);
    });

    it('should throw error for invalid employee ID', () => {
      const updateRequest: UpdateEmployeeRequest = { salary: 80000 };
      expect(() => service.update('invalid-guid', updateRequest)).toThrowError('Invalid employee ID provided');
    });

    it('should throw error for invalid update data', () => {
      const invalidRequest = {
        departmentId: 'invalid-guid',
        salary: -1000
      } as UpdateEmployeeRequest;

      expect(() => service.update(mockEmployee.id, invalidRequest)).toThrowError('Invalid employee data provided');
    });

    it('should handle API errors and show toast', () => {
      const updateRequest: UpdateEmployeeRequest = { salary: 80000 };

      let errorThrown = false;
      service.update(mockEmployee.id, updateRequest).subscribe({
        error: () => {
          errorThrown = true;
        }
      });

      const req = httpMock.expectOne(`${environment.apiBaseUrl}/Employees/${mockEmployee.id}`);
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });

      expect(errorThrown).toBe(true);
      expect(toastService.showError).toHaveBeenCalledWith('Ошибка обновления', 'Не удалось обновить сотрудника. Пожалуйста, попробуйте еще раз.');
    });
  });

  describe('delete', () => {
    it('should delete an employee by id', () => {
      service.delete(mockEmployee.id).subscribe();

      const req = httpMock.expectOne(`${environment.apiBaseUrl}/Employees/${mockEmployee.id}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });

    it('should throw error for invalid employee ID', () => {
      expect(() => service.delete('invalid-guid')).toThrowError('Invalid employee ID provided');
    });

    it('should handle delete errors gracefully', () => {
      let errorThrown = false;
      
      service.delete(mockEmployee.id).subscribe({
        error: () => {
          errorThrown = true;
        }
      });

      const req = httpMock.expectOne(`${environment.apiBaseUrl}/Employees/${mockEmployee.id}`);
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
      
      expect(errorThrown).toBe(true);
      expect(toastService.showError).toHaveBeenCalledWith('Ошибка удаления', 'Не удалось удалить сотрудника. Пожалуйста, попробуйте еще раз.');
    });
  });

  describe('getById', () => {
    it('should fetch employee by id', () => {
      service.getById(mockEmployee.id).subscribe(employee => {
        expect(employee).toEqual(mockEmployee);
      });

      const req = httpMock.expectOne(`${environment.apiBaseUrl}/Employees/${mockEmployee.id}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockEmployee);
    });

    it('should return undefined for invalid GUID', () => {
      service.getById('invalid-guid').subscribe(employee => {
        expect(employee).toBeUndefined();
      });

      httpMock.expectNone(`${environment.apiBaseUrl}/Employees/invalid-guid`);
    });

    it('should return undefined on 404', () => {
      service.getById('123e4567-e89b-12d3-a456-426614174999').subscribe(employee => {
        expect(employee).toBeUndefined();
      });

      const req = httpMock.expectOne(`${environment.apiBaseUrl}/Employees/123e4567-e89b-12d3-a456-426614174999`);
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
    });

    it('should handle other errors gracefully', () => {
      service.getById(mockEmployee.id).subscribe(employee => {
        expect(employee).toBeUndefined();
      });

      const req = httpMock.expectOne(`${environment.apiBaseUrl}/Employees/${mockEmployee.id}`);
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle invalid employee response format', () => {
      service.getById(mockEmployee.id).subscribe(employee => {
        expect(employee).toBeUndefined();
      });

      const req = httpMock.expectOne(`${environment.apiBaseUrl}/Employees/${mockEmployee.id}`);
      req.flush({ invalidEmployee: true });
    });
  });

  describe('Department operations', () => {
    describe('getDepartments', () => {
      it('should fetch departments from API', () => {
        const mockDepartments = [mockDepartment];

        service.getDepartments().subscribe(departments => {
          expect(departments).toEqual(mockDepartments);
        });

        const req = httpMock.expectOne(`${environment.apiBaseUrl}/Departments`);
        expect(req.request.method).toBe('GET');
        req.flush(mockDepartments);
      });

      it('should pass query parameters correctly', () => {
        const params: DepartmentListParams = {
          Name: 'IT',
          DepartmentSort: DepartmentSort.Name,
          SortDirection: SortDirection.Ascending
        };

        service.getDepartments(params).subscribe();

        const req = httpMock.expectOne(request => 
          request.url === `${environment.apiBaseUrl}/Departments` &&
          request.params.get('Name') === 'IT' &&
          request.params.get('DepartmentSort') === '1' &&
          request.params.get('SortDirection') === '1'
        );
        expect(req.request.method).toBe('GET');
        req.flush([mockDepartment]);
      });

      it('should handle API errors gracefully', () => {
        service.getDepartments().subscribe(departments => {
          expect(departments).toEqual([]);
        });

        const req = httpMock.expectOne(`${environment.apiBaseUrl}/Departments`);
        req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
      });

      it('should filter out invalid departments', () => {
        const mixedDepartments = [
          mockDepartment,
          { id: 'invalid-guid', name: 'Invalid' },
          { id: '123e4567-e89b-12d3-a456-426614174002', name: 'Valid' },
          { invalidDepartment: true }
        ];

        service.getDepartments().subscribe(departments => {
          expect(departments.length).toBe(2);
          expect(departments[0]).toEqual(mockDepartment);
          expect(departments[1].name).toBe('Valid');
        });

        const req = httpMock.expectOne(`${environment.apiBaseUrl}/Departments`);
        req.flush(mixedDepartments);
      });
    });

    describe('getDepartmentById', () => {
      it('should fetch department by id', () => {
        service.getDepartmentById(mockDepartment.id).subscribe(department => {
          expect(department).toEqual(mockDepartment);
        });

        const req = httpMock.expectOne(`${environment.apiBaseUrl}/Departments/${mockDepartment.id}`);
        expect(req.request.method).toBe('GET');
        req.flush(mockDepartment);
      });

      it('should return undefined for invalid GUID', () => {
        service.getDepartmentById('invalid-guid').subscribe(department => {
          expect(department).toBeUndefined();
        });

        httpMock.expectNone(`${environment.apiBaseUrl}/Departments/invalid-guid`);
      });

      it('should handle API errors gracefully', () => {
        service.getDepartmentById(mockDepartment.id).subscribe(department => {
          expect(department).toBeUndefined();
        });

        const req = httpMock.expectOne(`${environment.apiBaseUrl}/Departments/${mockDepartment.id}`);
        req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
      });
    });

    describe('createDepartment', () => {
      it('should create a new department', () => {
        const createRequest: CreateDepartmentRequest = {
          name: 'HR'
        };

        const mockId = '123e4567-e89b-12d3-a456-426614174002';

        service.createDepartment(createRequest).subscribe(id => {
          expect(id).toBe(mockId);
        });

        const req = httpMock.expectOne(`${environment.apiBaseUrl}/Departments`);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual(createRequest);
        req.flush(mockId);
      });

      it('should throw error for invalid department data', () => {
        const invalidRequest = { name: '' } as CreateDepartmentRequest;
        expect(() => service.createDepartment(invalidRequest)).toThrowError('Invalid department data provided');
      });

      it('should handle API errors and show toast', () => {
        const createRequest: CreateDepartmentRequest = { name: 'HR' };

        let errorThrown = false;
        service.createDepartment(createRequest).subscribe({
          error: () => {
            errorThrown = true;
          }
        });

        const req = httpMock.expectOne(`${environment.apiBaseUrl}/Departments`);
        req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });

        expect(errorThrown).toBe(true);
        expect(toastService.showError).toHaveBeenCalledWith('Ошибка создания', 'Не удалось создать отдел. Пожалуйста, попробуйте еще раз.');
      });
    });

    describe('updateDepartment', () => {
      it('should update a department', () => {
        const newName = 'Updated IT';

        service.updateDepartment(mockDepartment.id, newName).subscribe();

        const req = httpMock.expectOne(`${environment.apiBaseUrl}/Departments/${mockDepartment.id}`);
        expect(req.request.method).toBe('PUT');
        expect(req.request.body).toEqual({ name: newName });
        req.flush(null);
      });

      it('should throw error for invalid department ID', () => {
        expect(() => service.updateDepartment('invalid-guid', 'New Name')).toThrowError('Invalid department ID provided');
      });

      it('should throw error for invalid name', () => {
        expect(() => service.updateDepartment(mockDepartment.id, '')).toThrowError('Invalid department name provided');
      });

      it('should handle API errors and show toast', () => {
        let errorThrown = false;
        service.updateDepartment(mockDepartment.id, 'New Name').subscribe({
          error: () => {
            errorThrown = true;
          }
        });

        const req = httpMock.expectOne(`${environment.apiBaseUrl}/Departments/${mockDepartment.id}`);
        req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });

        expect(errorThrown).toBe(true);
        expect(toastService.showError).toHaveBeenCalledWith('Ошибка обновления', 'Не удалось обновить отдел. Пожалуйста, попробуйте еще раз.');
      });
    });

    describe('deleteDepartment', () => {
      it('should delete a department', () => {
        service.deleteDepartment(mockDepartment.id).subscribe();

        const req = httpMock.expectOne(`${environment.apiBaseUrl}/Departments/${mockDepartment.id}`);
        expect(req.request.method).toBe('DELETE');
        req.flush(null);
      });

      it('should throw error for invalid department ID', () => {
        expect(() => service.deleteDepartment('invalid-guid')).toThrowError('Invalid department ID provided');
      });

      it('should handle API errors and show toast', () => {
        let errorThrown = false;
        service.deleteDepartment(mockDepartment.id).subscribe({
          error: () => {
            errorThrown = true;
          }
        });

        const req = httpMock.expectOne(`${environment.apiBaseUrl}/Departments/${mockDepartment.id}`);
        req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });

        expect(errorThrown).toBe(true);
        expect(toastService.showError).toHaveBeenCalledWith('Ошибка удаления', 'Не удалось удалить отдел. Пожалуйста, попробуйте еще раз.');
      });
    });
  });

  describe('Private validation methods', () => {
    describe('validateEmployeeListParams', () => {
      it('should validate and sanitize employee list parameters', () => {
        const params = {
          Page: 1,
          Limit: 10,
          Department: 'IT',
          FirstName: 'John',
          LastName: 'Doe',
          EmployeeSort: 1,
          SortDirection: 1
        };
        
        const result = (service as any).validateEmployeeListParams(params);
        expect(result).toEqual(params);
      });
      
      it('should handle invalid sort values', () => {
        const params = {
          Page: 1,
          Limit: 10,
          EmployeeSort: 999,
          SortDirection: 999
        };
        
        const result = (service as any).validateEmployeeListParams(params);
        expect(result.EmployeeSort).toBeUndefined();
        expect(result.SortDirection).toBeUndefined();
      });
      
      it('should handle negative page and limit values', () => {
        const params = {
          Page: -1,
          Limit: -10
        };
        
        const result = (service as any).validateEmployeeListParams(params);
        expect(result.Page).toBe(1);
        expect(result.Limit).toBe(10);
      });
      
      it('should handle zero page and limit values', () => {
        const params = {
          Page: 0,
          Limit: 0
        };
        
        const result = (service as any).validateEmployeeListParams(params);
        expect(result.Page).toBe(1);
        expect(result.Limit).toBe(10);
      });
      
      it('should handle excessively large limit values', () => {
        const params = {
          Page: 1,
          Limit: 1000
        };
        
        const result = (service as any).validateEmployeeListParams(params);
        expect(result.Limit).toBe(100);
      });

      it('should handle Department as null', () => {
        const params = {
          Department: null as any
        };
        
        const result = (service as any).validateEmployeeListParams(params);
        expect(result.Department).toBe('');
      });

      it('should handle Department as non-string', () => {
        const params = {
          Department: 123 as any
        };
        
        const result = (service as any).validateEmployeeListParams(params);
        expect(result.Department).toBe('');
      });

      it('should handle FirstName as null', () => {
        const params = {
          FirstName: null as any
        };
        
        const result = (service as any).validateEmployeeListParams(params);
        expect(result.FirstName).toBe('');
      });

      it('should handle FirstName as non-string', () => {
        const params = {
          FirstName: 123 as any
        };
        
        const result = (service as any).validateEmployeeListParams(params);
        expect(result.FirstName).toBe('');
      });

      it('should handle valid MiddleName', () => {
        const params = {
          MiddleName: 'Michael'
        };
        
        const result = (service as any).validateEmployeeListParams(params);
        expect(result.MiddleName).toBe('Michael');
      });

      it('should handle invalid MiddleName type', () => {
        const params = {
          MiddleName: 123 as any
        };
        
        const result = (service as any).validateEmployeeListParams(params);
        expect(result.MiddleName).toBeUndefined();
      });

      it('should handle valid BirthDate', () => {
        const params = {
          BirthDate: '1990-01-01T00:00:00.000Z'
        };
        
        const result = (service as any).validateEmployeeListParams(params);
        expect(result.BirthDate).toBe('1990-01-01T00:00:00.000Z');
      });

      it('should handle invalid BirthDate', () => {
        const params = {
          BirthDate: 'invalid-date'
        };
        
        const result = (service as any).validateEmployeeListParams(params);
        expect(result.BirthDate).toBeUndefined();
      });

      it('should handle valid HireDate', () => {
        const params = {
          HireDate: '2023-01-01T00:00:00.000Z'
        };
        
        const result = (service as any).validateEmployeeListParams(params);
        expect(result.HireDate).toBe('2023-01-01T00:00:00.000Z');
      });

      it('should handle invalid HireDate', () => {
        const params = {
          HireDate: 'invalid-date'
        };
        
        const result = (service as any).validateEmployeeListParams(params);
        expect(result.HireDate).toBeUndefined();
      });

      it('should handle valid Salary', () => {
        const params = {
          Salary: 50000
        };
        
        const result = (service as any).validateEmployeeListParams(params);
        expect(result.Salary).toBe(50000);
      });

      it('should handle invalid Salary type', () => {
        const params = {
          Salary: 'invalid' as any
        };
        
        const result = (service as any).validateEmployeeListParams(params);
        expect(result.Salary).toBeUndefined();
      });

      it('should handle negative Salary', () => {
        const params = {
          Salary: -1000
        };
        
        const result = (service as any).validateEmployeeListParams(params);
        expect(result.Salary).toBeUndefined();
      });

      it('should handle valid MinBirthDate', () => {
        const params = {
          MinBirthDate: '1990-01-01T00:00:00.000Z'
        };
        
        const result = (service as any).validateEmployeeListParams(params);
        expect(result.MinBirthDate).toBe('1990-01-01T00:00:00.000Z');
      });

      it('should handle invalid MinBirthDate', () => {
        const params = {
          MinBirthDate: 'invalid-date'
        };
        
        const result = (service as any).validateEmployeeListParams(params);
        expect(result.MinBirthDate).toBeUndefined();
      });

      it('should handle valid MaxBirthDate', () => {
        const params = {
          MaxBirthDate: '1995-01-01T00:00:00.000Z'
        };
        
        const result = (service as any).validateEmployeeListParams(params);
        expect(result.MaxBirthDate).toBe('1995-01-01T00:00:00.000Z');
      });

      it('should handle invalid MaxBirthDate', () => {
        const params = {
          MaxBirthDate: 'invalid-date'
        };
        
        const result = (service as any).validateEmployeeListParams(params);
        expect(result.MaxBirthDate).toBeUndefined();
      });

      it('should handle valid MinHireDate', () => {
        const params = {
          MinHireDate: '2020-01-01T00:00:00.000Z'
        };
        
        const result = (service as any).validateEmployeeListParams(params);
        expect(result.MinHireDate).toBe('2020-01-01T00:00:00.000Z');
      });

      it('should handle invalid MinHireDate', () => {
        const params = {
          MinHireDate: 'invalid-date'
        };
        
        const result = (service as any).validateEmployeeListParams(params);
        expect(result.MinHireDate).toBeUndefined();
      });

      it('should handle valid MaxHireDate', () => {
        const params = {
          MaxHireDate: '2023-01-01T00:00:00.000Z'
        };
        
        const result = (service as any).validateEmployeeListParams(params);
        expect(result.MaxHireDate).toBe('2023-01-01T00:00:00.000Z');
      });

      it('should handle invalid MaxHireDate', () => {
        const params = {
          MaxHireDate: 'invalid-date'
        };
        
        const result = (service as any).validateEmployeeListParams(params);
        expect(result.MaxHireDate).toBeUndefined();
      });

      it('should handle valid MinSalary', () => {
        const params = {
          MinSalary: 30000
        };
        
        const result = (service as any).validateEmployeeListParams(params);
        expect(result.MinSalary).toBe(30000);
      });

      it('should handle invalid MinSalary type', () => {
        const params = {
          MinSalary: 'invalid' as any
        };
        
        const result = (service as any).validateEmployeeListParams(params);
        expect(result.MinSalary).toBeUndefined();
      });

      it('should handle negative MinSalary', () => {
        const params = {
          MinSalary: -1000
        };
        
        const result = (service as any).validateEmployeeListParams(params);
        expect(result.MinSalary).toBeUndefined();
      });

      it('should handle valid MaxSalary', () => {
        const params = {
          MaxSalary: 100000
        };
        
        const result = (service as any).validateEmployeeListParams(params);
        expect(result.MaxSalary).toBe(100000);
      });

      it('should handle invalid MaxSalary type', () => {
        const params = {
          MaxSalary: 'invalid' as any
        };
        
        const result = (service as any).validateEmployeeListParams(params);
        expect(result.MaxSalary).toBeUndefined();
      });

      it('should handle negative MaxSalary', () => {
        const params = {
          MaxSalary: -1000
        };
        
        const result = (service as any).validateEmployeeListParams(params);
        expect(result.MaxSalary).toBeUndefined();
      });

      it('should handle MiddleName as null', () => {
        const params = {
          MiddleName: null as any
        };
        
        const result = (service as any).validateEmployeeListParams(params);
        expect(result.MiddleName).toBeUndefined();
      });

      it('should handle MiddleName as empty string', () => {
        const params = {
          MiddleName: ''
        };
        
        const result = (service as any).validateEmployeeListParams(params);
        expect(result.MiddleName).toBeUndefined();
      });

      it('should handle LastName as null', () => {
        const params = {
          LastName: null as any
        };
        
        const result = (service as any).validateEmployeeListParams(params);
        expect(result.LastName).toBeUndefined();
      });

      it('should handle LastName as non-string', () => {
        const params = {
          LastName: 123 as any
        };
        
        const result = (service as any).validateEmployeeListParams(params);
        expect(result.LastName).toBeUndefined();
      });

      it('should handle BirthDate as null', () => {
        const params = {
          BirthDate: null as any
        };
        
        const result = (service as any).validateEmployeeListParams(params);
        expect(result.BirthDate).toBeUndefined();
      });

      it('should handle BirthDate as non-string', () => {
        const params = {
          BirthDate: 123 as any
        };
        
        const result = (service as any).validateEmployeeListParams(params);
        expect(result.BirthDate).toBeUndefined();
      });

      it('should handle HireDate as null', () => {
        const params = {
          HireDate: null as any
        };
        
        const result = (service as any).validateEmployeeListParams(params);
        expect(result.HireDate).toBeUndefined();
      });

      it('should handle HireDate as non-string', () => {
        const params = {
          HireDate: 123 as any
        };
        
        const result = (service as any).validateEmployeeListParams(params);
        expect(result.HireDate).toBeUndefined();
      });

      it('should handle MinBirthDate as null', () => {
        const params = {
          MinBirthDate: null as any
        };
        
        const result = (service as any).validateEmployeeListParams(params);
        expect(result.MinBirthDate).toBeUndefined();
      });

      it('should handle MinBirthDate as non-string', () => {
        const params = {
          MinBirthDate: 123 as any
        };
        
        const result = (service as any).validateEmployeeListParams(params);
        expect(result.MinBirthDate).toBeUndefined();
      });

      it('should handle MaxBirthDate as null', () => {
        const params = {
          MaxBirthDate: null as any
        };
        
        const result = (service as any).validateEmployeeListParams(params);
        expect(result.MaxBirthDate).toBeUndefined();
      });

      it('should handle MaxBirthDate as non-string', () => {
        const params = {
          MaxBirthDate: 123 as any
        };
        
        const result = (service as any).validateEmployeeListParams(params);
        expect(result.MaxBirthDate).toBeUndefined();
      });

      it('should handle MinHireDate as null', () => {
        const params = {
          MinHireDate: null as any
        };
        
        const result = (service as any).validateEmployeeListParams(params);
        expect(result.MinHireDate).toBeUndefined();
      });

      it('should handle MinHireDate as non-string', () => {
        const params = {
          MinHireDate: 123 as any
        };
        
        const result = (service as any).validateEmployeeListParams(params);
        expect(result.MinHireDate).toBeUndefined();
      });

      it('should handle MaxHireDate as null', () => {
        const params = {
          MaxHireDate: null as any
        };
        
        const result = (service as any).validateEmployeeListParams(params);
        expect(result.MaxHireDate).toBeUndefined();
      });

      it('should handle MaxHireDate as non-string', () => {
        const params = {
          MaxHireDate: 123 as any
        };
        
        const result = (service as any).validateEmployeeListParams(params);
        expect(result.MaxHireDate).toBeUndefined();
      });

      it('should handle MinSalary as null', () => {
        const params = {
          MinSalary: null as any
        };
        
        const result = (service as any).validateEmployeeListParams(params);
        expect(result.MinSalary).toBeUndefined();
      });

      it('should handle MaxSalary as null', () => {
        const params = {
          MaxSalary: null as any
        };
        
        const result = (service as any).validateEmployeeListParams(params);
        expect(result.MaxSalary).toBeUndefined();
      });

      it('should handle Salary as null', () => {
        const params = {
          Salary: null as any
        };
        
        const result = (service as any).validateEmployeeListParams(params);
        expect(result.Salary).toBeUndefined();
      });
    });
    
    describe('validateDepartmentListParams', () => {
      it('should validate department list parameters', () => {
        const params = {
          Name: 'IT',
          DepartmentSort: 1,
          SortDirection: 1
        };
        
        const result = (service as any).validateDepartmentListParams(params);
        expect(result).toEqual(params);
      });
      
      it('should handle invalid department sort values', () => {
        const params = {
          Name: 'IT',
          DepartmentSort: 999,
          SortDirection: 999
        };
        
        const result = (service as any).validateDepartmentListParams(params);
        expect(result.DepartmentSort).toBeUndefined();
        expect(result.SortDirection).toBeUndefined();
      });
    });
    
    describe('validateCreateEmployeeRequest', () => {
      it('should validate valid create employee request', () => {
        const request = {
          departmentId: '123e4567-e89b-12d3-a456-426614174001',
          firstName: 'John',
          lastName: 'Doe',
          birthDate: '1990-01-01T00:00:00.000Z',
          hireDate: '2023-01-01T00:00:00.000Z',
          salary: 75000
        };
        
        const result = (service as any).validateCreateEmployeeRequest(request);
        expect(result).toEqual(request);
      });
      
      it('should reject invalid department ID', () => {
        const request = {
          departmentId: 'invalid-guid',
          firstName: 'John',
          lastName: 'Doe',
          birthDate: '1990-01-01T00:00:00.000Z',
          hireDate: '2023-01-01T00:00:00.000Z',
          salary: 75000
        };
        
        const result = (service as any).validateCreateEmployeeRequest(request);
        expect(result).toBeNull();
      });
      
      it('should reject empty first name', () => {
        const request = {
          departmentId: '123e4567-e89b-12d3-a456-426614174001',
          firstName: '',
          lastName: 'Doe',
          birthDate: '1990-01-01T00:00:00.000Z',
          hireDate: '2023-01-01T00:00:00.000Z',
          salary: 75000
        };
        
        const result = (service as any).validateCreateEmployeeRequest(request);
        expect(result).toBeNull();
      });
      
      it('should reject empty last name', () => {
        const request = {
          departmentId: '123e4567-e89b-12d3-a456-426614174001',
          firstName: 'John',
          lastName: '',
          birthDate: '1990-01-01T00:00:00.000Z',
          hireDate: '2023-01-01T00:00:00.000Z',
          salary: 75000
        };
        
        const result = (service as any).validateCreateEmployeeRequest(request);
        expect(result).toBeNull();
      });
      
      it('should reject invalid birth date', () => {
        const request = {
          departmentId: '123e4567-e89b-12d3-a456-426614174001',
          firstName: 'John',
          lastName: 'Doe',
          birthDate: 'invalid-date',
          hireDate: '2023-01-01T00:00:00.000Z',
          salary: 75000
        };
        
        const result = (service as any).validateCreateEmployeeRequest(request);
        expect(result).toBeNull();
      });
      
      it('should reject invalid hire date', () => {
        const request = {
          departmentId: '123e4567-e89b-12d3-a456-426614174001',
          firstName: 'John',
          lastName: 'Doe',
          birthDate: '1990-01-01T00:00:00.000Z',
          hireDate: 'invalid-date',
          salary: 75000
        };
        
        const result = (service as any).validateCreateEmployeeRequest(request);
        expect(result).toBeNull();
      });
      
      it('should reject negative salary', () => {
        const request = {
          departmentId: '123e4567-e89b-12d3-a456-426614174001',
          firstName: 'John',
          lastName: 'Doe',
          birthDate: '1990-01-01T00:00:00.000Z',
          hireDate: '2023-01-01T00:00:00.000Z',
          salary: -1000
        };
        
        const result = (service as any).validateCreateEmployeeRequest(request);
        expect(result).toBeNull();
      });
      
      it('should accept valid middle name', () => {
        const request = {
          departmentId: '123e4567-e89b-12d3-a456-426614174001',
          firstName: 'John',
          middleName: 'Michael',
          lastName: 'Doe',
          birthDate: '1990-01-01T00:00:00.000Z',
          hireDate: '2023-01-01T00:00:00.000Z',
          salary: 75000
        };
        
        const result = (service as any).validateCreateEmployeeRequest(request);
        expect(result).toEqual(request);
      });
      
      it('should reject empty middle name when provided', () => {
        const request = {
          departmentId: '123e4567-e89b-12d3-a456-426614174001',
          firstName: 'John',
          middleName: '',
          lastName: 'Doe',
          birthDate: '1990-01-01T00:00:00.000Z',
          hireDate: '2023-01-01T00:00:00.000Z',
          salary: 75000
        };
        
        const result = (service as any).validateCreateEmployeeRequest(request);
        expect(result).toBeNull();
      });
    });
    
    describe('validateUpdateEmployeeRequest', () => {
      it('should validate valid update request with all fields', () => {
        const request = {
          departmentId: '123e4567-e89b-12d3-a456-426614174001',
          firstName: 'John',
          middleName: 'Michael',
          lastName: 'Doe',
          birthDate: '1990-01-01T00:00:00.000Z',
          hireDate: '2023-01-01T00:00:00.000Z',
          salary: 75000
        };
        
        const result = (service as any).validateUpdateEmployeeRequest(request);
        expect(result).toEqual(request);
      });
      
      it('should validate partial update with only salary', () => {
        const request = {
          salary: 80000
        };
        
        const result = (service as any).validateUpdateEmployeeRequest(request);
        expect(result).toEqual(request);
      });
      
      it('should validate partial update with only department', () => {
        const request = {
          departmentId: '123e4567-e89b-12d3-a456-426614174001'
        };
        
        const result = (service as any).validateUpdateEmployeeRequest(request);
        expect(result).toEqual(request);
      });
      
      it('should reject invalid department ID in update', () => {
        const request = {
          departmentId: 'invalid-guid',
          salary: 80000
        };
        
        const result = (service as any).validateUpdateEmployeeRequest(request);
        expect(result).toBeNull();
      });
      
      it('should reject negative salary in update', () => {
        const request = {
          salary: -1000
        };
        
        const result = (service as any).validateUpdateEmployeeRequest(request);
        expect(result).toBeNull();
      });
      
      it('should reject empty first name in update', () => {
        const request = {
          firstName: ''
        };
        
        const result = (service as any).validateUpdateEmployeeRequest(request);
        expect(result).toBeNull();
      });
      
      it('should reject empty last name in update', () => {
        const request = {
          lastName: ''
        };
        
        const result = (service as any).validateUpdateEmployeeRequest(request);
        expect(result).toBeNull();
      });
      
      it('should reject invalid birth date in update', () => {
        const request = {
          birthDate: 'invalid-date'
        };
        
        const result = (service as any).validateUpdateEmployeeRequest(request);
        expect(result).toBeNull();
      });
      
      it('should reject invalid hire date in update', () => {
        const request = {
          hireDate: 'invalid-date'
        };
        
        const result = (service as any).validateUpdateEmployeeRequest(request);
        expect(result).toBeNull();
      });
      
      it('should reject empty middle name when provided in update', () => {
        const request = {
          middleName: ''
        };
        
        const result = (service as any).validateUpdateEmployeeRequest(request);
        expect(result).toBeNull();
      });

      // should return null if middle name is not a string
      it('should reject non-string middle name in update', () => {
        const request = {
          middleName: 123
        };
        
        const result = (service as any).validateUpdateEmployeeRequest(request);
        expect(result).toBeNull();
      });
    });
    
    describe('validateCreateDepartmentRequest', () => {
      it('should validate valid department request', () => {
        const request = {
          name: 'Human Resources'
        };
        
        const result = (service as any).validateCreateDepartmentRequest(request);
        expect(result).toEqual(request);
      });
      
      it('should reject empty department name', () => {
        const request = {
          name: ''
        };
        
        const result = (service as any).validateCreateDepartmentRequest(request);
        expect(result).toBeNull();
      });
      
      it('should reject whitespace-only department name', () => {
        const request = {
          name: '   '
        };
        
        const result = (service as any).validateCreateDepartmentRequest(request);
        expect(result).toBeNull();
      });
    });
    
    describe('validateEmployee', () => {
      it('should validate complete employee object', () => {
        const employee = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          department: mockDepartment,
          firstName: 'John',
          middleName: 'Michael',
          lastName: 'Doe',
          birthDate: '1990-01-01T00:00:00.000Z',
          hireDate: '2023-01-01T00:00:00.000Z',
          salary: 75000
        };
        
        const result = (service as any).validateEmployee(employee);
        expect(result).toEqual(employee);
      });
      
      it('should validate employee without middle name', () => {
        const employee = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          department: mockDepartment,
          firstName: 'John',
          lastName: 'Doe',
          birthDate: '1990-01-01T00:00:00.000Z',
          hireDate: '2023-01-01T00:00:00.000Z',
          salary: 75000
        };
        
        const result = (service as any).validateEmployee(employee);
        expect(result).toEqual(employee);
      });
      
      it('should reject non-object employee', () => {
        const employee = null;
        const result = (service as any).validateEmployee(employee);
        expect(result).toBeUndefined();
      });

      it('should reject employee with invalid ID', () => {
        const employee = {
          id: 'invalid-guid',
          department: mockDepartment,
          firstName: 'John',
          lastName: 'Doe',
          birthDate: '1990-01-01T00:00:00.000Z',
          hireDate: '2023-01-01T00:00:00.000Z',
          salary: 75000
        };
        
        const result = (service as any).validateEmployee(employee);
        expect(result).toBeUndefined();
      });
      
      it('should reject employee with invalid department', () => {
        const employee = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          department: { id: 'invalid-guid', name: 'IT' },
          firstName: 'John',
          lastName: 'Doe',
          birthDate: '1990-01-01T00:00:00.000Z',
          hireDate: '2023-01-01T00:00:00.000Z',
          salary: 75000
        };
        
        const result = (service as any).validateEmployee(employee);
        expect(result).toBeUndefined();
      });
      
      it('should reject employee with empty first name', () => {
        const employee = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          department: mockDepartment,
          firstName: '',
          lastName: 'Doe',
          birthDate: '1990-01-01T00:00:00.000Z',
          hireDate: '2023-01-01T00:00:00.000Z',
          salary: 75000
        };
        
        const result = (service as any).validateEmployee(employee);
        expect(result).toBeUndefined();
      });
      
      it('should reject employee with empty last name', () => {
        const employee = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          department: mockDepartment,
          firstName: 'John',
          lastName: '',
          birthDate: '1990-01-01T00:00:00.000Z',
          hireDate: '2023-01-01T00:00:00.000Z',
          salary: 75000
        };
        
        const result = (service as any).validateEmployee(employee);
        expect(result).toBeUndefined();
      });
      
      it('should reject employee with invalid birth date', () => {
        const employee = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          department: mockDepartment,
          firstName: 'John',
          lastName: 'Doe',
          birthDate: 'invalid-date',
          hireDate: '2023-01-01T00:00:00.000Z',
          salary: 75000
        };
        
        const result = (service as any).validateEmployee(employee);
        expect(result).toBeUndefined();
      });
      
      it('should reject employee with invalid hire date', () => {
        const employee = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          department: mockDepartment,
          firstName: 'John',
          lastName: 'Doe',
          birthDate: '1990-01-01T00:00:00.000Z',
          hireDate: 'invalid-date',
          salary: 75000
        };
        
        const result = (service as any).validateEmployee(employee);
        expect(result).toBeUndefined();
      });
      
      it('should reject employee with negative salary', () => {
        const employee = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          department: mockDepartment,
          firstName: 'John',
          lastName: 'Doe',
          birthDate: '1990-01-01T00:00:00.000Z',
          hireDate: '2023-01-01T00:00:00.000Z',
          salary: -1000
        };
        
        const result = (service as any).validateEmployee(employee);
        expect(result).toBeUndefined();
      });
      
      it('should reject employee with empty middle name when provided', () => {
        const employee = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          department: mockDepartment,
          firstName: 'John',
          middleName: '',
          lastName: 'Doe',
          birthDate: '1990-01-01T00:00:00.000Z',
          hireDate: '2023-01-01T00:00:00.000Z',
          salary: 75000
        };
        
        const result = (service as any).validateEmployee(employee);
        expect(result).toBeUndefined();
      });
    });
    
    describe('validateDepartment', () => {
      it('should reject non-object department', () => {
        const department = null;
        const result = (service as any).validateDepartment(department);
        expect(result).toBeUndefined();
      });

      it('should validate valid department', () => {
        const department = {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Information Technology'
        };
        
        const result = (service as any).validateDepartment(department);
        expect(result).toEqual(department);
      });
      
      it('should reject department with invalid ID', () => {
        const department = {
          id: 'invalid-guid',
          name: 'IT'
        };
        
        const result = (service as any).validateDepartment(department);
        expect(result).toBeUndefined();
      });
      
      it('should reject department with empty name', () => {
        const department = {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: ''
        };
        
        const result = (service as any).validateDepartment(department);
        expect(result).toBeUndefined();
      });
      
      it('should reject department with whitespace-only name', () => {
        const department = {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: '   '
        };
        
        const result = (service as any).validateDepartment(department);
        expect(result).toBeUndefined();
      });
    });
    
    describe('validatePaginatedResponse', () => {
      it('should validate complete paginated response', () => {
        const response = {
          data: [mockEmployee],
          currentPage: 1,
          perPage: 10,
          totalItems: 1,
          totalPages: 1
        };
        
        const result = (service as any).validatePaginatedResponse(response);
        expect(result).toEqual(response);
      });
      
      it('should handle missing data array', () => {
        const response = {
          currentPage: 1,
          perPage: 10,
          totalItems: 1,
          totalPages: 1
        };
        
        const result = (service as any).validatePaginatedResponse(response);
        expect(result.data).toEqual([]);
        expect(result.currentPage).toBe(1);
        expect(result.perPage).toBe(10);
        expect(result.totalItems).toBe(0);
        expect(result.totalPages).toBe(0);
      });
      
      it('should handle invalid pagination values', () => {
        const response = {
          data: [mockEmployee],
          currentPage: -1,
          perPage: -10,
          totalItems: -1,
          totalPages: -1
        };
        
        const result = (service as any).validatePaginatedResponse(response);
        expect(result.currentPage).toBe(1);
        expect(result.perPage).toBe(10);
        expect(result.totalItems).toBe(0);
        expect(result.totalPages).toBe(0);
      });
      
      it('should filter out invalid employees from data', () => {
        const response = {
          data: [
            mockEmployee,
            { id: 'invalid-guid', name: 'Invalid Employee' },
            { validField: 'but missing required fields' }
          ],
          currentPage: 1,
          perPage: 10,
          totalItems: 3,
          totalPages: 1
        };
        
        const result = (service as any).validatePaginatedResponse(response);
        expect(result.data.length).toBe(1);
        expect(result.data[0]).toEqual(mockEmployee);
      });
    });
    
    describe('Utility validation methods', () => {
      it('should validate employee sort enum', () => {
        expect((service as any).isValidEmployeeSort(0)).toBe(true);
        expect((service as any).isValidEmployeeSort(1)).toBe(true);
        expect((service as any).isValidEmployeeSort(2)).toBe(true);
        expect((service as any).isValidEmployeeSort(3)).toBe(true);
        expect((service as any).isValidEmployeeSort(4)).toBe(true);
        expect((service as any).isValidEmployeeSort(5)).toBe(true);
        expect((service as any).isValidEmployeeSort(6)).toBe(true);
        expect((service as any).isValidEmployeeSort(999)).toBe(false);
        expect((service as any).isValidEmployeeSort(-1)).toBe(false);
        expect((service as any).isValidEmployeeSort('invalid')).toBe(false);
      });
      
      it('should validate department sort enum', () => {
        expect((service as any).isValidDepartmentSort(0)).toBe(true);
        expect((service as any).isValidDepartmentSort(1)).toBe(true);
        expect((service as any).isValidDepartmentSort(999)).toBe(false);
        expect((service as any).isValidDepartmentSort(-1)).toBe(false);
        expect((service as any).isValidDepartmentSort('invalid')).toBe(false);
      });
      
      it('should validate sort direction enum', () => {
        expect((service as any).isValidSortDirection(0)).toBe(true);
        expect((service as any).isValidSortDirection(1)).toBe(true);
        expect((service as any).isValidSortDirection(999)).toBe(false);
        expect((service as any).isValidSortDirection(-1)).toBe(false);
        expect((service as any).isValidSortDirection('invalid')).toBe(false);
      });
      
      it('should validate GUID format', () => {
        expect((service as any).isValidGuid('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
        expect((service as any).isValidGuid('invalid-guid')).toBe(false);
        expect((service as any).isValidGuid('')).toBe(false);
        expect((service as any).isValidGuid(null)).toBe(false);
        expect((service as any).isValidGuid(undefined)).toBe(false);
        expect((service as any).isValidGuid(123)).toBe(false);
      });
      
      it('should validate date string format', () => {
        expect((service as any).isValidDateString('2023-01-01T00:00:00.000Z')).toBe(true);
        expect((service as any).isValidDateString('2023-01-01')).toBe(true);
        expect((service as any).isValidDateString('invalid-date')).toBe(false);
        expect((service as any).isValidDateString('')).toBe(false);
        expect((service as any).isValidDateString(null)).toBe(false);
        expect((service as any).isValidDateString(undefined)).toBe(false);
        expect((service as any).isValidDateString(123)).toBe(false);
      });
    });
  });
  
  describe('Error handling edge cases', () => {
    it('should handle malformed JSON response in list', () => {
      service.list().subscribe(response => {
        expect(response.data).toEqual([]);
        expect(response.totalItems).toBe(0);
      });

      const req = httpMock.expectOne(`${environment.apiBaseUrl}/Employees`);
      req.flush('malformed json response', { status: 200, statusText: 'OK' });
    });
    
    it('should handle network timeout in list', () => {
      service.list().subscribe(response => {
        expect(response.data).toEqual([]);
        expect(response.totalItems).toBe(0);
      });

      const req = httpMock.expectOne(`${environment.apiBaseUrl}/Employees`);
      req.error(new ErrorEvent('Network error'), { status: 0, statusText: 'Unknown Error' });
    });
    
    it('should handle HTML response instead of JSON in delete', () => {
      let errorThrown = false;
      
      service.delete(mockEmployee.id).subscribe({
        error: (error) => {
          errorThrown = true;
          expect(error.error).toContain('<!DOCTYPE');
        }
      });

      const req = httpMock.expectOne(`${environment.apiBaseUrl}/Employees/${mockEmployee.id}`);
      req.flush('<!DOCTYPE html><html><body>Error Page</body></html>', { 
        status: 500, 
        statusText: 'Internal Server Error',
        headers: { 'Content-Type': 'text/html' }
      });
      
      expect(errorThrown).toBe(true);
    });
    
    it('should handle very large employee list response', () => {
      const largeEmployeeList = Array(1000).fill(null).map((_, index) => ({
        ...mockEmployee,
        id: `123e4567-e89b-12d3-a456-42661417${index.toString().padStart(4, '0')}`,
        firstName: `Employee${index}`
      }));
      
      const largeResponse = {
        data: largeEmployeeList,
        currentPage: 1,
        perPage: 1000,
        totalItems: 1000,
        totalPages: 1
      };

      service.list().subscribe(response => {
        expect(response.data.length).toBe(1000);
        expect(response.totalItems).toBe(1000);
      });

      const req = httpMock.expectOne(`${environment.apiBaseUrl}/Employees`);
      req.flush(largeResponse);
    });
  });
}); 