import {
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Output,
} from '@angular/core';

@Directive({
  selector: 'input[appEmailvalidate]',
})
export class Emailvalidate {
  constructor(private el: ElementRef) {}
  isValid = false;
  @Output() emailValid = new EventEmitter<boolean>();
  private EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@(gmail\.com|icloud\.com)$/;

  @HostListener('input') onInput() {
    const value: string = this.el.nativeElement.value;
    this.emailValid.emit(this.EMAIL_REGEX.test(value));
  }
}
