/**
 * Componente que construye y muestra paso a paso el árbol de expresión
 * a partir de una expresión infija usando un parser recursivo descendente.
 *
 * Genera un arreglo de pasos (BuildStep) que incluye una raíz parcial
 * (currentRoot) para que el visualizador muestre la evolución del árbol.
 */

import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import {
  ExpressionInputModel,
  ExpressionStateService,
} from '../../core/expression-state.service';
import { TreeVisualizerComponent } from '../tree-visualizer/tree-visualizer.component';

type NodeType = 'operator' | 'number' | 'variable' | 'unary';

interface ExpressionNode {
  id: string;
  type: NodeType;
  value: string;
  left?: ExpressionNode;
  right?: ExpressionNode;
  isVirtual?: boolean;
}

interface BuildStep {
  step: number;
  token: string;
  action: string;
  currentRoot?: ExpressionNode;
}

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
  /** Modelo de entrada publicado por el componente de expresiones. */
  expressionModel: ExpressionInputModel | null = null;

  /** Resultado del parser: árbol, pasos y estado. */
  parseResult: ParseResult = { steps: [], isValid: false };

  /** Índice del paso mostrado en la UI. */
  currentStepIndex = 0;

  private sub?: Subscription;

  constructor(private expressionState: ExpressionStateService) {}

  /** Se subscribe al estado de la expresión y dispara el parseo. */
  ngOnInit(): void {
    this.sub = this.expressionState.expression$.subscribe((model) => {
      this.expressionModel = model;

      if (model && model.normalizedExpression && model.normalizedExpression.trim()) {
        this.parseResult = this.parseRecursiveInfix(model.normalizedExpression);
        this.currentStepIndex = 0;
      } else {
        this.parseResult = {
          steps: [],
          isValid: false,
          errorMessage: 'No hay expresión disponible. Ingresa una expresión válida.',
        };
        this.currentStepIndex = 0;
      }
    });
  }

  /** Limpia la suscripción al destruir el componente. */
  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  /* ------------------ Getters ------------------ */

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

  /** Árbol parcial a pasar al visualizador (currentRoot del paso o árbol final). */
  get currentTree(): ExpressionNode | undefined {
    return this.currentStep?.currentRoot ?? this.parseResult.tree;
  }

  /* -------------- Navegación de pasos -------------- */

  goFirst(): void {
    if (!this.totalSteps) return;
    this.currentStepIndex = 0;
  }

  goPrev(): void {
    if (this.currentStepIndex > 0) this.currentStepIndex--;
  }

  goNext(): void {
    if (this.currentStepIndex < this.totalSteps - 1) this.currentStepIndex++;
  }

  goLast(): void {
    if (!this.totalSteps) return;
    this.currentStepIndex = this.totalSteps - 1;
  }

  /* --------------- Parser recursivo --------------- */

  /**
   * Analiza la expresión infija (normalizada) y construye el árbol.
   * Devuelve el árbol final y los pasos de construcción para la UI.
   *
   * Gramática (resumida):
   * Expression := Term (('+'|'-') Term)*
   * Term := Factor (('*'|'/'|'\\') Factor)*
   * Factor := Number | Identifier | '(' Expression ')' | '-' Factor
   */
  private parseRecursiveInfix(expr: string): ParseResult {
    const tokens = this.tokenize(expr);
    let pos = 0;
    const steps: BuildStep[] = [];
    let stepCounter = 1;

    const generateId = () =>
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2, 10);

    const makeStep = (token: string, action: string, currentRoot?: ExpressionNode) => {
      steps.push({
        step: stepCounter++,
        token,
        action,
        currentRoot,
      });
    };

    const peek = () => (pos < tokens.length ? tokens[pos] : null);
    const consume = (expected?: string) => {
      const t = peek();
      if (t === null) return null;
      if (expected && t !== expected) {
        throw new Error(`Se esperaba "${expected}" pero se encontró "${t}".`);
      }
      pos++;
      return t;
    };

    const parseExpression = (): ExpressionNode => {
      let left = parseTerm();
      while (true) {
        const t = peek();
        if (t === '+' || t === '-') {
          const op = consume() as string;
          const right = parseTerm();
          const node: ExpressionNode = {
            id: generateId(),
            type: 'operator',
            value: op,
            left,
            right,
          };
          makeStep(op, `Creado nodo operador "${op}".`, node);
          left = node;
        } else break;
      }
      return left;
    };

    const parseTerm = (): ExpressionNode => {
      let left = parseFactor();
      while (true) {
        const t = peek();
        if (t === '*' || t === '/' || t === '\\') {
          const op = consume() as string;
          const right = parseFactor();
          const node: ExpressionNode = {
            id: generateId(),
            type: 'operator',
            value: op,
            left,
            right,
          };
          makeStep(op, `Creado nodo operador "${op}".`, node);
          left = node;
        } else break;
      }
      return left;
    };

    const parseFactor = (): ExpressionNode => {
      const t = peek();
      if (t === null) throw new Error('Expresión incompleta (se esperaba un factor).');

      // Unario negativo
      if (t === '-') {
        consume('-');
        const right = parseFactor();
        const node: ExpressionNode = {
          id: generateId(),
          type: 'unary',
          value: 'neg',
          right,
        };
        makeStep('NEG', 'Creado nodo unario NEG.', node);
        // Soporta exponentes tras unario: -x^2 => -(x^2)
        if (peek() === '^') {
          const op = consume() as string;
          const rightExp = parseFactor();
          const expNode: ExpressionNode = {
            id: generateId(),
            type: 'operator',
            value: op,
            left: node,
            right: rightExp,
          };
          makeStep(op, `Creado operador "${op}" aplicando exponente a unario.`, expNode);
          return expNode;
        }
        return node;
      }

      // Paréntesis
      if (t === '(') {
        consume('(');
        const node = parseExpression();
        if (peek() !== ')') throw new Error('Paréntesis sin cerrar.');
        consume(')');
        makeStep('()', 'Evaluada subexpresión entre paréntesis.', node);

        if (peek() === '^') {
          const op = consume() as string;
          const rightExp = parseFactor();
          const expNode: ExpressionNode = {
            id: generateId(),
            type: 'operator',
            value: op,
            left: node,
            right: rightExp,
          };
          makeStep(op, `Creado operador "${op}" como exponente de subexpresión.`, expNode);
          return expNode;
        }
        return node;
      }

      // Número
      if (/^[0-9]+$/.test(t)) {
        const tok = consume() as string;
        const node: ExpressionNode = {
          id: generateId(),
          type: 'number',
          value: tok,
        };
        makeStep(tok, `Creado nodo número "${tok}".`, node);

        if (peek() === '^') {
          const op = consume() as string;
          const rightExp = parseFactor();
          const expNode: ExpressionNode = {
            id: generateId(),
            type: 'operator',
            value: op,
            left: node,
            right: rightExp,
          };
          makeStep(op, `Creado operador "^" con base número.`, expNode);
          return expNode;
        }

        return node;
      }

      // Identificador (variable)
      if (/^[a-zA-Z]+$/.test(t)) {
        const tok = consume() as string;
        const node: ExpressionNode = {
          id: generateId(),
          type: 'variable',
          value: tok,
        };
        makeStep(tok, `Creado nodo variable "${tok}".`, node);

        if (peek() === '^') {
          const op = consume() as string;
          const rightExp = parseFactor();
          const expNode: ExpressionNode = {
            id: generateId(),
            type: 'operator',
            value: op,
            left: node,
            right: rightExp,
          };
          makeStep(op, `Creado operador "^" con base variable.`, expNode);
          return expNode;
        }

        return node;
      }

      throw new Error(`Token no válido en factor: "${t}".`);
    };

    try {
      const root = parseExpression();

      if (peek() !== null) {
        throw new Error(`Tokens sobrantes después del parseo: "${peek()}".`);
      }

      makeStep('DONE', 'Árbol completo construido.', root);

      return {
        tree: root,
        steps,
        isValid: true,
      };
    } catch (err) {
      return {
        steps,
        isValid: false,
        errorMessage: err instanceof Error ? err.message : String(err),
      };
    }
  }

  /* --------------- Tokenizador --------------- */

  /**
   * Genera tokens a partir de la cadena normalizada.
   * Acepta: números enteros, identificadores (letras), operadores y paréntesis.
   */
  private tokenize(expr: string): string[] {
    const tokens: string[] = [];
    let i = 0;
    while (i < expr.length) {
      const c = expr[i];

      if ('+-*/\\^()'.includes(c)) {
        tokens.push(c);
        i++;
        continue;
      }

      if (/\d/.test(c)) {
        let j = i;
        while (j < expr.length && /\d/.test(expr[j])) j++;
        tokens.push(expr.slice(i, j));
        i = j;
        continue;
      }

      if (/[a-zA-Z]/.test(c)) {
        let j = i;
        while (j < expr.length && /[a-zA-Z]/.test(expr[j])) j++;
        tokens.push(expr.slice(i, j));
        i = j;
        continue;
      }

      // Carácter inesperado: lo añadimos para que el parser lo reporte como error.
      tokens.push(c);
      i++;
    }
    return tokens;
  }
}
