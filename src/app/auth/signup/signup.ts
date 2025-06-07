import { Component, EventEmitter, inject, Output } from '@angular/core';
import { AuthService } from '../../services/auth-service';
import { Passwordvalidate } from '../directive/passwordvalidate';
import { Emailvalidate } from '../directive/emailvalidate';
import { AuthServices } from '../../firebase/auth.services';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-signup',
  standalone: true,

  imports: [Emailvalidate, Passwordvalidate, FormsModule],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
})
export class Signup {
  isSignUp = inject(AuthService);
  signUp = inject(AuthServices);
  navigate = inject(Router);
  emailExist = false;

  async checkSignUpData(
    event: Event,
    Data: { email: string; password: string; fullName: string }
  ) {
    const emailFound = await this.signUp.isEmailExists(Data.email);
    if (this.isSignUp.validEmail && this.isSignUp.validPassword) {
      if (emailFound) {
        this.emailExist = true;
        event.preventDefault();
      } else {
        await this.signUp.signUp(Data.email, Data.password, Data.fullName);
        this.navigate.navigate(['/login']);
      }
    }
  }
}
