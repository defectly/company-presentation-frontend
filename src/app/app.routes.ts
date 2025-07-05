import { Routes } from '@angular/router';
import { AboutComponent } from './features/about/about.component';
import { EmployeesComponent } from './features/employees/employees.component';

export const routes: Routes = [
  { path: '', component: AboutComponent },
  { path: 'employees', component: EmployeesComponent },
  { path: '**', redirectTo: '' }
];
