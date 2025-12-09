/**
 * Modelo que representa el estado de una expresión ingresada por el usuario.
 * Contiene:
 * - La expresión original,
 * - La expresión normalizada,
 * - La notación postfix generada,
 * - Un identificador único y un timestamp para control de versiones.
 */
export interface ExpressionInputModel {
  id: string;
  rawExpression: string;
  normalizedExpression: string;
  postfix: string;
  timestamp: number;
}

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Servicio encargado de almacenar y emitir el estado actual
 * de la expresión ingresada por el usuario.
 *
 * Este servicio actúa como un "store" simple:
 * - Permite establecer una nueva expresión,
 * - Consultar el valor actual,
 * - O limpiar el estado.
 *
 * Los componentes pueden suscribirse a `expression$` para reaccionar
 * automáticamente a los cambios.
 */
@Injectable({
  providedIn: 'root',
})
export class ExpressionStateService {
  /** BehaviorSubject que mantiene el último valor emitido de la expresión. */
  private expressionSubject = new BehaviorSubject<ExpressionInputModel | null>(
    null
  );

  /**
   * Observable que expone la expresión actual para que cualquier componente
   * pueda suscribirse y recibir actualizaciones.
   */
  expression$: Observable<ExpressionInputModel | null> =
    this.expressionSubject.asObservable();

  /**
   * Establece un nuevo estado de expresión.
   *
   * @param model Representa la expresión actual con todos sus metadatos.
   */
  setExpression(model: ExpressionInputModel): void {
    this.expressionSubject.next(model);
  }

  /**
   * Obtiene el valor actual de la expresión sin necesidad de suscribirse.
   *
   * @returns El modelo ExpressionInputModel actual, o null si no hay dato.
   */
  getCurrent(): ExpressionInputModel | null {
    return this.expressionSubject.value;
  }

  /**
   * Limpia el estado dejando la expresión en null.
   * Útil cuando se reinicia el proceso o se borra la entrada.
   */
  clear(): void {
    this.expressionSubject.next(null);
  }
}
