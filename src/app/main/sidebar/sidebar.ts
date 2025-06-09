import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthServices } from '../../firebase/auth.services';  // import your auth service

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css'],  // fix typo here
})
export class Sidebar {
  private router = inject(Router);
  private authService = inject(AuthServices);

  signOut() {
    this.authService.logout()
      .then(() => {
        this.router.navigate(['/login']);
      })
      .catch((error: any) => {
        console.error('Sign out error:', error);
      });
  }
}
