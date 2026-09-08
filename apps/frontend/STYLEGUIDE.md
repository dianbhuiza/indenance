# Indenance — Style Guide

## Filosofía de diseño

Minimalista, limpio y funcional. Inspiración en Stripe y Linear. Mucho espacio en blanco,
bordes sutiles, sombras suaves. Los colores pasteles dan vida sin saturar.

---

## Modo oscuro

Se admite **automático** (sigue el sistema) y **manual** (toggle con preferencia guardada).

| Variable CSS | Light | Dark |
|---|---|---|
| `--color-bg` | `#f8fafc` | `#0f172a` |
| `--color-surface` | `#ffffff` | `#1e293b` |
| `--color-surface-raised` | `#f1f5f9` | `#334155` |
| `--color-border` | `#e2e8f0` | `#334155` |
| `--color-text` | `#0f172a` | `#f8fafc` |
| `--color-text-secondary` | `#64748b` | `#94a3b8` |
| `--color-text-muted` | `#94a3b8` | `#64748b` |

---

## Paleta de colores

### Primario — Cyan

Color estándar de la app. Usado en branding, botones primarios, links, etc.

| Token | Hex | Tailwind |
|---|---|---|
| primary-50 | `#ecfeff` | `bg-primary-50` |
| primary-100 | `#cffafe` | `bg-primary-100` |
| primary-200 | `#a5f3fc` | `bg-primary-200` |
| primary-300 | `#67e8f9` | `bg-primary-300` |
| primary-400 | `#22d3ee` | `bg-primary-400` |
| primary-500 | `#06b6d4` | `bg-primary-500` |
| primary-600 | `#0891b2` | `bg-primary-600` |
| primary-700 | `#0e7490` | `bg-primary-700` |
| primary-800 | `#155e75` | `bg-primary-800` |
| primary-900 | `#164e63` | `bg-primary-900` |
| primary-950 | `#083344` | `bg-primary-950` |

### Pasteles — Categorías

Colores suaves para etiquetas de categorías de transacciones. Se saturan en dark mode.

| Color | 50 | 300 | 500 | 700 | Tailwind base |
|---|---|---|---|---|---|
| Azul | `#eff6ff` | `#93c5fd` | `#3b82f6` | `#1d4ed8` | `blue` |
| Violeta | `#f5f3ff` | `#c4b5fd` | `#8b5cf6` | `#6d28d9` | `violet` |
| Rosa | `#fff1f2` | `#fda4af` | `#f43f5e` | `#be123c` | `pink` |
| Verde | `#f0fdf4` | `#6ee7b7` | `#10b981` | `#047857` | `green` |
| Ámbar | `#fffbeb` | `#fcd34d` | `#f59e0b` | `#b45309` | `amber` |
| Rojo | `#fef2f2` | `#fca5a5` | `#ef4444` | `#b91c1c` | `red` |

### Semánticos

| Uso | 50 | 400 | 500 | 600 | Tailwind |
|---|---|---|---|---|---|
| Éxito / Ingreso | `#f0fdf4` | `#34d399` | `#10b981` | `#059669` | `success` |
| Error / Gasto | `#fef2f2` | `#f87171` | `#ef4444` | `#dc2626` | `danger` |
| Advertencia | `#fffbeb` | `#fbbf24` | `#f59e0b` | `#d97706` | `warning` |
| Info | `#eff6ff` | `#60a5fa` | `#3b82f6` | `#2563eb` | `info` |

---

## Tipografía

```css
--font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
--font-mono: "JetBrains Mono", ui-monospace, monospace;
```

| Elemento | Tailwind | Ejemplo |
|---|---|---|
| Page title | `text-2xl font-bold` | Dashboard |
| Section title | `text-lg font-semibold` | Resumen mensual |
| Body | `text-sm` | Texto general |
| Caption | `text-xs text-text-muted` | Fechas, labels |
| Number/money | `font-mono font-medium` | `$1,250.00` |

---

## Componentes

### Cards
```
bg-surface rounded-xl border border-border p-6 shadow-sm
```

### Botón primario
```
bg-primary-600 text-white rounded-lg px-4 py-2 font-medium
hover:bg-primary-700 active:bg-primary-800
transition-colors duration-150
```

### Botón secundario
```
bg-surface border border-border text-text rounded-lg px-4 py-2 font-medium
hover:bg-surface-raised transition-colors duration-150
```

### Input
```
bg-surface border border-border rounded-lg px-3 py-2 text-sm
placeholder:text-text-muted
focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500
transition-colors duration-150
```

### Badge
```
rounded-full px-2.5 py-0.5 text-xs font-medium
```

Variantes por color: `bg-primary-100 text-primary-700`, `bg-success-100 text-success-700`, etc.

### Sidebar
```
bg-surface border-r border-border
```

---

## Sombras

| Nivel | Tailwind | Uso |
|---|---|---|
| xs | `shadow-xs` | Inputs, badges |
| sm | `shadow-sm` | Cards, sidebar |
| md | `shadow-md` | Dropdowns, popovers |
| lg | `shadow-lg` | Modales |
| xl | `shadow-xl` | Tooltips flotantes |

---

## Bordes y radios

| Token | Tailwind | Uso |
|---|---|---|
| sm | `rounded-sm` | — |
| md | `rounded-md` | Badges, tags |
| lg | `rounded-lg` | Botones, inputs, cards pequeñas |
| xl | `rounded-xl` | Cards, modales, secciones |
| 2xl | `rounded-2xl` | Hero sections |
| full | `rounded-full` | Avatares, pills |

---

## Espaciado

Seguir la escala de Tailwind: `1` = 4px, `2` = 8px, `3` = 12px, `4` = 16px, `6` = 24px, `8` = 32px.

| Contexto | Espaciado recomendado |
|---|---|
| Padding de card | `p-4` a `p-6` |
| Gap entre cards | `gap-4` a `gap-6` |
| Padding de sección | `p-4 lg:p-6` |
| Gap en formularios | `space-y-4` |

---

## Animaciones

| Nombre | Duración | Uso |
|---|---|---|
| `animate-fade-in` | 150ms | Aparecer suave |
| `animate-slide-in` | 200ms | Dropdowns, menus |
| `animate-scale-in` | 150ms | Modales, tooltips |

Transiciones estándar: `transition-colors duration-150` para hover states.

---

## Breakpoints

| Prefix | Tamaño | Uso |
|---|---|---|
| `sm` | 640px | Mobile landscape |
| `md` | 768px | Tablet |
| `lg` | 1024px | Desktop (sidebar visible) |
| `xl` | 1280px | Desktop grande |

---

## Reglas de uso

1. **Nunca usar colores hardcoded** — siempre usar tokens (`text-primary-600`, `bg-surface`)
2. **Dark mode** — usar clases `dark:` de Tailwind o variables CSS
3. **Consistencia** — un tipo de botón por acción (primario = acción principal, secundario = alternativa)
4. **Jerarquía** — maximum 3 tamaños de texto por vista
5. **Accesibilidad** — contraste mínimo 4.5:1 para texto, 3:1 para UI elements
