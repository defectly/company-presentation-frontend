import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MainLayoutComponent } from './main-layout.component';
import { AboutComponent } from '../features/about/about.component';
import { EmployeesComponent } from '../features/employees/employees.component';

describe('MainLayoutComponent', () => {
  let component: MainLayoutComponent;
  let fixture: ComponentFixture<MainLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainLayoutComponent],
      providers: [
        provideRouter([
          { path: '', component: AboutComponent },
          { path: 'employees', component: EmployeesComponent }
        ])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MainLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });
  });

  describe('Layout Structure', () => {
    it('should contain navbar component', () => {
      const navbar = fixture.nativeElement.querySelector('app-navbar');
      expect(navbar).toBeTruthy();
    });

    it('should contain main content area', () => {
      const main = fixture.nativeElement.querySelector('main');
      expect(main).toBeTruthy();
    });

    it('should contain router outlet', () => {
      const routerOutlet = fixture.nativeElement.querySelector('router-outlet');
      expect(routerOutlet).toBeTruthy();
    });

    it('should have proper Bootstrap container', () => {
      const container = fixture.nativeElement.querySelector('.container');
      expect(container).toBeTruthy();
    });
  });

  describe('Layout Classes', () => {
    it('should have correct main element classes', () => {
      const main = fixture.nativeElement.querySelector('main');
      expect(main.classList.contains('container')).toBe(true);
      expect(main.classList.contains('mt-4')).toBe(true);
    });
  });

  describe('Component Composition', () => {
    it('should render navbar at the top', () => {
      const navbar = fixture.nativeElement.querySelector('app-navbar');
      const main = fixture.nativeElement.querySelector('main');
      
      expect(navbar).toBeTruthy();
      expect(main).toBeTruthy();
      
      
      const navbarPosition = Array.from(fixture.nativeElement.children).indexOf(navbar);
      const mainPosition = Array.from(fixture.nativeElement.children).indexOf(main);
      
      expect(navbarPosition).toBeLessThan(mainPosition);
    });

    it('should have router outlet inside main', () => {
      const main = fixture.nativeElement.querySelector('main');
      const routerOutlet = main.querySelector('router-outlet');
      
      expect(routerOutlet).toBeTruthy();
    });
  });

  describe('Responsive Design', () => {
    it('should use container for responsive layout', () => {
      const container = fixture.nativeElement.querySelector('.container');
      expect(container).toBeTruthy();
    });

    it('should have proper margin for content spacing', () => {
      const main = fixture.nativeElement.querySelector('main');
      expect(main.classList.contains('mt-4')).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('should use semantic main element', () => {
      const main = fixture.nativeElement.querySelector('main');
      expect(main.tagName.toLowerCase()).toBe('main');
    });

    it('should have proper document structure', () => {
      const navbar = fixture.nativeElement.querySelector('app-navbar');
      const main = fixture.nativeElement.querySelector('main');
      
      expect(navbar).toBeTruthy();
      expect(main).toBeTruthy();
    });
  });
}); 