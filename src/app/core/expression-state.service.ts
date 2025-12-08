import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ExpressionInputModel {
  id: string;
  rawExpression: string;
  normalizedExpression: string;
  postfix: string;
  timestamp: number;
}

@Injectable({
  providedIn: 'root',
})
export class ExpressionStateService {
  private expressionSubject = new BehaviorSubject<ExpressionInputModel | null>(null);

  expression$: Observable<ExpressionInputModel | null> = this.expressionSubject.asObservable();

  setExpression(model: ExpressionInputModel): void {
    this.expressionSubject.next(model);
  }

  getCurrent(): ExpressionInputModel | null {
    return this.expressionSubject.value;
  }

  clear(): void {
    this.expressionSubject.next(null);
  }
}
