import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AboutComponent } from './about.component';

describe('AboutComponent', () => {
  let component: AboutComponent;
  let fixture: ComponentFixture<AboutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AboutComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(AboutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });
  });

  describe('Content Display', () => {
    it('should display main title', () => {
      const title = fixture.nativeElement.querySelector('h1');
      expect(title.textContent.trim()).toBe('О нашей компании');
    });

    it('should display mission section', () => {
      const missionCard = fixture.nativeElement.querySelector('.card .card-title');
      expect(missionCard.textContent.trim()).toBe('Наша миссия');
      
      const missionText = fixture.nativeElement.querySelector('.card .card-text');
      expect(missionText.textContent).toContain('инновационные решения');
      expect(missionText.textContent).toContain('клиентам');
    });

    it('should display values section', () => {
      const valuesCard = fixture.nativeElement.querySelectorAll('.card')[1];
      const valuesTitle = valuesCard.querySelector('.card-title');
      expect(valuesTitle.textContent.trim()).toBe('Наши ценности');
      
      const valuesList = valuesCard.querySelectorAll('.list-group-item');
      expect(valuesList.length).toBe(4);
      
      const valueTexts = Array.from(valuesList).map((item: any) => item.textContent);
      expect(valueTexts.some(text => text.includes('Качество'))).toBe(true);
      expect(valueTexts.some(text => text.includes('Инновации'))).toBe(true);
      expect(valueTexts.some(text => text.includes('Команда'))).toBe(true);
      expect(valueTexts.some(text => text.includes('Клиентоориентированность'))).toBe(true);
    });

    it('should display contact information', () => {
      const contactCard = fixture.nativeElement.querySelector('.col-md-4 .card');
      const contactTitle = contactCard.querySelector('.card-header h5');
      expect(contactTitle.textContent.trim()).toBe('Контактная информация');
      
      const contactBody = contactCard.querySelector('.card-body');
      expect(contactBody.textContent).toContain('Москва');
      expect(contactBody.textContent).toContain('+7 (495) 123-45-67');
      expect(contactBody.textContent).toContain('info@company.ru');
      expect(contactBody.textContent).toContain('Пн-Пт: 9:00 - 18:00');
    });

    it('should display statistics section', () => {
      const statsCard = fixture.nativeElement.querySelectorAll('.col-md-4 .card')[1];
      const statsTitle = statsCard.querySelector('.card-header h5');
      expect(statsTitle.textContent.trim()).toBe('Статистика');
      
      const statsNumbers = statsCard.querySelectorAll('h4');
      const statsLabels = statsCard.querySelectorAll('small');
      
      expect(statsNumbers.length).toBe(4);
      expect(statsLabels.length).toBe(4);
      
      const numberTexts = Array.from(statsNumbers).map((num: any) => num.textContent.trim());
      const labelTexts = Array.from(statsLabels).map((label: any) => label.textContent.trim());
      
      expect(numberTexts).toContain('150+');
      expect(numberTexts).toContain('50+');
      expect(numberTexts).toContain('5');
      expect(numberTexts).toContain('100%');
      
      expect(labelTexts).toContain('Проектов');
      expect(labelTexts).toContain('Сотрудников');
      expect(labelTexts).toContain('Лет на рынке');
      expect(labelTexts).toContain('Довольных клиентов');
    });
  });

  describe('Layout Structure', () => {
    it('should have responsive Bootstrap layout', () => {
      const mainRow = fixture.nativeElement.querySelector('.row');
      expect(mainRow).toBeTruthy();
      
      const mainColumn = fixture.nativeElement.querySelector('.col-md-8');
      const sideColumn = fixture.nativeElement.querySelector('.col-md-4');
      
      expect(mainColumn).toBeTruthy();
      expect(sideColumn).toBeTruthy();
    });

    it('should have proper card structure', () => {
      const cards = fixture.nativeElement.querySelectorAll('.card');
      expect(cards.length).toBe(4);
      
      cards.forEach((card: any) => {
        expect(card.classList.contains('card')).toBe(true);
      });
    });
  });

  describe('Bootstrap Classes', () => {
    it('should use correct Bootstrap spacing classes', () => {
      const title = fixture.nativeElement.querySelector('h1');
      expect(title.classList.contains('mb-4')).toBe(true);
      
      const cards = fixture.nativeElement.querySelectorAll('.card.mb-4');
      expect(cards.length).toBe(2);
    });

    it('should use correct text color classes for statistics', () => {
      const primaryText = fixture.nativeElement.querySelector('.text-primary');
      const successText = fixture.nativeElement.querySelector('.text-success');
      const warningText = fixture.nativeElement.querySelector('.text-warning');
      const infoText = fixture.nativeElement.querySelector('.text-info');
      
      expect(primaryText).toBeTruthy();
      expect(successText).toBeTruthy();
      expect(warningText).toBeTruthy();
      expect(infoText).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      const h1 = fixture.nativeElement.querySelector('h1');
      const h4s = fixture.nativeElement.querySelectorAll('h4');
      const h5s = fixture.nativeElement.querySelectorAll('h5');
      
      expect(h1).toBeTruthy();
      expect(h4s.length).toBe(4);
      expect(h5s.length).toBe(4);
    });

    it('should have semantic list structure for values', () => {
      const listGroup = fixture.nativeElement.querySelector('.list-group');
      const listItems = fixture.nativeElement.querySelectorAll('.list-group-item');
      
      expect(listGroup).toBeTruthy();
      expect(listItems.length).toBe(4);
    });
  });

  describe('Content Quality', () => {
    it('should have meaningful mission statement', () => {
      const missionText = fixture.nativeElement.querySelector('.card-text');
      const text = missionText.textContent;
      
      expect(text.length).toBeGreaterThan(50);
      expect(text).toContain('клиентам');
      expect(text).toContain('решения');
    });

    it('should have complete contact information', () => {
      const contactCard = fixture.nativeElement.querySelector('.col-md-4 .card .card-body');
      const text = contactCard.textContent;
      
      expect(text).toContain('Адрес');
      expect(text).toContain('Телефон');
      expect(text).toContain('Email');
      expect(text).toContain('Режим работы');
    });

    it('should display realistic statistics', () => {
      const statsNumbers = fixture.nativeElement.querySelectorAll('.col-md-4 .card h4');
      const numbers = Array.from(statsNumbers).map((el: any) => el.textContent.trim());
      
      expect(numbers).toContain('150+');
      expect(numbers).toContain('50+');
      expect(numbers).toContain('5');
      expect(numbers).toContain('100%');
    });
  });
}); 