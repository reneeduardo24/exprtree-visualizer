/**
 * Componente principal del área de trabajo (Workspace) donde se desarrollan
 * los dos pasos fundamentales del sistema:
 *
 *  1. Entrada, validación y conversión de una expresión a notación postfix.
 *  2. Simulación paso a paso del parser recursivo y visualización del árbol.
 *
 * Este componente actúa como un contenedor estructural. No ejecuta lógica,
 * sino que organiza y presenta los componentes funcionales centrales:
 * - ExpressionInputComponent
 * - RecursiveParserPanelComponent
 */

import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ExpressionInputComponent } from '../expression-input/expression-input.component';
import { RecursiveParserPanelComponent } from '../recursive-parser-panel/recursive-parser-panel.component';

@Component({
  selector: 'app-workspace',
  standalone: true,
  imports: [
    CommonModule,
    ExpressionInputComponent,
    RecursiveParserPanelComponent,
  ],
  templateUrl: './workspace.component.html',
  styleUrls: ['./workspace.component.scss'],
})
export class WorkspaceComponent {
  /**
   * Este componente no requiere lógica interna.
   * Su propósito principal es estructurar visualmente los pasos del flujo
   * completo: desde la expresión ingresada hasta la construcción del árbol.
   */
}
