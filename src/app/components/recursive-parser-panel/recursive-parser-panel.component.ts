/**
 * Componente encargado de simular paso a paso la construcción
 * de un árbol de expresión a partir de una cadena en notación postfix.
 *
 * Este panel constituye el Paso 2 del sistema:
 *  - Recibe el ExpressionInputModel desde ExpressionStateService.
 *  - Construye el árbol aplicando un parser basado en pila.
 *  - Genera y muestra los pasos (BuildStep) del proceso.
 *  - Se integra con D3 a través de TreeVisualizerComponent para mostrar
 *    la evolución visual del árbol conforme avanza la simulación.
 */

import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import {
  ExpressionInputModel,
  ExpressionStateService,
} from '../../core/expression-state.service';
import { TreeVisualizerComponent } from '../tree-visualizer/tree-visualizer.component';

/** Tipos aceptados para un nodo del árbol. */
type NodeType = 'operator' | 'number' | 'variable';

/**
 * Representa un nodo dentro del árbol de expresión.
 * Puede ser operador (con hijos), número o variable.
 */
interface ExpressionNode {
  id: string;
  type: NodeType;
  value: string;
  left?: ExpressionNode;
  right?: ExpressionNode;
}

/**
 * Modelo que describe cada paso del proceso de construcción.
 * Incluye el token leído, la acción realizada y el estado de la pila.
 */
interface BuildStep {
  step: number;
  token: string;
  action: string;
  stackSnapshot: ExpressionNode[];
  currentRoot?: ExpressionNode;
}

/**
 * Resultado final del parser.
 * - `steps`: pasos generados
 * - `tree`: árbol resultante (si es válido)
 * - `errorMessage`: descripción en caso de fallo
 */
interface ParseResult {
  tree?: ExpressionNode;
  steps: BuildStep[];
  isValid: boolean;
  errorMessage?: string;
}

@Component({
  selector: 'app-recursive-parser-panel',
  standalone: true,
  imports: [CommonModule, TreeVisualizerComponent],
  templateUrl: './recursive-parser-panel.component.html',
  styleUrls: ['./recursive-parser-panel.component.scss'],
})
export class RecursiveParserPanelComponent implements OnInit, OnDestroy {
  /** Modelo recibido desde el Paso 1 (entrada del usuario). */
  expressionModel: ExpressionInputModel | null = null;

  /** Resultado completo del parseo (árbol + pasos). */
  parseResult: ParseResult = {
    steps: [],
    isValid: false,
  };

  /** Índice del paso actual mostrado en UI. */
  currentStepIndex = 0;

  /** Suscripción a ExpressionStateService. */
  private sub?: Subscription;

  constructor(private expressionState: ExpressionStateService) {}

  /**
   * Suscripción a los cambios de expresión.
   * Cada vez que el usuario envía una nueva expresión en el Paso 1:
   *  - Se reconstruye el árbol,
   *  - Se reinicia la navegación de pasos.
   */
  ngOnInit(): void {
    this.sub = this.expressionState.expression$.subscribe((model) => {
      this.expressionModel = model;

      if (model && model.postfix.trim()) {
        this.parseResult = this.buildTreeFromPostfix(model.postfix);
        this.currentStepIndex = 0;
      } else {
        this.parseResult = {
          steps: [],
          isValid: false,
          errorMessage:
            'No hay expresión disponible. Ingresa una expresión válida en el Paso 1.',
        };
        this.currentStepIndex = 0;
      }
    });
  }

  /** Limpia suscripción para evitar fugas de memoria. */
  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  // ---------------- GETTERS DE RESUMEN ----------------

  /** Expresión original ingresada por el usuario. */
  get expression(): string {
    return this.expressionModel?.rawExpression ?? '';
  }

  /** Expresión normalizada (sin espacios). */
  get normalizedExpression(): string {
    return this.expressionModel?.normalizedExpression ?? '';
  }

  /** Postfix generado en el Paso 1. */
  get postfix(): string {
    return this.expressionModel?.postfix ?? '';
  }

  /** Paso actualmente mostrado. */
  get currentStep(): BuildStep | undefined {
    if (!this.parseResult.steps.length) return undefined;
    return this.parseResult.steps[this.currentStepIndex];
  }

  /** Número total de pasos generados. */
  get totalSteps(): number {
    return this.parseResult.steps.length;
  }

  /**
   * Árbol parcial correspondiente al paso actual.
   * Se obtiene a partir de la pila (stackSnapshot).
   * 
   * - Si la pila tiene 1 elemento → árbol válido.
   * - Si tiene varios → se crea una raíz virtual para visualización D3.
   */
  get currentTree(): any {
    const step = this.currentStep;
    if (!step) return this.parseResult.tree;

    const snapshot = step.stackSnapshot;

    if (!snapshot || snapshot.length === 0) return undefined;

    if (snapshot.length === 1) return snapshot[0];

    // Permite mostrar "múltiples raíces" durante la evolución del árbol.
    return {
      id: 'virtual-root',
      type: 'operator',
      value: '',
      isVirtual: true,
      children: snapshot,
    };
  }

  // ---------------- NAVEGACIÓN ENTRE PASOS ----------------

  /** Ir al primer paso. */
  goFirst(): void {
    if (!this.totalSteps) return;
    this.currentStepIndex = 0;
  }

  /** Ir al paso anterior. */
  goPrev(): void {
    if (this.currentStepIndex > 0) this.currentStepIndex--;
  }

  /** Ir al siguiente paso. */
  goNext(): void {
    if (this.currentStepIndex < this.totalSteps - 1) {
      this.currentStepIndex++;
    }
  }

  /** Ir al último paso. */
  goLast(): void {
    if (!this.totalSteps) return;
    this.currentStepIndex = this.totalSteps - 1;
  }

  // ---------------- PARSER POSTFIX → ÁRBOL ----------------

  /**
   * Construye un árbol de expresión a partir de una cadena postfix.
   * Implementa un algoritmo clásico basado en pila:
   *
   * 1. Si llega un operando → se apila un nodo hoja.
   * 2. Si llega un operador → se desapilan 2 nodos y se crea un nodo operador.
   * 3. Se guarda un BuildStep por cada token procesado.
   * 
   * @param postfix Cadena en notación postfix (tokens separados por espacios).
   * @returns ParseResult con el árbol y los pasos generados.
   */
  private buildTreeFromPostfix(postfix: string): ParseResult {
    const tokens = postfix.split(/\s+/).filter(Boolean);
    const stack: ExpressionNode[] = [];
    const steps: BuildStep[] = [];

    const isOperator = (t: string) =>
      ['+', '-', '*', '/', '\\', '^'].includes(t);

    const isOperand = (t: string) => /^[a-zA-Z0-9]+$/.test(t);

    const generateId = () =>
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2, 10);

    let stepCounter = 1;

    try {
      for (const token of tokens) {
        let action: string;

        // ----- Operando -----
        if (isOperand(token)) {
          const type: NodeType = /^[0-9]+$/.test(token)
            ? 'number'
            : 'variable';

          const node: ExpressionNode = {
            id: generateId(),
            type,
            value: token,
          };

          stack.push(node);
          action = `Token "${token}": operando, se apila como nodo hoja.`;
        }

        // ----- Operador -----
        else if (isOperator(token)) {
          if (stack.length < 2) {
            throw new Error(
              `Faltan operandos para aplicar el operador "${token}".`
            );
          }

          const right = stack.pop()!;
          const left = stack.pop()!;

          const node: ExpressionNode = {
            id: generateId(),
            type: 'operator',
            value: token,
            left,
            right,
          };

          stack.push(node);
          action = `Token "${token}": operador, se desapilan 2 nodos y se crea un nodo operador.`;
        }

        // ----- Token inválido -----
        else {
          throw new Error(`Token no reconocido: "${token}".`);
        }

        // Guardar snapshot del paso actual
        const snapshot = [...stack];

        steps.push({
          step: stepCounter++,
          token,
          action,
          stackSnapshot: snapshot,
          currentRoot: stack[stack.length - 1],
        });
      }

      // La pila debe tener exactamente 1 nodo al finalizar
      if (stack.length !== 1) {
        throw new Error(
          `La pila final no tiene exactamente un nodo. Tamaño actual: ${stack.length}.`
        );
      }

      return {
        tree: stack[0],
        steps,
        isValid: true,
      };
    } catch (error) {
      return {
        steps,
        isValid: false,
        errorMessage:
          error instanceof Error
            ? error.message
            : 'Error desconocido durante la construcción del árbol.',
      };
    }
  }
}
