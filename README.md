# 🧠 Vision Craft

Una aplicación web para crear **vision boards** de forma rápida, simple y visual.
Permite buscar (o subir) imágenes, seleccionarlas, organizarlas en un canvas y exportarlas listas para imprimir.

---

## 🚀 Objetivo inicial

Construir una primera versión funcional sin backend que permita:

- Buscar imágenes (Unsplash/Pexels), subir las propias o pegar un enlace
- Seleccionar múltiples imágenes
- Crear un tablero visual (vision board)
- Ajustar layout (posición, tamaño, rotación, texto)
- Exportar el resultado (PNG / JPG / póster para imprimir) y respaldar en JSON
- Guardar tableros localmente

---

## 🧩 Stack Tecnológico

### 🧱 Base

- **Astro** → estructura general y rendimiento
- **React** → interactividad (islas)

### 🎨 UI

- **Tailwind CSS**
- **DaisyUI**

### 🧠 Estado

- **nanostores** (`@nanostores/persistent` + `@nanostores/react`)

### 🖼️ Canvas / Editor

- **react-konva**

### 💾 Persistencia (sin backend)

- `localStorage` (vía `persistentAtom` de nanostores)

### 🔍 Imágenes

- **Unsplash** y **Pexels**, vía un endpoint propio (`/api/images`) que guarda las API keys en el servidor — el frontend nunca llama a los proveedores directamente
- **Cloudinary** para imágenes propias del usuario: subida _unsigned_ directo desde el navegador (sin backend propio), normalizada al mismo formato que Unsplash/Pexels

---

## 🏗️ Arquitectura

```txt
Astro (shell)
  ↓
React (islas interactivas)
  ↓
nanostores (estado global)
  ↓
localStorage (persistencia)
```

---

## 📦 Estructura del Proyecto

```txt
src/
  modules/
    Explore/           # Paso 1: buscar y seleccionar imágenes
      components/
      services/        # clientes de Unsplash/Pexels (llaman a /api/images)
      constants/        # registro de proveedores
      types.ts
    Canvas/            # Paso 2: elegir tamaño de lienzo
      components/
      constants/       # presets de papel (A4, A3, poster, ...)
      types.ts
    Design/            # Paso 3: editor drag & drop sobre Konva
      components/
      hooks/
      types.ts
    Export/            # Paso 4: descargar (PNG/JPG) / imprimir (hoja o póster)
      components/
      hooks/
      utils/           # generación del HTML de impresión
      types.ts
    Boards/            # Biblioteca de tableros guardados + import/export JSON
      components/
      types.ts
    Landing/           # Página de inicio (marketing), solo .astro
      components/
  shared/
    store/             # nanostores: fuente de verdad del dominio
      canvasStore.ts   # config + items + lienzos guardados (persistente)
      boardStore.ts    # selección de imágenes en Explore (persistente)
      designViewStore.ts
    components/        # TopNav, StudioLayout, PageHeader/Footer, StepperNav, Toast
    hooks/              # useToast, useContainerScale, useDebounce
    constants/
    utils/
  pages/
    index.astro
    explore.astro, canvas.astro, design.astro, export.astro, boards.astro
    api/images.ts      # proxy server-side a Unsplash/Pexels
  layouts/
    Layout.astro
```

Cada módulo sigue la misma forma: `index.astro` (shell de página, compone `StudioLayout` + `PageHeader`/`PageFooter`), `components/`, y un `types.ts` que sobre todo **reexporta** los tipos de dominio desde `shared/store/canvasStore.ts` más algún tipo de UI local al módulo.

---

## 🧠 Modelo de Datos

El dominio real vive en `shared/store/canvasStore.ts` (no en un `types/board.ts` separado):

```ts
interface CanvasConfig {
	presetId: CanvasPresetId;
	widthMm: number; // el tamaño siempre se guarda en mm
	heightMm: number;
	orientation: "portrait" | "landscape";
	name: string;
}

interface CanvasItem {
	id: string; // crypto.randomUUID()
	type?: "image" | "text";
	imageSrc?: string;
	text?: string;
	fontSize?: number;
	fillColor?: string;
	fontFamily?: string;
	fontStyle?: string;
	x: number;
	y: number; // posición en píxeles lógicos (base 96dpi)
	width: number;
	height: number;
	rotation: number;
	zIndex: number;
}

interface SavedCanvas {
	id: string;
	name: string;
	createdAt: string; // ISO 8601
	thumbnail?: string; // data-URL generado desde el Stage
	config: CanvasConfig;
	items: CanvasItem[];
}
```

---

## 🔄 Flujo de Usuario

1. 🔍 Buscar imágenes (Unsplash/Pexels), subir las propias o pegar un enlace
2. 🖼️ Seleccionar múltiples imágenes
3. 📐 Definir tamaño del tablero
4. 🧱 Editar layout (drag, resize, rotación, texto)
5. 💾 Guardado automático (local)
6. 📤 Exportar:

   - PNG o JPG en alta resolución (DPI 150/300)
   - Imprimir en una hoja o como póster en varias hojas

7. 🗂️ Gestionar tableros guardados en **Boards** (abrir, duplicar, importar/exportar JSON)

---

## 💾 Persistencia

Se utiliza `localStorage` mediante `persistentAtom` de nanostores:

- Guardado automático
- Sin necesidad de login
- Persistencia local por navegador

---

## 📤 Exportación

### Imagen (PNG / JPG)

- Generada desde el canvas (Konva `Stage.toDataURL`) con DPI ajustable (150/300)

### Impresión

- Ajustada a una sola hoja, o como **póster** repartido en varias hojas (ver `buildPrintConfig()` en `Export/types.ts`)

### JSON (en el módulo Boards)

Permite:

- Backup de cada tablero
- Importar/exportar tableros como archivo `.json`

---

## ⚠️ Limitaciones

- No hay autenticación
- No hay sincronización en la nube
- Dependencia de APIs externas (Unsplash, Pexels, Cloudinary)
- Límite de almacenamiento (~5MB en localStorage)

---

## 🧪 Roadmap

### ✅ V1 (MVP)

- [x] Buscar imágenes (Unsplash/Pexels), subir propias y pegar enlace
- [x] Selección múltiple
- [x] Editor drag & drop (mover, escalar, rotar, texto, capas)
- [x] Exportar PNG/JPG e imprimir (hoja o póster)
- [x] Guardado local + biblioteca de tableros (Boards) con import/export JSON

---

### 🚧 V2

- [ ] Backend (API)
- [ ] Guardado en la nube
- [ ] Autenticación
- [ ] Compartir tableros

---

### 🚀 V3

- [ ] Templates predefinidos
- [ ] Generación con IA
- [ ] Vision boards guiados
- [ ] Comunidad

---

## 💡 Decisiones Técnicas

- ❌ No se usa backend en MVP → rapidez de desarrollo
- ❌ No se usa Redux/Zustand → nanostores es más simple y ligero, y se integra directo con Astro islands vía `@nanostores/react`
- ❌ No se usa Next.js → Astro es más ligero para este caso
- ✅ React solo donde se necesita (islas)
- ✅ Persistencia local para validar producto

---

## 🧭 Convenciones de código

### Naming

- Componentes React: `PascalCase.tsx`, un componente por archivo, nombre del archivo = nombre del export.
- Hooks: `camelCase.ts` con prefijo `use`, un hook por archivo (`useToast.ts`, `useContainerScale.ts`, `usePosterPrintConfig.ts`...).
- Stores (nanostores): `camelCaseStore.ts` en `shared/store/`; el átomo se llama `xStore` y sus acciones son funciones sueltas exportadas junto a él (`updateItem`, `bringToFront`, `saveCurrentCanvas`...), no métodos de una clase.
- Tipos de dominio: viven una sola vez junto al store que los define (`canvasStore.ts`); el `types.ts` de cada módulo los reexporta en vez de redeclararlos.

### Exports

- El componente raíz de un módulo — el que un `index.astro` hidrata con `client:load`/`client:only` (`DesignEditor`, `ExportPanel`, `CanvasSetup`, `ImagesGallery`) — usa **export default**.
- Todo lo demás — subcomponentes, hooks, componentes compartidos (`Toast`, `KonvaImageItem`, `ExportCanvasPreview`...) — usa **named export**. Facilita el autoimport y evita renombrados accidentales al importar.
- Los stores solo usan named exports (átomos + funciones), nunca default.
- Nota: varios componentes "hoja" anteriores a esta convención (`PresetCard`, `ExportOptionsButton`, `ExportModeSelector`, etc.) siguen con `export default` por herencia — no hace falta migrarlos fuera de una pasada dedicada, pero el código nuevo debe seguir la regla de arriba.

### Sistema de diseño

- Tailwind v4 + DaisyUI, con paleta propia definida en `src/assets/app.css` vía `@theme`: tokens `--color-df-{primary,secondary,bg,surface,ink,muted,accent}` y su variante `-dark`. Se usan como `bg-df-surface dark:bg-df-surface-dark`, etc.
- Dark mode por clase (`.dark` en `<html>`), alternada por el script inline de `Layout.astro` y persistida en `localStorage` bajo la key `df-theme` (independiente de los nanostores del dominio).
- Los tokens `df-*` (nuevos) y las clases crudas de DaisyUI (`base-100`, `base-200`...) todavía conviven en el código; no fuerces una migración global — sigue el patrón que ya domine en el archivo que estés tocando.
- Iconos: `lucide-astro` en archivos `.astro`, `lucide-react` en islas `.tsx`. No se crean iconos propios en `shared/icons/`.

---

## 🧠 Futuro (Arquitectura Escalable)

Se planea migrar a una arquitectura con repositorios:

```ts
interface BoardRepository {
	save(board: Board): Promise<void>;
	getAll(): Promise<Board[]>;
}
```

Implementaciones futuras:

- `LocalBoardRepository`
- `ApiBoardRepository`

---

## 🛠️ Instalación

Usando **Bun**:

```bash
bun install
bun run dev
```

---

## 📌 Notas

- Este proyecto está enfocado en validar la idea rápidamente
- La simplicidad es prioridad sobre la escalabilidad en esta etapa
- El diseño está orientado a ser minimalista y centrado en contenido visual

---

## ✨ Inspiración

- Pinterest (exploración visual)
- Canva (edición)
- Vision boards tradicionales

---

## 📄 Licencia

MIT
