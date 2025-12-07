import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';

// Swiper Element
import { register as registerSwiperElements } from 'swiper/element/bundle';

// Registrar los custom elements ANTES de bootstrapping
registerSwiperElements();

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
  ],
}).catch((err) => console.error(err));
