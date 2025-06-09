import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthServices } from '../firebase/auth.services';

export const authguardGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthServices);
  const router = inject(Router);

  const user = await authService.getCurrentUserAsync();

  if (user) {
    return true;
  } else {
    router.navigate(['/login']);
    return false;
  }
};
