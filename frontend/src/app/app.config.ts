<<<<<<< HEAD
import { ApplicationConfig, isDevMode } from '@angular/core';
=======
import { ApplicationConfig } from '@angular/core';
>>>>>>> nasreen_repo/main
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { routes } from './app.routes';
<<<<<<< HEAD
import { provideServiceWorker } from '@angular/service-worker';
=======
>>>>>>> nasreen_repo/main

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
<<<<<<< HEAD
    provideHttpClient(), provideServiceWorker('ngsw-worker.js', {
            enabled: !isDevMode(),
            registrationStrategy: 'registerWhenStable:30000'
          })
=======
    provideHttpClient()
>>>>>>> nasreen_repo/main
  ]
};
