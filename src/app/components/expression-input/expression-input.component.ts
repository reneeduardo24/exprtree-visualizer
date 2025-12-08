import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  ExpressionInputModel,
  ExpressionStateService,
} from '../../core/expression-state.service';

type OutputNotation = 'postfix';

const ALLOWED_OPERATORS = ['+', '-', '*', '/', '\\', '^'];

const EXAMPLE_EXPRESSIONS: string[] = [
  'a+b*c',
  '(a+b)*c',
  '3*(4+5)-6/2',
  '(a^2+b^2)\\c',
  'x*(y+z)^2',
];

@Component({
  selector: 'app-expression-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './expression-input.component.html',
  styleUrls: ['./expression-input.component.scss'],
})
export class ExpressionInputComponent implements OnInit, OnDestroy {
  form!: FormGroup;

  validationErrors: string[] = [];
  isValid = false;

  readonly allowedOperators = ALLOWED_OPERATORS;
  readonly examples = EXAMPLE_EXPRESSIONS;

  private valueChangesSub?: any;

  constructor(
    private fb: FormBuilder,
    private expressionState: ExpressionStateService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group<{
      expression: string;
      outputNotation: OutputNotation;
    }>({
      expression: '',
      outputNotation: 'postfix',
    });

    this.valueChangesSub = this.form.valueChanges.subscribe(() => {
      this.validateExpression();
    });

    this.validateExpression();
  }

  ngOnDestroy(): void {
    if (this.valueChangesSub) {
      this.valueChangesSub.unsubscribe();
    }
  }

  get expression(): string {
    return this.form.get('expression')?.value ?? '';
  }

  private normalizeExpression(expr: string): string {
    return expr.replace(/\s+/g, '');
  }

  private toPostfix(expr: string): string {
    const output: string[] = [];
    const stack: string[] = [];

    const precedence: Record<string, number> = {
      '+': 1,
      '-': 1,
      '*': 2,
      '/': 2,
      '\\': 2,
      '^': 3,
    };

    const rightAssociative = new Set<string>(['^']);

    const tokens = expr.split('');

    const isOperator = (c: string): boolean =>
      Object.keys(precedence).includes(c);
    const isOperand = (c: string): boolean => /^[a-zA-Z0-9]$/.test(c);

    for (const token of tokens) {
      if (isOperand(token)) {
        output.push(token);
      } else if (isOperator(token)) {
        while (stack.length > 0) {
          const top = stack[stack.length - 1];
          if (!isOperator(top)) break;

          const pTop = precedence[top];
          const pTok = precedence[token];

          if (pTop > pTok || (pTop === pTok && !rightAssociative.has(token))) {
            output.push(stack.pop() as string);
          } else {
            break;
          }
        }
        stack.push(token);
      } else if (token === '(') {
        stack.push(token);
      } else if (token === ')') {
        while (stack.length > 0 && stack[stack.length - 1] !== '(') {
          output.push(stack.pop() as string);
        }
        if (stack.length === 0) {
          throw new Error('Paréntesis desbalanceados en conversión a postfix.');
        }
        stack.pop();
      } else {
        throw new Error(
          `Carácter no válido en conversión a postfix: "${token}"`
        );
      }
    }

    while (stack.length > 0) {
      const top = stack.pop() as string;
      if (top === '(' || top === ')') {
        throw new Error(
          'Paréntesis desbalanceados al final de la conversión a postfix.'
        );
      }
      output.push(top);
    }

    return output.join(' ');
  }

  private validateExpression(): void {
    const expr = this.expression;
    const errors: string[] = [];

    if (!expr.trim()) {
      errors.push('La expresión no puede estar vacía.');
    }

    const pattern = /^[a-zA-Z0-9\s()+\-*/\\^]*$/;

    if (expr && !pattern.test(expr)) {
      errors.push(
        'Solo se permiten letras, dígitos, operadores (+, -, *, /, \\, ^) y paréntesis.'
      );
    }

    let parenCount = 0;
    for (const char of expr) {
      if (char === '(') parenCount++;
      if (char === ')') parenCount--;
      if (parenCount < 0) {
        errors.push('Paréntesis desequilibrados.');
        break;
      }
    }
    if (parenCount !== 0) {
      errors.push('Paréntesis desequilibrados.');
    }

    const operatorPattern = /[+\-*/\\^]{2,}/;
    if (operatorPattern.test(expr)) {
      errors.push('No se permiten operadores consecutivos.');
    }

    this.validationErrors = errors;
    this.isValid = errors.length === 0 && !!expr.trim();
  }

  addOperator(operator: string): void {
    const current = this.expression;
    this.form.patchValue({ expression: current + operator });
  }

  clearExpression(): void {
    this.form.patchValue({ expression: '' });
    this.expressionState.clear();
  }

  useRandomExample(): void {
    const example =
      this.examples[Math.floor(Math.random() * this.examples.length)];
    this.form.patchValue({ expression: example });
  }

  submit(): void {
    if (!this.isValid) {
      this.validateExpression();
      return;
    }

    const value = this.form.value;

    const rawExpression = value.expression;
    const normalizedExpression = this.normalizeExpression(rawExpression);

    let postfix = '';
    try {
      postfix = this.toPostfix(normalizedExpression);
    } catch (e) {
      this.validationErrors = [
        e instanceof Error ? e.message : 'Error al convertir a postfix.',
      ];
      this.isValid = false;
      return;
    }

    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2, 10);

    const model: ExpressionInputModel = {
      id,
      rawExpression,
      normalizedExpression,
      postfix,
      timestamp: Date.now(),
    };

    this.expressionState.setExpression(model);

    console.log('ExpressionInputModel enviado al estado:', model);
  }
}
