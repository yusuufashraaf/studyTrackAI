import { Directive, ElementRef, EventEmitter, HostListener, Output } from '@angular/core';

@Directive({
  selector: 'input[appPasswordvalidate]',
})
export class Passwordvalidate {
  constructor(private el: ElementRef) {}
  isValid = false;
@Output() passwordValid = new EventEmitter<boolean>();
  private passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()\-_=+])[A-Za-z\d@$!%*?&#^()\-_=+]{8,}$/;

  @HostListener('input') onInput() {
    const value: string = this.el.nativeElement.value;
    this.passwordValid.emit(this.passwordRegex.test(value));
  }
}
