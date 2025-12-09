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
  // Puede ser un ExpressionNode o un nodo "virtual" con children[]
  @Input() tree: any = null;

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
    const svg = d3.select(svgEl);

    // Limpiar contenido previo
    svg.selectAll('*').remove();

    if (!this.tree) {
      return;
    }

    const width = svgEl.clientWidth || 600;
    const height = svgEl.clientHeight || 400;

    svg.attr('viewBox', `0 0 ${width} ${height}`);

    const g = svg.append('g').attr('transform', 'translate(20,40)');

    // Jerarquía D3:
    // - Si el nodo tiene children[], usamos esos.
    // - Si no, usamos left/right como hijos (árbol binario normal).
    const root = d3.hierarchy<any>(this.tree, (d: any) => {
      if (Array.isArray(d.children)) {
        return d.children;
      }
      const children: any[] = [];
      if (d.left) children.push(d.left);
      if (d.right) children.push(d.right);
      return children;
    });

    const treeLayout = d3.tree<any>().size([width - 40, height - 80]);

    treeLayout(root);

    // ENLACES (aristas)
    g.selectAll('path.link')
      .data(root.links())
      .enter()
      .append('path')
      .attr('class', 'tree-link')
      .attr('d', (d) => `M${d.source.x},${d.source.y} L${d.target.x},${d.target.y}`)
      .attr('fill', 'none')
      // Si el enlace sale de la raíz virtual (depth 0), lo hacemos invisible
      .attr('stroke', (d) => (d.source.depth === 0 && d.source.data.isVirtual ? 'transparent' : '#e5e7eb'))
      .attr('stroke-width', (d) => (d.source.depth === 0 && d.source.data.isVirtual ? 0 : 1.5));

    // NODOS
    const nodes = g
      .selectAll('g.node')
      .data(root.descendants())
      .enter()
      .append('g')
      .attr('class', 'tree-node')
      .attr('transform', (d) => `translate(${d.x},${d.y})`);

    // Círculo del nodo
    nodes
      .append('circle')
      .attr('class', (d) =>
        d.data.type === 'operator' ? 'node-circle node-operator' : 'node-circle'
      )
      // Si es la raíz virtual, radio 0 → no se ve
      .attr('r', (d) => (d.depth === 0 && d.data.isVirtual ? 0 : 18))
      .attr('fill', '#ffffff')
      .attr('stroke', (d) =>
        d.data.type === 'operator' ? '#3b82f6' : '#1e293b'
      )
      .attr('stroke-width', (d) =>
        d.depth === 0 && d.data.isVirtual ? 0 : 2
      );

    // Texto dentro del nodo
    nodes
      .append('text')
      .attr('class', 'node-label')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('fill', '#1e293b')
      .text((d) => {
        // La raíz virtual no muestra texto
        if (d.depth === 0 && d.data.isVirtual) {
          return '';
        }
        return d.data.value ?? '';
      });
  }
}
