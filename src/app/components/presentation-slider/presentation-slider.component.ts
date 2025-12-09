/**
 * Componente encargado de mostrar un carrusel inicial de presentación
 * utilizando Web Components de Swiper. 
 *
 * Las diapositivas incluyen:
 *  - Título del proyecto
 *  - Integrantes del equipo
 *  - Información del docente
 *  - Tecnologías utilizadas
 *
 * Además, expone un evento para que el usuario pueda desplazarse
 * automáticamente hacia la sección de trabajo principal (workspace).
 */

import { CommonModule } from '@angular/common';
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  EventEmitter,
  Output,
} from '@angular/core';
import { Slide, SlideService } from '../../core/slide.service';

@Component({
  selector: 'app-presentation-slider',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './presentation-slider.component.html',
  styleUrls: ['./presentation-slider.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class PresentationSliderComponent {
  /**
   * Arreglo de diapositivas cargadas desde SlideService.
   * Cada diapositiva contiene su tipo, título y datos asociados.
   */
  slides: Slide[] = [];

  /**
   * Evento que se emite cuando el usuario presiona el botón
   * para desplazarse hacia la zona de trabajo (workspace).
   */
  @Output() requestScrollToWorkspace = new EventEmitter<void>();

  /**
   * Constructor que inyecta el servicio de diapositivas y
   * carga inmediatamente la información para el carrusel.
   *
   * @param slideService Servicio que provee los datos de presentación.
   */
  constructor(private slideService: SlideService) {
    this.slides = this.slideService.getSlides();
  }

  /**
   * Dispara el evento `requestScrollToWorkspace` hacia el componente padre.
   * El padre es responsable de manejar el scroll real.
   */
  triggerScrollToWorkspace(): void {
    this.requestScrollToWorkspace.emit();
  }
}
