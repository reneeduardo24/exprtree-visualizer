/**
 * Servicio encargado de proporcionar la información necesaria
 * para las diapositivas mostradas en el componente de presentación.
 * 
 * Incluye datos del título, integrantes del equipo, docente y
 * tecnologías utilizadas.
 */

import { Injectable } from '@angular/core';

/** Tipos permitidos para clasificar visualmente cada diapositiva. */
export type SlideType =
  | 'title'
  | 'team'
  | 'supervisor'
  | 'technologies'
  | 'thankyou';

/** Modelo para representar un miembro del equipo en una diapositiva. */
export interface TeamMember {
  name: string;
}

/** Datos del supervisor/docente mostrado en la presentación. */
export interface Supervisor {
  name: string;
  position: string;
}

/**
 * Modelo general de una diapositiva.
 * Dependiendo del tipo, la diapositiva puede contener:
 * - subtítulo,
 * - listado de integrantes,
 * - información del supervisor,
 * - listado de tecnologías.
 */
export interface Slide {
  id: number;
  title: string;
  type: SlideType;
  subtitle?: string;
  members?: TeamMember[];
  supervisor?: Supervisor;
  technologies?: string[];
}

@Injectable({
  providedIn: 'root',
})
export class SlideService {
  /**
   * Devuelve la colección de diapositivas que son consumidas
   * por el componente de presentación inicial.
   *
   * @returns Arreglo de objetos Slide con su información correspondiente.
   */
  getSlides(): Slide[] {
    return [
      {
        id: 1,
        title: 'ExprTree Visualizer',
        subtitle:
          'Visualización interactiva de árboles de expresión mediante Parser Recursivo',
        type: 'title',
      },
      {
        id: 2,
        title: 'Integrantes del equipo',
        type: 'team',
        members: [
          { name: 'Eduardo Chavez' },
          { name: 'Jesus Enrique Felix' },
          { name: 'Raul Ortega' },
          { name: 'Rene Hernandez' },
        ],
      },
      {
        id: 3,
        title: 'Docente',
        type: 'supervisor',
        supervisor: {
          name: 'Dr. Gilberto Borrego Soto',
          position: 'Docente',
        },
      },
      {
        id: 4,
        title: 'Tecnologías utilizadas',
        type: 'technologies',
        technologies: ['Angular', 'TypeScript', 'SCSS', 'D3.js', 'SVG'],
      },
    ];
  }
}
