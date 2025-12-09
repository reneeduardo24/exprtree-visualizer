/**
 * Punto de entrada principal de la aplicación Angular.
 * Este archivo se encarga de inicializar la aplicación,
 * registrar dependencias globales y arrancar el componente raíz.
 */

import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';

// Registro global de componentes Web de Swiper
// Se usa para habilitar sliders/carousels dentro de Angular.
import { register } from 'swiper/element/bundle';
register();

/**
 * Inicializa la aplicación Angular utilizando el componente raíz AppComponent.
 * También se registran los proveedores necesarios, como el sistema de rutas.
 */
bootstrapApplication(AppComponent, {
  providers: [
    // Proveedor del enrutador que usa las rutas definidas en app.routes.ts
    provideRouter(routes),
  ],
})
  .catch((err) => console.error('Error al iniciar la aplicación:', err));
