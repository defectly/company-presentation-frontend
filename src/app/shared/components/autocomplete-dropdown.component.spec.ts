import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';
import { AutocompleteDropdownComponent, AutocompleteOption } from './autocomplete-dropdown.component';

describe('AutocompleteDropdownComponent', () => {
  let component: AutocompleteDropdownComponent;
  let fixture: ComponentFixture<AutocompleteDropdownComponent>;
  let inputElement: HTMLInputElement;

  const mockOptions: AutocompleteOption[] = [
    { value: '1', label: 'Option 1' },
    { value: '2', label: 'Option 2' },
    { value: '3', label: 'Another Option' },
    { value: '4', label: 'Test Option' }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AutocompleteDropdownComponent, FormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(AutocompleteDropdownComponent);
    component = fixture.componentInstance;
    component.options = mockOptions;
    fixture.detectChanges();

    inputElement = fixture.debugElement.query(By.css('input')).nativeElement;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should initialize with correct default values', () => {
      expect(component.filteredOptions).toEqual(mockOptions);
      expect(component.showDropdown).toBe(false);
      expect(component.highlightedIndex).toBe(-1);
      expect(component.displayValue).toBe('');
      expect(component.disabled).toBe(false);
    });

    it('should set placeholder correctly', () => {
      component.placeholder = 'Test placeholder';
      fixture.detectChanges();
      
      expect(inputElement.placeholder).toBe('Test placeholder');
    });

    it('should set input class correctly', () => {
      component.inputClass = 'custom-class';
      fixture.detectChanges();
      
      expect(inputElement.className).toContain('custom-class');
    });
  });

  describe('ControlValueAccessor Implementation', () => {
    it('should write value correctly', () => {
      component.writeValue('2');
      expect(component.displayValue).toBe('Option 2');
    });

    it('should handle non-existent value', () => {
      component.writeValue('999');
      expect(component.displayValue).toBe('');
    });

    it('should handle null value', () => {
      component.writeValue(null as any);
      expect(component.displayValue).toBe('');
    });

    it('should register onChange callback', () => {
      const mockOnChange = jasmine.createSpy('onChange');
      component.registerOnChange(mockOnChange);
      
      component.onInput({ target: { value: 'test' } } as any);
      expect(mockOnChange).toHaveBeenCalledWith('test');
    });

    it('should register onTouched callback', () => {
      const mockOnTouched = jasmine.createSpy('onTouched');
      component.registerOnTouched(mockOnTouched);
      
      component.onBlur();
      expect(mockOnTouched).toHaveBeenCalled();
    });

    it('should set disabled state', () => {
      component.setDisabledState(true);
      expect(component.disabled).toBe(true);
      
      component.setDisabledState(false);
      expect(component.disabled).toBe(false);
    });
  });

  describe('Focus and Blur Events', () => {
    it('should show dropdown on focus', () => {
      component.onFocus();
      
      expect(component.showDropdown).toBe(true);
      expect(component.filteredOptions).toEqual(mockOptions);
      expect(component.highlightedIndex).toBe(-1);
    });

    it('should hide dropdown on blur after delay', (done) => {
      component.showDropdown = true;
      component.highlightedIndex = 1;
      
      component.onBlur();
      
      setTimeout(() => {
        expect(component.showDropdown).toBe(false);
        expect(component.highlightedIndex).toBe(-1);
        done();
      }, 250);
    });
  });

  describe('Input Events', () => {
    it('should update display value on input', () => {
      const mockEvent = { target: { value: 'test input' } } as any;
      component.onInput(mockEvent);
      
      expect(component.displayValue).toBe('test input');
    });

    it('should filter options on input', () => {
      const mockEvent = { target: { value: 'Option 1' } } as any;
      component.onInput(mockEvent);
      
      expect(component.filteredOptions.length).toBe(1);
      expect(component.filteredOptions[0].label).toBe('Option 1');
    });

    it('should reset highlighted index on input', () => {
      component.highlightedIndex = 2;
      const mockEvent = { target: { value: 'test' } } as any;
      component.onInput(mockEvent);
      
      expect(component.highlightedIndex).toBe(-1);
    });

    it('should emit selectionChange for existing option', () => {
      spyOn(component.selectionChange, 'emit');
      const mockEvent = { target: { value: 'Option 1' } } as any;
      component.onInput(mockEvent);
      
      expect(component.selectionChange.emit).toHaveBeenCalledWith(mockOptions[0]);
    });

    it('should emit selectionChange for new department', () => {
      spyOn(component.selectionChange, 'emit');
      const mockEvent = { target: { value: 'New Department' } } as any;
      component.onInput(mockEvent);
      
      expect(component.selectionChange.emit).toHaveBeenCalledWith({
        value: 'new-department-New Department',
        label: 'New Department'
      });
    });

    it('should emit null for empty input', () => {
      spyOn(component.selectionChange, 'emit');
      const mockEvent = { target: { value: '' } } as any;
      component.onInput(mockEvent);
      
      expect(component.selectionChange.emit).toHaveBeenCalledWith(null);
    });
  });

  describe('Keyboard Navigation', () => {
    beforeEach(() => {
      component.showDropdown = true;
      component.filteredOptions = mockOptions;
      component.highlightedIndex = -1;
    });

    it('should handle ArrowDown key', () => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      spyOn(event, 'preventDefault');
      
      component.onKeydown(event);
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.highlightedIndex).toBe(0);
    });

    it('should handle ArrowUp key', () => {
      component.highlightedIndex = 1;
      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      spyOn(event, 'preventDefault');
      
      component.onKeydown(event);
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.highlightedIndex).toBe(0);
    });

    it('should handle Enter key', () => {
      component.highlightedIndex = 1;
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      spyOn(event, 'preventDefault');
      spyOn(component, 'selectOption');
      
      component.onKeydown(event);
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.selectOption).toHaveBeenCalledWith(mockOptions[1]);
    });

    it('should handle Escape key', () => {
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      spyOn(event, 'preventDefault');
      
      component.onKeydown(event);
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.showDropdown).toBe(false);
      expect(component.highlightedIndex).toBe(-1);
    });

    it('should handle Tab key when options exist', () => {
      const event = new KeyboardEvent('keydown', { key: 'Tab' });
      spyOn(event, 'preventDefault');
      spyOn(component, 'selectOption');
      
      component.onKeydown(event);
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.selectOption).toHaveBeenCalledWith(mockOptions[0]);
    });

    it('should handle Tab key when no options exist', () => {
      component.filteredOptions = [];
      const event = new KeyboardEvent('keydown', { key: 'Tab' });
      spyOn(event, 'preventDefault');
      
      component.onKeydown(event);
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.showDropdown).toBe(false);
    });

    it('should not handle keys when dropdown is closed', () => {
      component.showDropdown = false;
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      spyOn(event, 'preventDefault');
      
      component.onKeydown(event);
      
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should not handle keys when no options available', () => {
      component.filteredOptions = [];
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      spyOn(event, 'preventDefault');
      
      component.onKeydown(event);
      
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should not go beyond array bounds with ArrowDown', () => {
      component.highlightedIndex = mockOptions.length - 1;
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      
      component.onKeydown(event);
      
      expect(component.highlightedIndex).toBe(mockOptions.length - 1);
    });

    it('should not go below 0 with ArrowUp', () => {
      component.highlightedIndex = 0;
      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      
      component.onKeydown(event);
      
      expect(component.highlightedIndex).toBe(0);
    });

    it('should not handle ArrowUp key when dropdown is closed', () => {
      component.showDropdown = false;
      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      spyOn(event, 'preventDefault');

      component.onKeydown(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(component.highlightedIndex).toBe(-1);
    });

    it('should not handle ArrowUp key when no options are available', () => {
      component.showDropdown = true;
      component.filteredOptions = [];

      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      spyOn(event, 'preventDefault');

      component.onKeydown(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(component.highlightedIndex).toBe(-1);
    });

    it('should not handle Enter key when dropdown is closed', () => {
      component.showDropdown = false;
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      spyOn(event, 'preventDefault');
      spyOn(component, 'selectOption');

      component.onKeydown(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(component.selectOption).not.toHaveBeenCalled();
    });

    it('should not handle Enter key when no options are available', () => {
      component.showDropdown = true;
      component.filteredOptions = [];

      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      spyOn(event, 'preventDefault');
      spyOn(component, 'selectOption');

      component.onKeydown(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(component.selectOption).not.toHaveBeenCalled();
    });
  });

  describe('Option Selection', () => {
    it('should select option correctly', () => {
      spyOn(component.selectionChange, 'emit');
      const mockOnChange = jasmine.createSpy('onChange');
      component.registerOnChange(mockOnChange);
      
      component.selectOption(mockOptions[1]);
      
      expect(component.displayValue).toBe('Option 2');
      expect(component.showDropdown).toBe(false);
      expect(component.highlightedIndex).toBe(-1);
      expect(mockOnChange).toHaveBeenCalledWith('2');
      expect(component.selectionChange.emit).toHaveBeenCalledWith(mockOptions[1]);
    });
  });

  describe('Filtering', () => {
    it('should filter options with default filter function', () => {
      component.onInput({ target: { value: 'Option' } } as any);
      
      expect(component.filteredOptions.length).toBe(4);
      expect(component.filteredOptions.every(opt => opt.label.toLowerCase().includes('option'))).toBe(true);
    });

    it('should use custom filter function when provided', () => {
      const customFilter = jasmine.createSpy('customFilter').and.returnValue([mockOptions[0]]);
      component.filterFunction = customFilter;
      
      component.onInput({ target: { value: 'test' } } as any);
      
      expect(customFilter).toHaveBeenCalledWith(mockOptions, 'test');
      expect(component.filteredOptions).toEqual([mockOptions[0]]);
    });

    it('should handle empty filter query', () => {
      component.onInput({ target: { value: '' } } as any);
      
      expect(component.filteredOptions).toEqual(mockOptions);
    });

    it('should handle case-insensitive filtering', () => {
      component.onInput({ target: { value: 'OPTION' } } as any);
      
      expect(component.filteredOptions.length).toBe(4);
    });

    it('should set showDropdown to false when custom filter returns no results', () => {
      const emptyFilter = jasmine.createSpy('emptyFilter').and.returnValue([]);
      component.filterFunction = emptyFilter;

      component.onInput({ target: { value: 'non-matching' } } as any);

      expect(emptyFilter).toHaveBeenCalled();
      expect(component.filteredOptions).toEqual([]);
      expect(component.showDropdown).toBe(false);
    });

    it('should call custom filter with empty array when options is undefined', () => {
      const customFilter = jasmine.createSpy('customFilter').and.returnValue([]);
      component.filterFunction = customFilter;
      component.options = undefined as any;

      // Directly invoke filterOptions to hit the custom-filter path with [] fallback
      (component as any).filterOptions('abc');

      expect(customFilter).toHaveBeenCalledWith([], 'abc');
      expect(component.filteredOptions).toEqual([]);
      expect(component.showDropdown).toBe(false);
    });
  });

  describe('Template Rendering', () => {
    it('should render input element with correct attributes', () => {
      component.placeholder = 'Search...';
      component.inputClass = 'test-class';
      fixture.detectChanges();
      
      expect(inputElement.placeholder).toBe('Search...');
      expect(inputElement.className).toContain('test-class');
      expect(inputElement.getAttribute('role')).toBe('combobox');
      expect(inputElement.getAttribute('aria-autocomplete')).toBe('list');
    });

    it('should show dropdown when showDropdown is true and options exist', () => {
      component.showDropdown = true;
      component.filteredOptions = mockOptions;
      fixture.detectChanges();
      
      const dropdown = fixture.debugElement.query(By.css('.dropdown-menu'));
      expect(dropdown).toBeTruthy();
    });

    it('should not show dropdown when showDropdown is false', () => {
      component.showDropdown = false;
      fixture.detectChanges();
      
      const dropdown = fixture.debugElement.query(By.css('.dropdown-menu'));
      expect(dropdown).toBeFalsy();
    });

    it('should not show dropdown when no options exist', () => {
      component.showDropdown = true;
      component.filteredOptions = [];
      fixture.detectChanges();
      
      const dropdown = fixture.debugElement.query(By.css('.dropdown-menu'));
      expect(dropdown).toBeFalsy();
    });

    it('should render correct number of options', () => {
      component.showDropdown = true;
      component.filteredOptions = mockOptions.slice(0, 2);
      fixture.detectChanges();
      
      const options = fixture.debugElement.queryAll(By.css('.dropdown-item'));
      expect(options.length).toBe(2);
    });

    it('should highlight correct option', () => {
      component.showDropdown = true;
      component.filteredOptions = mockOptions;
      component.highlightedIndex = 1;
      fixture.detectChanges();
      
      const options = fixture.debugElement.queryAll(By.css('.dropdown-item'));
      expect(options[1].nativeElement.classList.contains('highlighted')).toBe(true);
      expect(options[1].nativeElement.classList.contains('active')).toBe(true);
    });

    it('should handle option click', () => {
      spyOn(component, 'selectOption');
      component.showDropdown = true;
      component.filteredOptions = mockOptions;
      fixture.detectChanges();
      
      const firstOption = fixture.debugElement.query(By.css('.dropdown-item'));
      firstOption.triggerEventHandler('mousedown', null);
      
      expect(component.selectOption).toHaveBeenCalledWith(mockOptions[0]);
    });

    it('should update highlighted index on mouseenter', () => {
      component.showDropdown = true;
      component.filteredOptions = mockOptions;
      fixture.detectChanges();
      
      const secondOption = fixture.debugElement.queryAll(By.css('.dropdown-item'))[1];
      secondOption.triggerEventHandler('mouseenter', null);
      
      expect(component.highlightedIndex).toBe(1);
    });
  });

  describe('Component Lifecycle', () => {
    it('should initialize filteredOptions on ngOnInit', () => {
      component.options = [{ value: 'test', label: 'Test' }];
      component.ngOnInit();
      
      expect(component.filteredOptions).toEqual([{ value: 'test', label: 'Test' }]);
    });

    it('should complete destroy subject on ngOnDestroy', () => {
      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');
      
      component.ngOnDestroy();
      
      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined options', () => {
      component.options = undefined as any;
      component.ngOnInit();
      
      expect(component.filteredOptions).toEqual([]);
    });

    it('should handle null options', () => {
      component.options = null as any;
      component.ngOnInit();
      
      expect(component.filteredOptions).toEqual([]);
    });

    it('should handle empty options array', () => {
      component.options = [];
      component.ngOnInit();
      
      expect(component.filteredOptions).toEqual([]);
    });

    it('should handle Enter key with invalid highlighted index', () => {
      component.showDropdown = true;
      component.filteredOptions = mockOptions;
      component.highlightedIndex = 999;
      
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      spyOn(component, 'selectOption');
      
      component.onKeydown(event);
      
      expect(component.selectOption).not.toHaveBeenCalled();
    });

    it('should handle Enter key with negative highlighted index', () => {
      component.showDropdown = true;
      component.filteredOptions = mockOptions;
      component.highlightedIndex = -1;
      
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      spyOn(component, 'selectOption');
      
      component.onKeydown(event);
      
      expect(component.selectOption).not.toHaveBeenCalled();
    });
  });

  describe('Additional Branch Coverage Tests', () => {
    describe('onInput edge cases', () => {
      it('should handle input with only whitespace', () => {
        spyOn(component.selectionChange, 'emit');
        component.onInput({ target: { value: '   ' } } as any);
        
        expect(component.displayValue).toBe('   ');
        expect(component.selectionChange.emit).toHaveBeenCalledWith({
          value: 'new-department-',
          label: ''
        });
      });
      
      it('should handle input with mixed case matching', () => {
        spyOn(component.selectionChange, 'emit');
        component.onInput({ target: { value: 'OPTION 1' } } as any);
        
        expect(component.selectionChange.emit).toHaveBeenCalledWith(mockOptions[0]);
      });
      
      it('should handle input with partial matching', () => {
        spyOn(component.selectionChange, 'emit');
        component.onInput({ target: { value: 'Opt' } } as any);
        
        expect(component.selectionChange.emit).toHaveBeenCalledWith({
          value: 'new-department-Opt',
          label: 'Opt'
        });
      });
      
      it('should handle input when options is undefined', () => {
        component.options = undefined as any;
        spyOn(component.selectionChange, 'emit');
        
        component.onInput({ target: { value: 'test' } } as any);
        
        expect(component.selectionChange.emit).toHaveBeenCalledWith({
          value: 'new-department-test',
          label: 'test'
        });
      });
      
      it('should handle input when options is null', () => {
        component.options = null as any;
        spyOn(component.selectionChange, 'emit');
        
        component.onInput({ target: { value: 'test' } } as any);
        
        expect(component.selectionChange.emit).toHaveBeenCalledWith({
          value: 'new-department-test',
          label: 'test'
        });
      });
    });
    
    describe('onKeydown edge cases', () => {
      it('should handle ArrowDown when already at last option', () => {
        component.showDropdown = true;
        component.filteredOptions = mockOptions;
        component.highlightedIndex = mockOptions.length - 1;
        
        const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
        spyOn(event, 'preventDefault');
                 spyOn(component as any, 'scrollToHighlightedItem');
         
         component.onKeydown(event);
         
         expect(event.preventDefault).toHaveBeenCalled();
         expect(component.highlightedIndex).toBe(mockOptions.length - 1);
         expect((component as any).scrollToHighlightedItem).toHaveBeenCalled();
      });
      
      it('should handle ArrowUp when already at first option', () => {
        component.showDropdown = true;
        component.filteredOptions = mockOptions;
        component.highlightedIndex = 0;
        
        const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
        spyOn(event, 'preventDefault');
                 spyOn(component as any, 'scrollToHighlightedItem');
         
         component.onKeydown(event);
         
         expect(event.preventDefault).toHaveBeenCalled();
         expect(component.highlightedIndex).toBe(0);
         expect((component as any).scrollToHighlightedItem).toHaveBeenCalled();
      });
      
      it('should handle Enter when highlightedIndex is at boundary', () => {
        component.showDropdown = true;
        component.filteredOptions = mockOptions;
        component.highlightedIndex = mockOptions.length - 1;
        
        const event = new KeyboardEvent('keydown', { key: 'Enter' });
        spyOn(event, 'preventDefault');
        spyOn(component, 'selectOption');
        
        component.onKeydown(event);
        
        expect(event.preventDefault).toHaveBeenCalled();
        expect(component.selectOption).toHaveBeenCalledWith(mockOptions[mockOptions.length - 1]);
      });
      
      it('should handle Escape when dropdown is already closed', () => {
        component.showDropdown = false;
        
        const event = new KeyboardEvent('keydown', { key: 'Escape' });
        spyOn(event, 'preventDefault');
        
        component.onKeydown(event);
        
        expect(event.preventDefault).not.toHaveBeenCalled();
      });
      
      it('should handle Tab when dropdown is closed', () => {
        component.showDropdown = false;
        
        const event = new KeyboardEvent('keydown', { key: 'Tab' });
        spyOn(event, 'preventDefault');
        
        component.onKeydown(event);
        
        expect(event.preventDefault).not.toHaveBeenCalled();
      });
      
      it('should handle Tab when filteredOptions is empty', () => {
        component.showDropdown = true;
        component.filteredOptions = [];
        
        const event = new KeyboardEvent('keydown', { key: 'Tab' });
        spyOn(event, 'preventDefault');
        
        component.onKeydown(event);
        
        expect(event.preventDefault).toHaveBeenCalled();
        expect(component.showDropdown).toBe(false);
        expect(component.highlightedIndex).toBe(-1);
      });
      
      it('should handle unknown key', () => {
        component.showDropdown = true;
        component.filteredOptions = mockOptions;
        
        const event = new KeyboardEvent('keydown', { key: 'Space' });
        spyOn(event, 'preventDefault');
        
        component.onKeydown(event);
        
        expect(event.preventDefault).not.toHaveBeenCalled();
      });
    });
    
    describe('writeValue edge cases', () => {
      it('should handle writeValue when options is undefined', () => {
        component.options = undefined as any;
        component.writeValue('test');
        
        expect(component.displayValue).toBe('');
      });
      
      it('should handle writeValue when options is null', () => {
        component.options = null as any;
        component.writeValue('test');
        
        expect(component.displayValue).toBe('');
      });
      
      it('should handle writeValue with empty string', () => {
        component.writeValue('');
        
        expect(component.displayValue).toBe('');
      });
      
      it('should handle writeValue with undefined', () => {
        component.writeValue(undefined as any);
        
        expect(component.displayValue).toBe('');
      });
      
      it('should handle writeValue with null', () => {
        component.writeValue(null as any);
        
        expect(component.displayValue).toBe('');
      });
    });
    
    describe('onFocus edge cases', () => {
      it('should handle onFocus when options is null', () => {
        component.options = null as any;
        component.onFocus();
        
        expect(component.filteredOptions).toEqual([]);
        expect(component.showDropdown).toBe(true);
        expect(component.highlightedIndex).toBe(-1);
      });
      
      it('should handle onFocus when options is undefined', () => {
        component.options = undefined as any;
        component.onFocus();
        
        expect(component.filteredOptions).toEqual([]);
        expect(component.showDropdown).toBe(true);
        expect(component.highlightedIndex).toBe(-1);
      });
    });
    
    describe('filterOptions edge cases', () => {
      it('should handle filterOptions with null options', () => {
        component.options = null as any;
        (component as any).filterOptions('test');
        
        expect(component.filteredOptions).toEqual([]);
        expect(component.showDropdown).toBe(false);
      });
      
      it('should handle filterOptions with undefined options', () => {
        component.options = undefined as any;
        (component as any).filterOptions('test');
        
        expect(component.filteredOptions).toEqual([]);
        expect(component.showDropdown).toBe(false);
      });
      
      it('should handle filterOptions with empty query and null options', () => {
        component.options = null as any;
        (component as any).filterOptions('');
        
        expect(component.filteredOptions).toEqual([]);
        expect(component.showDropdown).toBe(false);
      });
      
      it('should handle filterOptions with empty query and undefined options', () => {
        component.options = undefined as any;
        (component as any).filterOptions('');
        
        expect(component.filteredOptions).toEqual([]);
        expect(component.showDropdown).toBe(false);
      });
      
      it('should show dropdown when filtered options exist', () => {
        component.options = mockOptions;
        (component as any).filterOptions('Option 1');
        
        expect(component.showDropdown).toBe(true);
        expect(component.filteredOptions.length).toBeGreaterThan(0);
      });
      
      it('should hide dropdown when no filtered options exist', () => {
        component.options = mockOptions;
        (component as any).filterOptions('NonExistentOption');
        
        expect(component.showDropdown).toBe(false);
        expect(component.filteredOptions.length).toBe(0);
      });
      
    });
    
    describe('scrollToHighlightedItem edge cases', () => {
      it('should handle scrollToHighlightedItem when no dropdown element exists', () => {
        // Mock document.querySelector to return null
        const originalQuerySelector = document.querySelector;
        spyOn(document, 'querySelector').and.returnValue(null);
        
        expect(() => {
          (component as any).scrollToHighlightedItem();
        }).not.toThrow();
        
        // Restore original method
        document.querySelector = originalQuerySelector;
      });
      
      it('should handle scrollToHighlightedItem when no highlighted element exists', () => {
        // Mock document.querySelector to return a mock dropdown without highlighted item
        const mockDropdown = {
          querySelector: jasmine.createSpy('querySelector').and.returnValue(null)
        };
        spyOn(document, 'querySelector').and.returnValue(mockDropdown as any);
        
        expect(() => {
          (component as any).scrollToHighlightedItem();
        }).not.toThrow();
      });
      
      it('should call scrollIntoView when highlighted element exists', (done) => {
        // Mock document.querySelector to return elements with scrollIntoView
        const mockScrollIntoView = jasmine.createSpy('scrollIntoView');
        const mockHighlightedElement = {
          scrollIntoView: mockScrollIntoView
        };
        const mockDropdown = {
          querySelector: jasmine.createSpy('querySelector').and.returnValue(mockHighlightedElement)
        };
        spyOn(document, 'querySelector').and.returnValue(mockDropdown as any);
        
        (component as any).scrollToHighlightedItem();
        
        setTimeout(() => {
          expect(mockScrollIntoView).toHaveBeenCalledWith({ block: 'nearest' });
          done();
        }, 10);
      });
    });
    
    describe('Disabled state', () => {
      it('should handle disabled state in template', () => {
        component.setDisabledState(true);
        fixture.detectChanges();
        
        expect(component.disabled).toBe(true);
      });
      
      it('should handle enabled state in template', () => {
        component.setDisabledState(false);
        fixture.detectChanges();
        
        expect(component.disabled).toBe(false);
      });
    });
    
    describe('Complex interaction scenarios', () => {
      it('should handle rapid input changes', () => {
        spyOn(component.selectionChange, 'emit');
        
        component.onInput({ target: { value: 'O' } } as any);
        component.onInput({ target: { value: 'Op' } } as any);
        component.onInput({ target: { value: 'Opt' } } as any);
        component.onInput({ target: { value: 'Option' } } as any);
        
        expect(component.selectionChange.emit).toHaveBeenCalledTimes(4);
      });
      
      it('should handle keyboard navigation with filtered results', () => {
        component.onInput({ target: { value: 'Option' } } as any);
        
        expect(component.filteredOptions.length).toBe(4);
        
        const arrowDownEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
        component.onKeydown(arrowDownEvent);
        
        expect(component.highlightedIndex).toBe(0);
        
        const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
        spyOn(component, 'selectOption');
        component.onKeydown(enterEvent);
        
        expect(component.selectOption).toHaveBeenCalledWith(component.filteredOptions[0]);
      });
      
      it('should handle focus after blur timeout', (done) => {
        component.onFocus();
        expect(component.showDropdown).toBe(true);
        
        component.onBlur();
        
        setTimeout(() => {
          component.onFocus();
          expect(component.showDropdown).toBe(true);
          done();
        }, 250);
      });
    });
  });
}); 