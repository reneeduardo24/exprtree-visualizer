/**
 * Componente encargado de recibir la expresión matemática en notación infija,
 * validarla, normalizarla, convertirla a notación postfija y enviarla al
 * servicio global de estado para que el parser pueda procesarla en el Paso 2.
 *
 * También incluye botones rápidos de operadores, ejemplos aleatorios y
 * mensajes de validación en tiempo real.
 */

import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  ExpressionInputModel,
  ExpressionStateService,
} from '../../core/expression-state.service';

/** Tipos permitidos como notación de salida (expandible en el futuro). */
type OutputNotation = 'infix';

/** Lista de operadores aceptados por el sistema. */
const ALLOWED_OPERATORS = ['+', '-', '*', '/', '\\', '^'];

/** Ejemplos precargados para facilitar pruebas. */
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
  /** Formulario reactivo donde el usuario escribe la expresión. */
  form!: FormGroup;

  /** Lista de errores de validación detectados en la expresión. */
  validationErrors: string[] = [];

  /** Bandera que indica si la expresión es válida según las reglas. */
  isValid = false;

  /** Operadores permitidos mostrados como botones rápidos. */
  readonly allowedOperators = ALLOWED_OPERATORS;

  /** Lista de expresiones de ejemplo para autocompletado rápido. */
  readonly examples = EXAMPLE_EXPRESSIONS;

  /** Suscripción al observable del formulario para validación en tiempo real. */
  private valueChangesSub?: any;

  constructor(
    private fb: FormBuilder,
    private expressionState: ExpressionStateService
  ) {}

  /**
   * Inicializa el formulario, activa la validación en tiempo real
   * y realiza una validación inicial del campo de expresión.
   */
  ngOnInit(): void {
    this.form = this.fb.group<{
  expression: string;
  outputNotation: OutputNotation;
}>({
  expression: '',
  outputNotation: 'infix',
});

    this.valueChangesSub = this.form.valueChanges.subscribe(() => {
      this.validateExpression();
    });

    this.validateExpression();
  }

  /**
   * Limpia suscripciones para evitar fugas de memoria.
   */
  ngOnDestroy(): void {
    if (this.valueChangesSub) {
      this.valueChangesSub.unsubscribe();
    }
  }

  /**
   * Acceso directo al valor actual del campo de expresión.
   */
  get expression(): string {
    return this.form.get('expression')?.value ?? '';
    }

  // ========================================================
  // =============== Normalización de expresión =============
  // ========================================================

  /**
   * Elimina todos los espacios en blanco dentro de la expresión.
   *
   * @param expr Expresión en notación infija original.
   * @returns Expresión sin espacios.
   */
  private normalizeExpression(expr: string): string {
    return expr.replace(/\s+/g, '');
  }

  // ========================================================
  // ======= Conversión de infija a postfija (Shunting) =====
  // ========================================================

  /**
   * Convierte una expresión en notación infija a notación postfija (postfix)
   * utilizando el algoritmo de precedencia de operadores.
   *
   * @param expr Expresión normalizada sin espacios.
   * @returns Cadena equivalente en notación postfija.
   * @throws Error si encuentra paréntesis desbalanceados o caracteres inválidos.
   */
  private toPostfix(expr: string): string {
    const output: string[] = [];
    const stack: string[] = [];

    // Precedencia de operadores
    const precedence: Record<string, number> = {
      '+': 1,
      '-': 1,
      '*': 2,
      '/': 2,
      '\\': 2,
      '^': 3,
    };

    // Operadores asociativos por la derecha
    const rightAssociative = new Set<string>(['^']);

    const tokens = expr.split('');

    const isOperator = (c: string): boolean =>
      Object.keys(precedence).includes(c);
    const isOperand = (c: string): boolean => /^[a-zA-Z0-9]$/.test(c);

    for (const token of tokens) {
      if (isOperand(token)) {
        // Operando se envía directamente a la salida
        output.push(token);
      } else if (isOperator(token)) {
        // Se comparan precedencias antes de apilar
        while (stack.length > 0) {
          const top = stack[stack.length - 1];
          if (!isOperator(top)) break;

          const pTop = precedence[top];
          const pTok = precedence[token];

          // Desapilar si el operador previo tiene mayor precedencia
          // o igual precedencia y NO es asociativo por la derecha
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
        // Desapilar hasta encontrar '('
        while (stack.length > 0 && stack[stack.length - 1] !== '(') {
          output.push(stack.pop() as string);
        }
        if (stack.length === 0) {
          throw new Error('Paréntesis desbalanceados en conversión a postfix.');
        }
        stack.pop(); // quitar '('
      } else {
        throw new Error(
          `Carácter no válido en conversión a postfix: "${token}"`
        );
      }
    }

    // Vaciar la pila restante
    while (stack.length > 0) {
      const top = stack.pop() as string;
      if (top === '(' || top === ')') {
        throw new Error(
          'Paréntesis desbalanceados al finalizar la conversión a postfix.'
        );
      }
      output.push(top);
    }

    return output.join(' ');
  }

  // ========================================================
  // ==================== Validación =========================
  // ========================================================

  /**
   * Valida la sintaxis básica de la expresión:
   * - No vacía
   * - Caracteres permitidos
   * - Paréntesis balanceados
   * - Sin operadores consecutivos
   *
   * Actualiza la lista de errores y la bandera `isValid`.
   */
  private validateExpression(): void {
    const expr = this.expression;
    const errors: string[] = [];

    if (!expr.trim()) {
      errors.push('La expresión no puede estar vacía.');
    }

    // Solo caracteres válidos
    const pattern = /^[a-zA-Z0-9\s()+\-*/\\^]*$/;
    if (expr && !pattern.test(expr)) {
      errors.push(
        'Solo se permiten letras, dígitos, operadores (+, -, *, /, \\, ^) y paréntesis.'
      );
    }

    // Balanceo de paréntesis
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

    // No permitir operadores consecutivos
    const operatorPattern = /[+\-*/\\^]{2,}/;
    if (operatorPattern.test(expr)) {
      errors.push('No se permiten operadores consecutivos.');
    }

    // Guardar estado final
    this.validationErrors = errors;
    this.isValid = errors.length === 0 && !!expr.trim();
  }

  // ========================================================
  // ================= Acciones del usuario ==================
  // ========================================================

  /**
   * Inserta un operador al final de la expresión actual.
   *
   * @param operator Operador seleccionado (+, -, *, /, \, ^).
   */
  addOperator(operator: string): void {
    const current = this.expression;
    this.form.patchValue({ expression: current + operator });
  }

  /**
   * Limpia el campo de expresión y notifica al estado global
   * que ya no hay una expresión activa.
   */
  clearExpression(): void {
    this.form.patchValue({ expression: '' });
    this.expressionState.clear();
  }

  /**
   * Inserta un ejemplo aleatorio dentro del campo de expresión.
   * Útil para pruebas rápidas.
   */
  useRandomExample(): void {
    const example =
      this.examples[Math.floor(Math.random() * this.examples.length)];
    this.form.patchValue({ expression: example });
  }

  // ========================================================
  // =================== Envío del formulario ===============
  // ========================================================

 /**
 * Valida y envía la expresión al parser.
 * Si es válida:
 * - Normaliza la expresión,
 * - Crea un modelo ExpressionInputModel (sin calcular postfix),
 * - Lo envía al servicio global de estado.
 */
submit(): void {
  if (!this.isValid) {
    this.validateExpression();
    return;
  }

  const value = this.form.value;
  const rawExpression = value.expression;
  const normalizedExpression = this.normalizeExpression(rawExpression);

  // ID único
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2, 10);

  // Construcción del modelo final SIN postfix
  const model: ExpressionInputModel = {
    id,
    rawExpression,
    normalizedExpression,
    // mantenemos el campo postfix vacío o con la info antigua si lo prefieres
    postfix: '',
    timestamp: Date.now(),
  };

  // Publicar estado global
  this.expressionState.setExpression(model);

  console.log('ExpressionInputModel enviado al estado (sin postfix):', model);
}

}
