import { Component, inject } from '@angular/core';
import { AuthService } from '../../services/auth-service';
import { FormsModule } from '@angular/forms';
import { AuthServices } from '../../firebase/auth.services';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  public isLogin = inject(AuthService);

  email = '';
  password = '';
  errorMessage = '';

  constructor(private authService: AuthServices) {}

  async login(Data: { email: string; password: string }) {
    try {
      const userCredential = await this.authService.login(
        Data.email,
        Data.password
      );
      console.log('User logged in:', userCredential.user);
      // Redirect or update UI here after successful login
    } catch (error: any) {
      switch (error.code) {
        case 'auth/wrong-password':
          this.errorMessage = 'The password is incorrect.';
          break;
        case 'auth/user-not-found':
          this.errorMessage = 'No user found with this email.';
          break;
        case 'auth/invalid-email':
          this.errorMessage = 'Write correct email.';
          break;
        default:
          // Fallback message for all other errors including "invalid-credential"
          this.errorMessage = 'Invalid email or password.';
          break;
      }
    }
  }
}
