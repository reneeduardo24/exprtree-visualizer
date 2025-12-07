import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ExpressionInputComponent } from '../expression-input/expression-input.component';
import { ParserViewComponent } from '../parser-view/parser-view.component';
import { TreeVisualizerComponent } from '../tree-visualizer/tree-visualizer.component';

@Component({
  selector: 'app-workspace',
  standalone: true,
  imports: [CommonModule, ExpressionInputComponent, ParserViewComponent, TreeVisualizerComponent],
  templateUrl: './workspace.component.html',
  styleUrls: ['./workspace.component.scss'],
})
export class WorkspaceComponent {}
