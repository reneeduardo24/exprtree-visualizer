**ExprTree Visualizer**  
Visualización interactiva de árboles de expresión mediante Parser Recursivo.

---

**Descripción del Proyecto**

ExprTree Visualizer es una aplicación web desarrollada en Angular Standalone diseñada para:

- Recibir expresiones matemáticas ingresadas por el usuario.  
- Tokenizar la expresión y construir su árbol de expresión usando un Parser Recursivo.  
- Mostrar la expresión equivalente en notación postfix.  
- Visualizar el árbol generado mediante D3.js de forma interactiva.  
- Explicar paso a paso el proceso del parser y la construcción del árbol.

El proyecto está pensado como herramienta educativa y demostrativa para el estudio de árboles, gramáticas, parsing recursivo y estructuras de datos, inspirado en la teoría presentada en **Grimaldi – Matemáticas Discretas**.

Además, incluye una sección visual tipo presentación (slides) donde se muestra la portada, el equipo, el docente y las tecnologías utilizadas.

---

**Tecnologías Utilizadas**

- Angular 19+ Standalone  
- TypeScript  
- SCSS (SASS)  
- D3.js (visualización de árboles)  
- HTML5 / CSS3  
- Node.js (entorno de ejecución)  
- Git / GitHub (control de versiones)

---

**Estructura Principal del Proyecto**

```text
src/
│
├── app/
│   ├── core/
│   │   └── slide.service.ts
│   │
│   ├── components/
│   │   ├── presentation-slider/
│   │   ├── workspace/
│   │   ├── expression-input/
│   │   ├── parser-view/
│   │   └── tree-visualizer/
│   │
│   └── app.component.ts
│
└── styles.scss
```
---

**Requisitos Previos**

Antes de clonar y ejecutar el proyecto, asegúrate de tener instalado:

- Node.js 18 o superior  
- Angular CLI  
- Git

Instalar Angular CLI:

npm install -g @angular/cli

---

**Clonar el Repositorio**

git clone https://github.com/reneeduardo24/exprtree-visualizer.git

cd exprtree-visualizer

---

**Instalar Dependencias**

npm install

---

**Ejecutar el Proyecto en Modo Desarrollo**

ng serve

Abrir en el navegador:

http://localhost:4200

---

**Compilación para Producción**

ng build

Los archivos generados se encuentran en:

/dist/exprtree-visualizer/

---

**Equipo de Desarrollo**

- Eduardo Chavez  
- Jesus Enrique Felix  
- Raul Ortega  
- Rene Hernandez  

**Docente Responsable:**  
Dr. Gilberto Borrego Soto
