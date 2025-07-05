import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Employee, CreateEmployeeRequest, UpdateEmployeeRequest, Department, CreateDepartmentRequest } from '../../core/models/employee.model';
import { EmployeeService } from '../../core/services/employee.service';
import { AutocompleteDropdownComponent, AutocompleteOption } from './autocomplete-dropdown.component';

@Component({
  selector: 'app-employee-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AutocompleteDropdownComponent],
  templateUrl: './employee-form-modal.component.html',
  styleUrl: './employee-form-modal.component.css'
})
export class EmployeeFormModalComponent implements OnChanges {
  @Input() isVisible = false;
  @Input() employee: Employee | null = null;
  @Input() isLoading = false;
  @Output() save = new EventEmitter<{
    employeeData: UpdateEmployeeRequest | CreateEmployeeRequest;
    newDepartmentCreated: boolean;
  }>();
  @Output() cancel = new EventEmitter<void>();

  employeeForm: FormGroup;
  isEdit = false;
  departments: Department[] = [];
  departmentOptions: AutocompleteOption[] = [];
  isCreatingNewDepartment = false;
  newDepartmentName = '';
  
  constructor(private fb: FormBuilder, private employeeService: EmployeeService) {
    this.employeeForm = this.createForm();
    this.loadDepartments();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['employee']) {
      const employee = changes['employee'].currentValue;
      if (employee) {
        this.isEdit = true;
        this.employeeForm.patchValue({
          departmentId: employee.department.id,
          firstName: employee.firstName,
          middleName: employee.middleName || '',
          lastName: employee.lastName,
          birthDate: employee.birthDate.split('T')[0],
          hireDate: employee.hireDate.split('T')[0],
          salary: employee.salary
        });
        this.resetNewDepartmentState();
      } else {
        this.isEdit = false;
        this.resetForm();
        this.resetNewDepartmentState();
      }
    }
    
    if (changes['isLoading']) {
      this.isLoading = changes['isLoading'].currentValue;
      this.updateFormDisabledState();
    }
  }

  private loadDepartments() {
    this.employeeService.getDepartments().subscribe({
      next: (departments) => {
        this.departments = departments;
        this.departmentOptions = departments.map(dept => ({
          value: dept.id,
          label: dept.name
        }));
      },
      error: (error) => {
        console.error('Error loading departments:', error);
      }
    });
  }

  private createForm(): FormGroup {
    return this.fb.group({
      departmentId: ['', Validators.required],
      firstName: ['', [Validators.required, Validators.maxLength(50)]],
      middleName: ['', [Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.maxLength(50)]],
      birthDate: ['', [Validators.required, this.pastDateValidator]],
      hireDate: ['', [Validators.required, this.futureNotTooFarValidator]],
      salary: [0, [Validators.required, Validators.min(1), Validators.max(1000000)]]
    });
  }

  private pastDateValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    
    const inputDate = new Date(control.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    inputDate.setHours(0, 0, 0, 0);
    
    if (inputDate > today) {
      return { futureDate: true };
    }
    return null;
  }

  private futureNotTooFarValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    
    const inputDate = new Date(control.value);
    const maxFutureDate = new Date();
    maxFutureDate.setFullYear(maxFutureDate.getFullYear() + 5);
    
    if (inputDate > maxFutureDate) {
      return { tooFarInFuture: true };
    }
    return null;
  }

  private resetForm() {
    this.employeeForm.reset({
      departmentId: '',
      firstName: '',
      middleName: '',
      lastName: '',
      birthDate: '',
      hireDate: '',
      salary: 0
    });
    this.employeeForm.markAsUntouched();
  }

  private resetNewDepartmentState() {
    this.isCreatingNewDepartment = false;
    this.newDepartmentName = '';
  }

  private updateFormDisabledState() {
    if (this.isLoading) {
      this.employeeForm.disable();
    } else {
      this.employeeForm.enable();
    }
  }

  onDepartmentSelectionChange(option: AutocompleteOption | null): void {
    if (option) {
      const existingDepartment = this.departments.find(dept => dept.id === option.value);
      if (!existingDepartment) {
        this.isCreatingNewDepartment = true;
        this.newDepartmentName = option.label;
      } else {
        this.resetNewDepartmentState();
      }
    } else {
      this.resetNewDepartmentState();
    }
  }

  customFilterFunction = (options: AutocompleteOption[], query: string): AutocompleteOption[] => {
    const lowerQuery = query.trim().toLowerCase();

    if (!lowerQuery) {
      return options;
    }

    const partialMatches = options.filter(opt =>
      opt.label.toLowerCase().includes(lowerQuery)
    );
    const exactMatch = partialMatches.find(opt => opt.label.toLowerCase() === lowerQuery);

    if (exactMatch) {
      return [exactMatch];
    }

    if (partialMatches.length) {
      return partialMatches;
    }

    return [
      {
        value: `new-department-${lowerQuery}`,
        label: lowerQuery
      }
    ];
  };

  async onSubmit() {
    if (this.employeeForm.valid) {
      const formValue = this.employeeForm.getRawValue();
      
      let departmentId = formValue.departmentId;
      let newDepartmentCreated = false;

      if (this.isCreatingNewDepartment && this.newDepartmentName) {
        try {
          const createDepartmentRequest: CreateDepartmentRequest = {
            name: this.newDepartmentName
          };
          
          const newDepartmentId = await this.employeeService.createDepartment(createDepartmentRequest).toPromise();
          if (!newDepartmentId) {
            throw new Error('Department creation failed: no ID returned.');
          }
          
          departmentId = newDepartmentId;
          newDepartmentCreated = true;
          
          this.loadDepartments();
          this.employeeForm.patchValue({ departmentId: departmentId }, { emitEvent: false });
        } catch (error) {
          console.error('Error creating department:', error);
          return;
        }
      }

      const employeeData: UpdateEmployeeRequest | CreateEmployeeRequest = {
        ...formValue,
        departmentId: departmentId,
        middleName: formValue.middleName || ''
      };

      this.save.emit({ employeeData, newDepartmentCreated });
    } else {
      this.employeeForm.markAllAsTouched();
    }
  }

  close() {
    this.resetForm();
    this.resetNewDepartmentState();
    this.cancel.emit();
  }

  get isSubmitDisabled(): boolean {
    return this.employeeForm.invalid || this.isLoading;
  }
} 