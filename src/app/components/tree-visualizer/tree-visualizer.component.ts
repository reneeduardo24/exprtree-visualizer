/**
 * Componente encargado de visualizar un árbol de expresión utilizando D3.js.
 *
 * Recibe un nodo raíz (`tree`) que puede ser:
 *  - Un árbol binario real (ExpressionNode),
 *  - Una raíz virtual que contiene un arreglo de subárboles (children[]),
 *    usada cuando el parser está en pasos intermedios donde la pila tiene
 *    múltiples elementos.
 *
 * Este componente se redibuja automáticamente cada vez que llega un nuevo árbol,
 * permitiendo animar la evolución paso a paso durante la construcción del árbol
 * de expresión.
 */

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

/** Tipos permitidos para nodos del árbol. */
type NodeType = 'operator' | 'number' | 'variable';

/**
 * Modelo de un nodo del árbol de expresión.
 * En pasos intermedios puede existir un nodo "virtual" para agrupar múltiples raíces.
 */
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
  /**
   * Árbol o estructura virtual recibida desde el parser.
   * Puede ser un ExpressionNode o un nodo con propiedad children[].
   */
  @Input() tree: any = null;

  /** Referencia al elemento SVG donde se generará el render de D3. */
  @ViewChild('svg', { static: false }) svgRef!: ElementRef<SVGSVGElement>;

  /** Bandera que indica si el SVG ya está listo para iniciar D3. */
  private initialized = false;

  /**
   * Se ejecuta una vez cuando el componente ya está presente en el DOM.
   * Marca el inicializado y realiza un primer render.
   */
  ngAfterViewInit(): void {
    this.initialized = true;
    this.renderTree();
  }

  /**
   * Se ejecuta cada vez que cambia el input `tree`.
   * Si el componente ya fue inicializado, vuelve a dibujar el árbol.
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tree'] && this.initialized) {
      this.renderTree();
    }
  }

  /**
   * Renderiza el árbol completo utilizando D3.js.
   *
   * Flujo interno:
   *  1. Limpia el SVG.
   *  2. Configura dimensiones.
   *  3. Construye una jerarquía D3:
   *     - children[] → múltiples subárboles (raíz virtual)
   *     - left/right → árbol binario tradicional
   *  4. Aplica layout tipo `tree()`.
   *  5. Dibuja enlaces (aristas):
   *     - Si el enlace proviene de la raíz virtual → se oculta.
   *  6. Dibuja nodos (círculos y texto).
   */
  private renderTree(): void {
    if (!this.svgRef) return;

    const svgEl = this.svgRef.nativeElement;
    const svg = d3.select(svgEl);

    // Limpieza completa del render previo
    svg.selectAll('*').remove();

    // Si no hay árbol, no se renderiza nada
    if (!this.tree) return;

    // Dimensiones dinámicas basadas en el contenedor
    const width = svgEl.clientWidth || 600;
    const height = svgEl.clientHeight || 400;

    svg.attr('viewBox', `0 0 ${width} ${height}`);

    // Grupo principal con márgenes
    const g = svg.append('g').attr('transform', 'translate(20,40)');

    /**
     * Construye la jerarquía interna de D3.
     * - Si el nodo tiene children[] → se interpreta como raíz virtual.
     * - Si tiene left/right → modelo de árbol binario normal.
     */
    const root = d3.hierarchy<any>(this.tree, (d: any) => {
      if (Array.isArray(d.children)) {
        return d.children;
      }

      const children: any[] = [];
      if (d.left) children.push(d.left);
      if (d.right) children.push(d.right);
      return children;
    });

    // Layout tipo árbol
    const treeLayout = d3.tree<any>().size([width - 40, height - 80]);
    treeLayout(root);

    // --------------------------------------------------------------------
    //                          ENLACES (aristas)
    // --------------------------------------------------------------------
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
      /**
       * Oculta las aristas que salen de la raíz virtual,
       * para evitar mostrar líneas colgantes mientras hay múltiples subárboles.
       */
      .attr('stroke', (d) =>
        d.source.depth === 0 && d.source.data.isVirtual ? 'transparent' : '#e5e7eb'
      )
      .attr('stroke-width', (d) =>
        d.source.depth === 0 && d.source.data.isVirtual ? 0 : 1.5
      );

    // --------------------------------------------------------------------
    //                          NODOS
    // --------------------------------------------------------------------
    const nodes = g
      .selectAll('g.node')
      .data(root.descendants())
      .enter()
      .append('g')
      .attr('class', 'tree-node')
      .attr('transform', (d) => `translate(${d.x},${d.y})`);

    // CÍRCULOS
    nodes
      .append('circle')
      .attr('class', (d) =>
        d.data.type === 'operator' ? 'node-circle node-operator' : 'node-circle'
      )
      // Si es raíz virtual → radio 0 para ocultarlo
      .attr('r', (d) => (d.depth === 0 && d.data.isVirtual ? 0 : 18))
      .attr('fill', '#ffffff')
      .attr('stroke', (d) =>
        d.data.type === 'operator' ? '#3b82f6' : '#1e293b'
      )
      .attr('stroke-width', (d) =>
        d.depth === 0 && d.data.isVirtual ? 0 : 2
      );

    // ETIQUETAS DE TEXTO
    nodes
      .append('text')
      .attr('class', 'node-label')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('fill', '#1e293b')
      .text((d) => {
        // La raíz virtual no debe mostrar texto
        if (d.depth === 0 && d.data.isVirtual) return '';
        return d.data.value ?? '';
      });
  }
}
