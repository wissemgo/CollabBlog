import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/environment';

let isRefreshing = false;
const refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> => {
  const authService = inject(AuthService);
  const authReq = addAuthHeader(req, authService);

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !authReq.url.includes('/auth/login') && !authReq.url.includes('/auth/register')) {
        return handle401Error(authReq, next, authService);
      }
      return throwError(() => error);
    })
  );
};

const addAuthHeader = (request: HttpRequest<any>, authService: AuthService): HttpRequest<any> => {
  const token = authService.getToken();
  if (token && isApiUrl(request.url)) {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
  return request;
};

const handle401Error = (request: HttpRequest<any>, next: HttpHandlerFn, authService: AuthService): Observable<HttpEvent<any>> => {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    return authService.refreshToken().pipe(
      switchMap((authResponse: any) => {
        isRefreshing = false;
        refreshTokenSubject.next(authResponse.token);
        return next(addAuthHeader(request, authService));
      }),
      catchError((error) => {
        isRefreshing = false;
        authService.logout().subscribe();
        return throwError(() => error);
      })
    );
  } else {
    return refreshTokenSubject.pipe(
      filter(token => token != null),
      take(1),
      switchMap(() => next(addAuthHeader(request, authService)))
    );
  }
};

const isApiUrl = (url: string): boolean => {
  return url.includes('/api/') || url.startsWith(environment.apiUrl);
};

export const errorInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An unknown error occurred';

      if (error.error instanceof ErrorEvent) {
        errorMessage = error.error.message;
      } else {
        if (error.error && error.error.message) {
          errorMessage = error.error.message;
        } else if (error.message) {
          errorMessage = error.message;
        } else {
          switch (error.status) {
            case 400:
              errorMessage = 'Bad request';
              break;
            case 401:
              errorMessage = 'Unauthorized access';
              break;
            case 403:
              errorMessage = 'Access forbidden';
              break;
            case 404:
              errorMessage = 'Resource not found';
              break;
            case 500:
              errorMessage = 'Internal server error';
              break;
            default:
              errorMessage = `Error ${error.status}: ${error.statusText}`;
          }
        }
      }

      // console.error('HTTP Error:', error); // Temporarily disable for cleaner console
      return throwError(() => errorMessage);
    })
  );
};