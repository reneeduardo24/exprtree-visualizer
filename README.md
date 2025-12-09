# ExprTree Visualizer  
Visualización interactiva y paso a paso de árboles de expresión mediante Parser Basado en Pila y D3.js.

---

## 📘 Descripción General del Proyecto

**ExprTree Visualizer** es una aplicación web desarrollada con **Angular Standalone + D3.js** cuyo objetivo es:

- Recibir y validar una expresión matemática ingresada por el usuario.  
- Normalizar la expresión y convertirla a **notación postfix**.  
- Simular **paso por paso** la construcción de un árbol de expresión usando un **parser basado en pila**.  
- Mostrar la evolución del árbol en tiempo real mediante **D3.js**, desde los primeros nodos sueltos hasta el árbol final completamente construido.  
- Explicar en cada paso cuál token se procesa, qué acción se toma y cómo cambia la pila.  

El proyecto está diseñado como herramienta **educativa**, ideal para materias como:

- Matemáticas Discretas  
- Algoritmos y Estructuras de Datos  
- Compiladores  
- Parsing Recursivo / Construcción de Árboles Sintácticos  

Además, incluye una presentación inicial estilo “slides” donde se muestra:

- Portada del proyecto  
- Integrantes del equipo  
- Docente responsable  
- Tecnologías utilizadas  

---

## 🚀 Características Principales

### ✔ Paso 1 — Entrada y conversión a postfix
El usuario ingresa una expresión como:

(a+b)*c


El sistema:

- Valida sintaxis, caracteres y paréntesis.  
- Normaliza la expresión.  
- Convierte la expresión a notación postfix utilizando un algoritmo de precedencia.  

Ejemplo:

(a+b)*c → a b + c *


---

### ✔ Paso 2 — Parser paso a paso y visualización dinámica con D3.js

El parser procesa postfix token por token:

- Si encuentra **operando**, se apila.  
- Si encuentra **operador**, desapila dos nodos, crea un nuevo nodo operador y lo apila nuevamente.

En cada paso:

- Se genera un **BuildStep** con:
  - token leído  
  - acción realizada  
  - snapshot de la pila  
  - raíz actual del árbol parcial  

La visualización:

- Cuando hay múltiples elementos en la pila, se muestra una **raíz virtual** temporal para agruparlos.  
- D3.js actualiza el árbol en cada cambio, mostrando cómo **evoluciona** desde nodos sueltos hasta el árbol final.  

---

## 🧩 Arquitectura del Proyecto

### Componentes principales

| Componente | Función |
|-----------|---------|
| **ExpressionInputComponent** | Entrada, validación y conversión a postfix |
| **RecursiveParserPanelComponent** | Construcción del árbol + pasos detallados |
| **TreeVisualizerComponent** | Visualización dinámica del árbol con D3 |
| **PresentationSliderComponent** | Pantalla inicial estilo presentación |
| **WorkspaceComponent** | Contenedor de los pasos del proyecto |

### Servicios

| Servicio | Función |
|----------|---------|
| **ExpressionStateService** | Estado global de la expresión y postfix |
| **SlideService** | Datos para el carrusel de presentación |

---

## 📁 Estructura Actual del Proyecto

```text
src/
│
├── app/
│   ├── core/
│   │   ├── expression-state.service.ts
│   │   └── slide.service.ts
│   │
│   ├── components/
│   │   ├── expression-input/
│   │   ├── recursive-parser-panel/
│   │   ├── tree-visualizer/
│   │   ├── presentation-slider/
│   │   └── workspace/
│   │
│   └── app.component.ts
│
└── styles.scss
```
🛠 Tecnologías Utilizadas

Angular 19+ Standalone Components
TypeScript
D3.js (renderizado SVG de árboles binarios)
SCSS (SASS)
HTML5 / CSS3
Node.js
Git / GitHub

📦 Instalación y Ejecución

Requisitos previos

Node.js 18+
Angular CLI
Git
Instalar Angular CLI:
```
npm install -g @angular/cli
```
Clonar el repositorio
```
git clone https://github.com/reneeduardo24/exprtree-visualizer.git
cd exprtree-visualizer
```
Instalar dependencias
```
npm install
```
Ejecutar el proyecto en modo desarrollo
```
ng serve
```
Abrir en navegador
```
http://localhost:4200
```
👨‍💻 Equipo de Desarrollo

Eduardo Chavez

Jesus Enrique Felix

Raul Ortega

Rene Hernandez


Docente responsable:

Dr. Gilberto Borrego Soto
