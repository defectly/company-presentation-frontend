import { Component, Input, Output, EventEmitter, forwardRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export interface AutocompleteOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-autocomplete-dropdown',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AutocompleteDropdownComponent),
      multi: true
    }
  ],
  template: `
    <div class="position-relative">
      <input 
        type="text" 
        [class]="inputClass"
        [placeholder]="placeholder"
        [value]="displayValue"
        (focus)="onFocus()"
        (blur)="onBlur()"
        (input)="onInput($event)"
        (keydown)="onKeydown($event)"
        autocomplete="off"
        role="combobox"
        [attr.aria-expanded]="showDropdown"
        aria-autocomplete="list">
      
      <div 
        class="dropdown-menu show position-absolute w-100" 
        style="max-height: 200px; overflow-y: auto; z-index: 1000;"
        *ngIf="showDropdown && filteredOptions.length > 0"
        role="listbox">
        <button 
          type="button" 
          class="dropdown-item" 
          [class.highlighted]="i === highlightedIndex"
          [class.active]="i === highlightedIndex"
          *ngFor="let option of filteredOptions; let i = index"
          (mousedown)="selectOption(option)"
          (mouseenter)="highlightedIndex = i"
          role="option"
          [attr.aria-selected]="i === highlightedIndex">
          {{ option.label }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .dropdown-item.highlighted,
    .dropdown-item:focus {
      background-color: var(--bs-primary);
      color: white;
    }

    .dropdown-item.highlighted:hover {
      background-color: var(--bs-primary);
      color: white;
    }
  `]
})
export class AutocompleteDropdownComponent implements ControlValueAccessor, OnInit, OnDestroy {
  @Input() options: AutocompleteOption[] = [];
  @Input() placeholder = '';
  @Input() inputClass = 'form-control form-control-sm';
  @Input() filterFunction?: (options: AutocompleteOption[], query: string) => AutocompleteOption[];
  
  @Output() selectionChange = new EventEmitter<AutocompleteOption | null>();

  filteredOptions: AutocompleteOption[] = [];
  showDropdown = false;
  highlightedIndex = -1;
  displayValue = '';

  disabled = false;
  private destroy$ = new Subject<void>();
  private onChange = (value: string) => {};
  private onTouched = () => {};

  ngOnInit(): void {
    this.filteredOptions = this.options || [];
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ControlValueAccessor implementation
  writeValue(value: string): void {
    const selectedOption = this.options?.find(option => option.value === value);
    this.displayValue = selectedOption ? selectedOption.label : '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onFocus(): void {
    this.filteredOptions = this.options || [];
    this.showDropdown = true;
    this.highlightedIndex = -1;
  }

  onBlur(): void {
    this.onTouched();
    // Add delay to allow for option selection
    setTimeout(() => {
      this.showDropdown = false;
      this.highlightedIndex = -1;
    }, 200);
  }

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = target.value;
    
    this.displayValue = value;
    this.onChange(value);
    
    this.filterOptions(value);
    this.highlightedIndex = -1;

    // Emit selection change for new department detection
    if (value) {
      const existingOption = this.options?.find(option => 
        option.label.toLowerCase() === value.toLowerCase()
      );
      
      if (!existingOption) {
        // This might be a new department being typed
        // For whitespace-only input, emit with empty label
        const trimmedValue = value.trim();
        this.selectionChange.emit({
          value: `new-department-${trimmedValue}`,
          label: trimmedValue
        });
      } else {
        this.selectionChange.emit(existingOption);
      }
    } else {
      this.selectionChange.emit(null);
    }
  }

  onKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowDown':
        if (!this.showDropdown || this.filteredOptions.length === 0) {
          return;
        }
        event.preventDefault();
        this.highlightedIndex = Math.min(
          this.highlightedIndex + 1, 
          this.filteredOptions.length - 1
        );
        this.scrollToHighlightedItem();
        break;

      case 'ArrowUp':
        if (!this.showDropdown || this.filteredOptions.length === 0) {
          return;
        }
        event.preventDefault();
        this.highlightedIndex = Math.max(this.highlightedIndex - 1, 0);
        this.scrollToHighlightedItem();
        break;

      case 'Enter':
        if (!this.showDropdown || this.filteredOptions.length === 0) {
          return;
        }
        event.preventDefault();
        if (this.highlightedIndex >= 0 && this.highlightedIndex < this.filteredOptions.length) {
          this.selectOption(this.filteredOptions[this.highlightedIndex]);
        }
        break;

      case 'Escape':
        if (!this.showDropdown) {
          return;
        }
        event.preventDefault();
        this.showDropdown = false;
        this.highlightedIndex = -1;
        break;

      case 'Tab':
        if (!this.showDropdown) {
          return;
        }
        event.preventDefault();
        if (this.filteredOptions.length > 0) {
          this.selectOption(this.filteredOptions[0]);
        } else {
          this.showDropdown = false;
          this.highlightedIndex = -1;
        }
        break;
    }
  }

  selectOption(option: AutocompleteOption): void {
    this.displayValue = option.label;
    this.onChange(option.value);
    this.showDropdown = false;
    this.highlightedIndex = -1;
    this.selectionChange.emit(option);
  }

  private filterOptions(query: string): void {
    if (this.filterFunction) {
      this.filteredOptions = this.filterFunction(this.options || [], query);
    } else {
      const lowerQuery = query.toLowerCase();
      if (lowerQuery === '') {
        this.filteredOptions = this.options || [];
      } else {
        this.filteredOptions = (this.options || []).filter(option =>
          option.label.toLowerCase().includes(lowerQuery)
        );
      }
    }
    this.showDropdown = this.filteredOptions.length > 0;
  }

  private scrollToHighlightedItem(): void {
    setTimeout(() => {
      const dropdownElement = document.querySelector('.dropdown-menu.show');
      const highlightedElement = dropdownElement?.querySelector('.dropdown-item.highlighted');
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: 'nearest' });
      }
    });
  }
} 