# 🧠 Vision Board App

Una aplicación web para crear **vision boards** de forma rápida, simple y visual.
Permite buscar imágenes, seleccionarlas, organizarlas en un canvas y exportarlas listas para imprimir.

---

## 🚀 Objetivo inicial

Construir una primera versión funcional sin backend que permita:

* Buscar imágenes
* Seleccionar múltiples imágenes
* Crear un tablero visual (vision board)
* Ajustar layout (posición y tamaño)
* Exportar el resultado (PNG / JSON)
* Guardar tableros localmente

---

## 🧩 Stack Tecnológico

### 🧱 Base

* **Astro** → estructura general y rendimiento
* **React** → interactividad (islas)

### 🎨 UI

* **Tailwind CSS**
* **DaisyUI**

### 🧠 Estado

* **Zustand** (con persistencia)

### 🖼️ Canvas / Editor

* **react-konva**

### 💾 Persistencia (sin backend)

* `localStorage` (vía Zustand persist)

### 🔍 Imágenes

* API de **Unsplash** (directamente desde frontend en MVP)

---

## 🏗️ Arquitectura

```txt
Astro (shell)
  ↓
React (islas interactivas)
  ↓
Zustand (estado global)
  ↓
localStorage (persistencia)
```

---

## 📦 Estructura del Proyecto (sugerida)

```txt
src/
  modules/
    search/
      components/
      hooks/
      utils/
    selection/
      components/
      hooks/
    editor/
      components/
      hooks/
      utils/
  stores/
    board.store.ts
  types/
    board.ts
  utils/
    export.ts
  pages/
    index.astro
    editor.astro
```

---

## 🧠 Modelo de Datos

```ts
type Board = {
  id: string
  name: string
  size: {
    width: number
    height: number
  }
  items: {
    id: string
    imageUrl: string
    x: number
    y: number
    width: number
    height: number
  }[]
  createdAt: number
}
```

---

## 🔄 Flujo de Usuario

1. 🔍 Buscar imágenes
2. 🖼️ Seleccionar múltiples imágenes
3. 📐 Definir tamaño del tablero
4. 🧱 Editar layout (drag & resize)
5. 💾 Guardado automático (local)
6. 📤 Exportar:

   * PNG (para imprimir)
   * JSON (backup)

---

## 💾 Persistencia

Se utiliza `localStorage` mediante Zustand:

* Guardado automático
* Sin necesidad de login
* Persistencia local por navegador

---

## 📤 Exportación

### Imagen (PNG)

* Generada desde el canvas

### JSON

Permite:

* Backup
* Importar/exportar tableros

---

## ⚠️ Limitaciones

* No hay autenticación
* No hay sincronización en la nube
* Dependencia directa de API externa (Unsplash)
* Límite de almacenamiento (~5MB en localStorage)

---

## 🧪 Roadmap

### ✅ V1 (MVP)

* [x] Buscar imágenes
* [x] Selección múltiple
* [x] Editor básico (drag & resize)
* [x] Exportar PNG
* [x] Guardado local

---

### 🚧 V2

* [ ] Backend (API)
* [ ] Guardado en la nube
* [ ] Autenticación
* [ ] Compartir tableros

---

### 🚀 V3

* [ ] Templates predefinidos
* [ ] Generación con IA
* [ ] Vision boards guiados
* [ ] Comunidad

---

## 💡 Decisiones Técnicas

* ❌ No se usa backend en MVP → rapidez de desarrollo
* ❌ No se usa Redux → Zustand es más simple
* ❌ No se usa Next.js → Astro es más ligero para este caso
* ✅ React solo donde se necesita (islas)
* ✅ Persistencia local para validar producto

---

## 🧠 Futuro (Arquitectura Escalable)

Se planea migrar a una arquitectura con repositorios:

```ts
interface BoardRepository {
  save(board: Board): Promise<void>
  getAll(): Promise<Board[]>
}
```

Implementaciones futuras:

* `LocalBoardRepository`
* `ApiBoardRepository`

---

## 🛠️ Instalación

Usando **Bun**:

```bash
bun install
bun run dev
```

---

## 📌 Notas

* Este proyecto está enfocado en validar la idea rápidamente
* La simplicidad es prioridad sobre la escalabilidad en esta etapa
* El diseño está orientado a ser minimalista y centrado en contenido visual

---

## ✨ Inspiración

* Pinterest (exploración visual)
* Canva (edición)
* Vision boards tradicionales

---

## 📄 Licencia

MIT
