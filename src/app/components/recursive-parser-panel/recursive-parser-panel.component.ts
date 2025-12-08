import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ExpressionInputModel, ExpressionStateService } from '../../core/expression-state.service';

type NodeType = 'operator' | 'number' | 'variable';

interface ExpressionNode {
  id: string;
  type: NodeType;
  value: string;
  left?: ExpressionNode;
  right?: ExpressionNode;
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
}

@Component({
  selector: 'app-recursive-parser-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recursive-parser-panel.component.html',
  styleUrls: ['./recursive-parser-panel.component.scss'],
})
export class RecursiveParserPanelComponent implements OnInit, OnDestroy {
  expressionModel: ExpressionInputModel | null = null;

  parseResult: ParseResult = {
    steps: [],
    isValid: false,
  };

  currentStepIndex = 0;

  private sub?: Subscription;

  constructor(private expressionState: ExpressionStateService) {}

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
          errorMessage: 'No hay expresión disponible. Ingresa una expresión válida en el Paso 1.',
        };
        this.currentStepIndex = 0;
      }
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

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

  // ================= NAVEGACIÓN DE PASOS =================

  goFirst(): void {
    if (!this.totalSteps) return;
    this.currentStepIndex = 0;
  }

  goPrev(): void {
    if (this.currentStepIndex > 0) {
      this.currentStepIndex--;
    }
  }

  goNext(): void {
    if (this.currentStepIndex < this.totalSteps - 1) {
      this.currentStepIndex++;
    }
  }

  goLast(): void {
    if (!this.totalSteps) return;
    this.currentStepIndex = this.totalSteps - 1;
  }

  // ================= LÓGICA DEL PARSER (postfix → árbol + pasos) =================

  private buildTreeFromPostfix(postfix: string): ParseResult {
    const tokens = postfix.split(/\s+/).filter(Boolean);
    const stack: ExpressionNode[] = [];
    const steps: BuildStep[] = [];

    const isOperator = (token: string): boolean =>
      ['+', '-', '*', '/', '\\', '^'].includes(token);

    const isOperand = (token: string): boolean =>
      /^[a-zA-Z0-9]+$/.test(token);

    const generateId = (): string => {
      if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return crypto.randomUUID();
      }
      return Math.random().toString(36).substring(2, 10);
    };

    let stepCounter = 1;

    try {
      for (const token of tokens) {
        let action: string;

        if (isOperand(token)) {
          const type: NodeType = /^[0-9]+$/.test(token) ? 'number' : 'variable';
          const node: ExpressionNode = {
            id: generateId(),
            type,
            value: token,
          };
          stack.push(node);
          action = `Token "${token}": operando, se apila como nodo hoja.`;
        } else if (isOperator(token)) {
          if (stack.length < 2) {
            throw new Error(
              `No hay suficientes operandos en la pila para el operador "${token}".`
            );
          }
          const right = stack.pop() as ExpressionNode;
          const left = stack.pop() as ExpressionNode;

          const node: ExpressionNode = {
            id: generateId(),
            type: 'operator',
            value: token,
            left,
            right,
          };

          stack.push(node);
          action = `Token "${token}": operador, se desapilan 2 nodos y se crea un nodo operador.`;
        } else {
          throw new Error(`Token no reconocido en postfix: "${token}".`);
        }

        const stackSnapshot = [...stack];

        steps.push({
          step: stepCounter++,
          token,
          action,
          stackSnapshot,
          currentRoot: stack[stack.length - 1],
        });
      }

      if (stack.length !== 1) {
        throw new Error(
          `La pila final no tiene exactamente un elemento. Tamaño actual: ${stack.length}.`
        );
      }

      const finalTree = stack[0];

      return {
        tree: finalTree,
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
            : 'Error desconocido al construir el árbol.',
      };
    }
  }

  // ================= RENDER ASCII TREE =================

  renderAsciiTree(node: ExpressionNode | undefined): string {
    return this.renderAsciiNode(node, '', null);
  }

  private renderAsciiNode(
    node: ExpressionNode | undefined,
    prefix: string,
    isLeft: boolean | null
  ): string {
    if (!node) {
      return 'No hay árbol disponible';
    }

    let result = '';

    if (prefix === '') {
      result += node.value + '\n';
    } else {
      result += prefix + (isLeft === null ? '' : isLeft ? '├─ ' : '└─ ') + node.value + '\n';
    }

    const children: ExpressionNode[] = [];
    if (node.left) children.push(node.left);
    if (node.right) children.push(node.right);

    children.forEach((child, index) => {
      const isLastChild = index === children.length - 1;
      const newPrefix = prefix + (isLeft === null ? '' : isLeft ? '│  ' : '   ');
      result += this.renderAsciiNode(child, newPrefix, !isLastChild);
    });

    return result;
  }
}
