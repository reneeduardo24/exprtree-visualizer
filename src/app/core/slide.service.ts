import { Injectable } from '@angular/core';

export type SlideType = 'title' | 'team' | 'supervisor' | 'technologies' | 'thankyou';

export interface TeamMember {
  name: string;
}

export interface Supervisor {
  name: string;
  position: string;
}

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
  getSlides(): Slide[] {
    return [
      {
        id: 1,
        title: 'ExprTree Visualizer',
        subtitle: 'Visualización interactiva de árboles de expresión mediante Parser Recursivo',
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
      }
    ];
  }
}
