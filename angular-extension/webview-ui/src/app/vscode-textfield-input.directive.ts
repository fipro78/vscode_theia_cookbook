import {
  Directive,
  ElementRef,
  forwardRef,
  HostListener,
  Provider,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

const VSCODE_TEXTFIELD_INPUT_VALUE_ACCESSOR: Provider = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => VscodeTextfieldInputDirective),
  multi: true,
};

@Directive({
  selector: 'vscode-textfield, vscode-single-select',
  providers: [VSCODE_TEXTFIELD_INPUT_VALUE_ACCESSOR],
})
export class VscodeTextfieldInputDirective implements ControlValueAccessor {
  val = '';
  onChange: any = () => {};
  onTouched: any = () => {};

  get value() {
    return this.val;
  }

  set value(value: any) {
    if (!value || value === this.val) return;
    this.val = value;
    this.elRef.nativeElement.value = this.value;

    this.onChange(this.val);
    this.onTouched();
  }

  constructor(private elRef: ElementRef) {}

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  writeValue(value: string): void {
    this.val = value;
    this.elRef.nativeElement.value = value;
  }

  @HostListener('change', ['$event'])
  onHostChange(event: Event) {
    this.value = this.elRef.nativeElement.value;
  }

  @HostListener('input', ['$event'])
  onHostInput(event: Event) {
    this.value = this.elRef.nativeElement.value;
  }
}
