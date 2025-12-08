import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ExpressionInputComponent } from '../expression-input/expression-input.component';
import { RecursiveParserPanelComponent } from '../recursive-parser-panel/recursive-parser-panel.component';
import { TreeVisualizerComponent } from '../tree-visualizer/tree-visualizer.component';

@Component({
  selector: 'app-workspace',
  standalone: true,
  imports: [
    CommonModule,
    ExpressionInputComponent,
    RecursiveParserPanelComponent,
    TreeVisualizerComponent,
  ],
  templateUrl: './workspace.component.html',
  styleUrls: ['./workspace.component.scss'],
})
export class WorkspaceComponent {}
