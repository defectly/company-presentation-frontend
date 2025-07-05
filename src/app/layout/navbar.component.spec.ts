import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { NavbarComponent } from './navbar.component';
import { AboutComponent } from '../features/about/about.component';
import { EmployeesComponent } from '../features/employees/employees.component';
import { Location } from '@angular/common';

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;
  let router: Router;
  let location: Location;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [
        provideRouter([
          { path: '', component: AboutComponent },
          { path: 'employees', component: EmployeesComponent }
        ])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });
  });

  describe('Navigation Structure', () => {
    it('should display brand logo/text', () => {
      const brand = fixture.nativeElement.querySelector('.navbar-brand');
      expect(brand.textContent.trim()).toBe('Управление сотрудниками');
    });

    it('should have collapsible navigation', () => {
      const navbarToggler = fixture.nativeElement.querySelector('.navbar-toggler');
      const navbarCollapse = fixture.nativeElement.querySelector('#navbarNav');
      
      expect(navbarToggler).toBeTruthy();
      expect(navbarCollapse).toBeTruthy();
      expect(navbarToggler.getAttribute('data-bs-target')).toBe('#navbarNav');
    });

    it('should display navigation links', () => {
      const navLinks = fixture.nativeElement.querySelectorAll('.nav-link');
      expect(navLinks.length).toBe(2);
      
      const linkTexts = Array.from(navLinks).map((link: any) => link.textContent.trim());
      expect(linkTexts).toContain('О компании');
      expect(linkTexts).toContain('Сотрудники');
    });

    it('should have correct route links', () => {
      const navLinks = fixture.nativeElement.querySelectorAll('.nav-link');
      const aboutLink = Array.from(navLinks).find((link: any) => 
        link.textContent.trim() === 'О компании'
      ) as HTMLElement;
      const employeesLink = Array.from(navLinks).find((link: any) => 
        link.textContent.trim() === 'Сотрудники'
      ) as HTMLElement;
      
      expect(aboutLink.getAttribute('routerLink')).toBe('/');
      expect(employeesLink.getAttribute('routerLink')).toBe('/employees');
    });
  });

  describe('Bootstrap Classes', () => {
    it('should have correct navbar classes', () => {
      const navbar = fixture.nativeElement.querySelector('nav');
      expect(navbar.classList.contains('navbar')).toBe(true);
      expect(navbar.classList.contains('navbar-expand-lg')).toBe(true);
      expect(navbar.classList.contains('navbar-dark')).toBe(true);
      expect(navbar.classList.contains('bg-dark')).toBe(true);
    });

    it('should have correct container class', () => {
      const container = fixture.nativeElement.querySelector('.container-fluid');
      expect(container).toBeTruthy();
    });

    it('should have correct nav classes', () => {
      const navbarNav = fixture.nativeElement.querySelector('.navbar-nav');
      expect(navbarNav).toBeTruthy();
      
      const navItems = fixture.nativeElement.querySelectorAll('.nav-item');
      expect(navItems.length).toBe(2);
      
      navItems.forEach((item: any) => {
        expect(item.classList.contains('nav-item')).toBe(true);
      });
    });
  });

  describe('Responsive Behavior', () => {
    it('should have responsive toggle button', () => {
      const toggleButton = fixture.nativeElement.querySelector('.navbar-toggler');
      expect(toggleButton.getAttribute('type')).toBe('button');
      expect(toggleButton.getAttribute('data-bs-toggle')).toBe('collapse');
      expect(toggleButton.getAttribute('data-bs-target')).toBe('#navbarNav');
    });

    it('should have toggler icon', () => {
      const togglerIcon = fixture.nativeElement.querySelector('.navbar-toggler-icon');
      expect(togglerIcon).toBeTruthy();
    });

    it('should have collapsible navigation area', () => {
      const collapse = fixture.nativeElement.querySelector('.collapse.navbar-collapse');
      expect(collapse).toBeTruthy();
      expect(collapse.id).toBe('navbarNav');
    });
  });

  describe('Active Route Highlighting', () => {
    it('should use routerLinkActive directive', () => {
      const navLinks = fixture.nativeElement.querySelectorAll('.nav-link');
      
      navLinks.forEach((link: any) => {
        expect(link.hasAttribute('routerLinkActive')).toBe(true);
        expect(link.getAttribute('routerLinkActive')).toBe('active');
      });
    });

    it('should have exact matching for home route', () => {
      const aboutLink = fixture.nativeElement.querySelector('[routerLink="/"]');
      expect(aboutLink).toBeTruthy();
      expect(aboutLink.getAttribute('routerLink')).toBe('/');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      const toggleButton = fixture.nativeElement.querySelector('.navbar-toggler');
      expect(toggleButton.getAttribute('aria-controls')).toBe('navbarNav');
      expect(toggleButton.getAttribute('aria-expanded')).toBe('false');
      expect(toggleButton.getAttribute('aria-label')).toBe('Toggle navigation');
    });

    it('should have semantic navigation structure', () => {
      const nav = fixture.nativeElement.querySelector('nav');
      const navList = fixture.nativeElement.querySelector('ul.navbar-nav');
      const navItems = fixture.nativeElement.querySelectorAll('li.nav-item');
      
      expect(nav).toBeTruthy();
      expect(navList).toBeTruthy();
      expect(navItems.length).toBe(2);
    });
  });

  describe('Brand Styling', () => {
    it('should have correct brand styling', () => {
      const brand = fixture.nativeElement.querySelector('.navbar-brand');
      expect(brand.classList.contains('navbar-brand')).toBe(true);
    });

    it('should display correct brand text', () => {
      const brand = fixture.nativeElement.querySelector('.navbar-brand');
      expect(brand.textContent.trim()).toBe('Управление сотрудниками');
    });
  });

  describe('Navigation Functionality', () => {
    it('should navigate to about page when about link clicked', async () => {
      const aboutLink = fixture.nativeElement.querySelector('[routerLink="/"]');
      
      await router.navigate(['/employees']);
      expect(location.path()).toBe('/employees');
      
      aboutLink.click();
      fixture.detectChanges();
      await fixture.whenStable();
      
      expect(location.path()).toBe('');
    });

    it('should navigate to employees page when employees link clicked', async () => {
      const employeesLink = fixture.nativeElement.querySelector('[routerLink="/employees"]');
      
      employeesLink.click();
      fixture.detectChanges();
      await fixture.whenStable();
      
      expect(location.path()).toBe('/employees');
    });
  });
}); 