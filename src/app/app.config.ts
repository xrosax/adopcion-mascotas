import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEsBo from '@angular/common/locales/es-BO';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';

// Fechas y números en español de Bolivia (el pipe date mostrará "miércoles, 25 de noviembre de 2026")
registerLocaleData(localeEsBo);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // withComponentInputBinding: permite recibir el :id de la ruta como input() del componente
    provideRouter(routes, withComponentInputBinding()),
    { provide: LOCALE_ID, useValue: 'es-BO' },
  ],
};
