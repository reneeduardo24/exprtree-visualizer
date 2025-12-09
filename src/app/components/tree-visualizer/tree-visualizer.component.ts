import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import * as d3 from 'd3';

type NodeType = 'operator' | 'number' | 'variable';

interface ExpressionNode {
  id: string;
  type: NodeType;
  value: string;
  left?: ExpressionNode;
  right?: ExpressionNode;
}

@Component({
  selector: 'app-tree-visualizer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tree-visualizer.component.html',
  styleUrls: ['./tree-visualizer.component.scss'],
})
export class TreeVisualizerComponent implements AfterViewInit, OnChanges {
  @Input() tree: ExpressionNode | null = null;

  @ViewChild('svg', { static: false }) svgRef!: ElementRef<SVGSVGElement>;

  private initialized = false;

  ngAfterViewInit(): void {
    this.initialized = true;
    this.renderTree();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tree'] && this.initialized) {
      this.renderTree();
    }
  }

  private renderTree(): void {
    if (!this.svgRef) return;

    const svgEl = this.svgRef.nativeElement;
    const svg = d3.select<SVGSVGElement, unknown>(svgEl);

    // Limpiar contenido previo
    svg.selectAll('*').remove();

    if (!this.tree) {
      return;
    }

    const width = svgEl.clientWidth || 600;
    const height = svgEl.clientHeight || 400;

    svg.attr('viewBox', `0 0 ${width} ${height}`);

    const g = svg.append('g').attr('transform', 'translate(20,40)');

    // Convertimos tu árbol a jerarquía D3
    const root = d3.hierarchy<ExpressionNode>(
      this.tree as ExpressionNode,
      (d: ExpressionNode) => {
        const children: ExpressionNode[] = [];
        if (d.left) children.push(d.left);
        if (d.right) children.push(d.right);
        return children.length ? children : null;
      }
    );

    const treeLayout = d3
      .tree<ExpressionNode>()
      .size([width - 40, height - 80]);

    treeLayout(root);

    // Enlaces
    const linkGenerator = d3
      .linkVertical<
        d3.HierarchyPointNode<ExpressionNode>,
        d3.HierarchyPointNode<ExpressionNode>
      >()
      .x((d) => d.x)
      .y((d) => d.y);

    g.selectAll('path.link')
      .data(root.links())
      .enter()
      .append('path')
      .attr('class', 'tree-link')
      .attr(
        'd',
        (d) => `M${d.source.x},${d.source.y} L${d.target.x},${d.target.y}`
      )
      .attr('fill', 'none')
      .attr('stroke', '#e5e7eb')
      .attr('stroke-width', 1.5);

    // Nodos
    const nodes = g
      .selectAll('g.tree-node')
      .data(root.descendants())
      .enter()
      .append('g')
      .attr('class', 'tree-node')
      .attr('transform', (d: any) => `translate(${d.x},${d.y})`);

    nodes
      .append('circle')
      .attr('r', 18)
      .attr('class', (d) =>
        d.data.type === 'operator' ? 'node-circle node-operator' : 'node-circle'
      )
      .attr('fill', '#ffffff')
      .attr('stroke', (d) =>
        d.data.type === 'operator' ? '#3b82f6' : '#1e293b'
      )
      .attr('stroke-width', 2);

    nodes
      .append('text')
      .attr('class', 'node-label')
      .attr('dy', '0.35em')
      .attr('text-anchor', 'middle')
      .text((d: any) => d.data.value);
  }
}
