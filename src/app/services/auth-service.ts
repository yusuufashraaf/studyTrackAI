import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  isLogin = signal(true);
  route = inject(Router);
  validEmail = false;
  validPassword = false;

  onCheck() {
    if (this.isLogin()) {
      this.route.navigate(['/signup']);
    } else {
      this.route.navigate(['/login']);
    }
    return this.isLogin.set(!this.isLogin());
  }

  onValidEmail(isValid: boolean) {
    this.validEmail = isValid;
  }

  onValidPassword(isValid: boolean) {
    this.validPassword = isValid;
  }
}
