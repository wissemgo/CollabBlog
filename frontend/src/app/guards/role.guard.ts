import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    const requiredRoles = route.data['roles'] as UserRole[];
    
    return this.authService.currentUser$.pipe(
      map(user => {
        if (!user) {
          this.router.navigate(['/auth/login']);
          return false;
        }

        if (!requiredRoles || requiredRoles.length === 0) {
          return true;
        }

        const hasRequiredRole = requiredRoles.some(role => 
          this.authService.hasRole(role)
        );

        if (!hasRequiredRole) {
          this.router.navigate(['/dashboard']);
          return false;
        }

        return true;
      })
    );
  }
}