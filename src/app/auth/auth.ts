import { Component, inject } from '@angular/core';
import { Login } from './login/login';
import { Signup } from './signup/signup';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth-service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [Login, Signup, CommonModule],
  templateUrl: './auth.html',
  styleUrl: './auth.css',
})
export class Auth {
isLogin = inject(AuthService)


}
