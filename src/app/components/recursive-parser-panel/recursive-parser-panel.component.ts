/**
 * Componente encargado de simular paso a paso la construcción
 * de un árbol de expresión usando un **parser recursivo descendente**
 * que además mantiene internamente una pila virtual para poder generar
 * los mismos "stack snapshots" que producía el parser postfix.
 */

import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
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
  stackSnapshot: ExpressionNode[];
  currentRoot?: ExpressionNode;
}

interface ParseResult {
  tree?: ExpressionNode;
  steps: BuildStep[];
  isValid: boolean;
  errorMessage?: string;
  postfix?: string;
}

@Component({
  selector: 'app-recursive-parser-panel',
  standalone: true,
  imports: [CommonModule, TreeVisualizerComponent],
  templateUrl: './recursive-parser-panel.component.html',
  styleUrls: ['./recursive-parser-panel.component.scss'],
})
export class RecursiveParserPanelComponent implements OnInit, OnDestroy {
  expressionModel: ExpressionInputModel | null = null;
  parseResult: ParseResult = { steps: [], isValid: false };
  currentStepIndex = 0;

  private sub?: Subscription;

  constructor(
    private expressionState: ExpressionStateService,
    private cd: ChangeDetectorRef
  ) {}

  // ------------------------------------------------------------
  // CICLO DE VIDA
  // ------------------------------------------------------------
  ngOnInit(): void {
    this.sub = this.expressionState.expression$.subscribe((model) => {
      this.expressionModel = model;

      const expr = model?.normalizedExpression?.trim() ?? '';

      if (expr.length > 0) {
        const result = this.parseRecursiveInfix(expr);
        this.parseResult = result;

        // NO actualizamos el estado global desde el parser para evitar bucles
        // (la fuente de verdad del estado se establece únicamente en el Paso 1).

        this.cd.detectChanges();
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

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  // ------------------------------------------------------------
  // GETTERS PARA UI
  // ------------------------------------------------------------
  get expression(): string {
    return this.expressionModel?.rawExpression ?? '';
  }

  get normalizedExpression(): string {
    return this.expressionModel?.normalizedExpression ?? '';
  }

  /** Priorizamos el postfix calculado por el parser (parseResult) */
  get postfix(): string {
    return this.parseResult.postfix ?? this.expressionModel?.postfix ?? '';
  }

  get currentStep(): BuildStep | undefined {
    if (!this.parseResult.steps.length) return undefined;
    return this.parseResult.steps[this.currentStepIndex];
  }

  get totalSteps(): number {
    return this.parseResult.steps.length;
  }

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

  // ------------------------------------------------------------
  // NAVEGACIÓN
  // ------------------------------------------------------------
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

  // ------------------------------------------------------------
  // TOKENIZADOR
  // ------------------------------------------------------------
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

      tokens.push(c);
      i++;
    }

    return tokens;
  }

  // ------------------------------------------------------------
  // PARSER RECURSIVO + PILA VIRTUAL
  // ------------------------------------------------------------
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

    // ------------------ GRAMÁTICA ------------------
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

    // ------------------ EJECUCIÓN ------------------
    try {
      const root = parseExpression();

      if (peek() !== null) {
        throw new Error(
          `Tokens sobrantes después del parseo: "${peek()}".`
        );
      }

      if (virtualStack.length !== 1) {
        return {
          steps,
          isValid: false,
          errorMessage: `La pila final no tiene un único nodo (size=${virtualStack.length}).`,
        };
      }

      makeStep('DONE', 'Construcción finalizada (árbol completo).');

      const finalRoot = virtualStack[0];
      const postfixStr = this.astToPostfix(finalRoot);

      return { tree: finalRoot, steps, isValid: true, postfix: postfixStr };
    } catch (err) {
      return {
        steps,
        isValid: false,
        errorMessage:
          err instanceof Error ? err.message : String(err),
      };
    }
  }

  // ------------------------------------------------------------
  // AST → POSTFIX
  // ------------------------------------------------------------
  private astToPostfix(root: ExpressionNode | undefined | null): string {
    if (!root) return '';
    const out: string[] = [];

    const visit = (n?: ExpressionNode | null) => {
      if (!n) return;

      if (n.type === 'operator') {
        visit(n.left ?? null);
        visit(n.right ?? null);
        out.push(n.value);
        return;
      }

      if (n.type === 'unary') {
        visit(n.right ?? null);
        out.push(n.value);
        return;
      }

      if (n.type === 'number' || n.type === 'variable') {
        out.push(n.value);
        return;
      }

      visit(n.left ?? null);
      visit(n.right ?? null);
    };

    visit(root);
    return out.join(' ');
  }
}
