/**
 * Componente encargado de simular paso a paso la construcción
 * de un árbol de expresión usando un **parser recursivo descendente**
 * que además mantiene internamente una pila virtual para poder generar
 * los mismos "stack snapshots" que producía el parser postfix.
 *
 * Esto permite:
 *  - Mostrar la evolución del árbol en el visualizador D3 sin modificarlo.
 *  - Mantener el comportamiento educativo paso-a-paso.
 *  - Conservar la semántica y ventaja del parser recursivo.
 *
 * Flujo general:
 *   1. El usuario envía una expresión válida desde el Paso 1.
 *   2. El componente recibe la expresión normalizada.
 *   3. Se ejecuta el parser recursivo:
 *        - Aplica la gramática clásica (Expression → Term → Factor).
 *        - Maneja operadores binarios, unarios y exponentes.
 *        - Emite pasos BuildStep con snapshots de la pila virtual.
 *   4. `currentTree` transforma los snapshots en un árbol o en una raíz virtual
 *      que el TreeVisualizer puede dibujar incrementalmente.
 *
 * Este componente NO construye el árbol gráfico; solo prepara los datos
 * para que TreeVisualizer los renderice paso a paso.
 */

import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import {
  ExpressionInputModel,
  ExpressionStateService,
} from '../../core/expression-state.service';
import { TreeVisualizerComponent } from '../tree-visualizer/tree-visualizer.component';

/** Tipos válidos para un nodo del árbol de expresión. */
type NodeType = 'operator' | 'number' | 'variable' | 'unary';

/**
 * Representa un nodo del árbol sintáctico.
 * Puede ser hoja (número/variable), operador binario o unario.
 */
interface ExpressionNode {
  id: string;
  type: NodeType;
  value: string;
  left?: ExpressionNode;
  right?: ExpressionNode;
  isVirtual?: boolean; // usado para raíces virtuales en la UI
}

/**
 * Representa un paso del proceso de construcción,
 * incluyendo el snapshot de la pila virtual.
 */
interface BuildStep {
  step: number;
  token: string;
  action: string;
  stackSnapshot: ExpressionNode[];
  currentRoot?: ExpressionNode;
}

/** Resultado completo del parser recursivo. */
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
  /** Expresión recibida desde el Paso 1. */
  expressionModel: ExpressionInputModel | null = null;

  /** Resultado (árbol + pasos). */
  parseResult: ParseResult = { steps: [], isValid: false };

  /** Índice del paso que se está mostrando. */
  currentStepIndex = 0;

  private sub?: Subscription;

  constructor(private expressionState: ExpressionStateService) {}

  // ============================================================================
  // Ciclo de vida
  // ============================================================================

  /**
   * Se suscribe al estado global:
   * cada vez que el usuario envía una expresión,
   * se reconstruye el árbol y se reinician los pasos.
   */
  ngOnInit(): void {
    this.sub = this.expressionState.expression$.subscribe((model) => {
      this.expressionModel = model;

      const expr = model?.normalizedExpression?.trim() ?? '';

      if (expr.length > 0) {
        this.parseResult = this.parseRecursiveInfix(expr);
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

  /** Evita fugas de memoria. */
  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  // ============================================================================
  // Accesores para UI
  // ============================================================================

  get expression(): string {
    return this.expressionModel?.rawExpression ?? '';
  }

  get normalizedExpression(): string {
    return this.expressionModel?.normalizedExpression ?? '';
  }

  get postfix(): string {
    return this.expressionModel?.postfix ?? '';
  }

  get currentStep(): BuildStep | undefined {
    if (!this.parseResult.steps.length) return undefined;
    return this.parseResult.steps[this.currentStepIndex];
  }

  get totalSteps(): number {
    return this.parseResult.steps.length;
  }

  /**
   * Obtiene el árbol parcial para el paso actual.
   * Cuando la pila virtual tiene múltiples elementos,
   * se crea una raíz virtual con children[] para que D3 pueda visualizarlo.
   */
  get currentTree(): any {
    const step = this.currentStep;
    if (!step) return this.parseResult.tree;

    const snapshot = step.stackSnapshot;
    if (!snapshot || snapshot.length === 0) return undefined;

    if (snapshot.length === 1) return snapshot[0];

    return {
      id: 'virtual-root',
      type: 'operator',
      value: '',
      isVirtual: true,
      children: snapshot,
    };
  }

  // ============================================================================
  // Navegación
  // ============================================================================
  goFirst(): void {
    if (this.totalSteps) this.currentStepIndex = 0;
  }
  goPrev(): void {
    if (this.currentStepIndex > 0) this.currentStepIndex--;
  }
  goNext(): void {
    if (this.currentStepIndex < this.totalSteps - 1) this.currentStepIndex++;
  }
  goLast(): void {
    if (this.totalSteps) this.currentStepIndex = this.totalSteps - 1;
  }

  // ============================================================================
  // Tokenizador simple
  // ============================================================================

  /**
   * Convierte la expresión en un arreglo de tokens.
   * No separa tipos; solo devuelve strings.
   */
  private tokenize(expr: string): string[] {
    const tokens: string[] = [];
    let i = 0;

    while (i < expr.length) {
      const c = expr[i];

      // operadores y paréntesis
      if ('+-*/\\^()'.includes(c)) {
        tokens.push(c);
        i++;
        continue;
      }

      // números
      if (/\d/.test(c)) {
        let j = i;
        while (j < expr.length && /\d/.test(expr[j])) j++;
        tokens.push(expr.slice(i, j));
        i = j;
        continue;
      }

      // variables
      if (/[a-zA-Z]/.test(c)) {
        let j = i;
        while (j < expr.length && /[a-zA-Z]/.test(expr[j])) j++;
        tokens.push(expr.slice(i, j));
        i = j;
        continue;
      }

      // carácter inesperado
      tokens.push(c);
      i++;
    }

    return tokens;
  }

  // ============================================================================
  // Parser recursivo descendente + pila virtual (stackSnapshot)
  // ============================================================================

  /**
   * Construye un árbol usando un parser recursivo descendente,
   * pero simulando internamente una **pila virtual** para emitir
   * los mismos BuildStep que el parser postfix original.
   */
  private parseRecursiveInfix(expr: string): ParseResult {
    const tokens = this.tokenize(expr);
    let pos = 0;

    const steps: BuildStep[] = [];
    const virtualStack: ExpressionNode[] = [];

    let stepCounter = 1;

    const peek = () => (pos < tokens.length ? tokens[pos] : null);
    const consume = (expected?: string) => {
      const t = peek();
      if (!t) return null;
      if (expected && t !== expected)
        throw new Error(`Se esperaba "${expected}" pero se encontró "${t}".`);
      pos++;
      return t;
    };

    const makeStep = (token: string, action: string) => {
      steps.push({
        step: stepCounter++,
        token,
        action,
        stackSnapshot: [...virtualStack],
        currentRoot:
          virtualStack.length > 0
            ? virtualStack[virtualStack.length - 1]
            : undefined,
      });
    };

    const pushLeaf = (value: string, type: NodeType) => {
      const node: ExpressionNode = {
        id: `${type}-${value}-${pos - 1}`,
        type,
        value,
      };
      virtualStack.push(node);
      makeStep(value, `Token "${value}": operando, se apila como hoja.`);
      return node;
    };

    const combineOperator = (
      op: string,
      leftNode: ExpressionNode,
      rightNode: ExpressionNode
    ) => {
      // Toma preferentemente nodos reales de la pila
      const right = virtualStack.pop() ?? rightNode;
      const left = virtualStack.pop() ?? leftNode;

      if (!left || !right)
        throw new Error(`Faltan operandos para el operador "${op}".`);

      const node: ExpressionNode = {
        id: `${op}:${left.id}:${right.id}`,
        type: 'operator',
        value: op,
        left,
        right,
      };

      virtualStack.push(node);
      makeStep(op, `Token "${op}": operador, se combinan dos nodos.`);
      return node;
    };

    // =============================== GRAMÁTICA ===============================
    const parseExpression = (): ExpressionNode => {
      let left = parseTerm();
      while (peek() === '+' || peek() === '-') {
        const op = consume()!;
        const right = parseTerm();
        left = combineOperator(op, left, right);
      }
      return left;
    };

    const parseTerm = (): ExpressionNode => {
      let left = parseFactor();
      while (peek() === '*' || peek() === '/' || peek() === '\\') {
        const op = consume()!;
        const right = parseFactor();
        left = combineOperator(op, left, right);
      }
      return left;
    };

    const parseFactor = (): ExpressionNode => {
      const t = peek();
      if (!t) throw new Error('Expresión incompleta (factor faltante).');

      // Unario negativo
      if (t === '-') {
        consume('-');
        const right = parseFactor();
        const node: ExpressionNode = {
          id: `neg-${right.id}`,
          type: 'unary',
          value: 'neg',
          right,
        };
        virtualStack.push(node);
        makeStep('NEG', `Token "-": creación de nodo unario NEG.`);

        if (peek() === '^') {
          consume('^');
          const expR = parseFactor();
          return combineOperator('^', node, expR);
        }

        return node;
      }

      // Paréntesis
      if (t === '(') {
        consume('(');
        const node = parseExpression();
        if (peek() !== ')') throw new Error('Paréntesis no cerrado.');
        consume(')');
        makeStep('()', 'Token "()": subexpresión evaluada.');

        if (peek() === '^') {
          consume('^');
          const expR = parseFactor();
          return combineOperator('^', node, expR);
        }
        return node;
      }

      // Número
      if (/^[0-9]+$/.test(t)) {
        const tok = consume()!;
        const leaf = pushLeaf(tok, 'number');

        if (peek() === '^') {
          consume('^');
          const expR = parseFactor();
          return combineOperator('^', leaf, expR);
        }
        return leaf;
      }

      // Variable
      if (/^[a-zA-Z]+$/.test(t)) {
        const tok = consume()!;
        const leaf = pushLeaf(tok, 'variable');

        if (peek() === '^') {
          consume('^');
          const expR = parseFactor();
          return combineOperator('^', leaf, expR);
        }
        return leaf;
      }

      throw new Error(`Token inválido: "${t}".`);
    };

    // =============================== EJECUCIÓN ===============================
    try {
      const root = parseExpression();

      if (peek() !== null) {
        throw new Error(`Tokens sobrantes después del parseo: "${peek()}".`);
      }

      if (virtualStack.length !== 1) {
        return {
          steps,
          isValid: false,
          errorMessage: `La pila final no tiene un único nodo (size=${virtualStack.length}).`,
        };
      }

      makeStep('DONE', 'Construcción finalizada (árbol completo).');

      return { tree: virtualStack[0], steps, isValid: true };
    } catch (err) {
      return {
        steps,
        isValid: false,
        errorMessage: err instanceof Error ? err.message : String(err),
      };
    }
  }
}
