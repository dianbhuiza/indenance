# Indenance · mobile

App móvil (Expo / React Native) de Indenance. Reproduce la funcionalidad de `apps/frontend` usando la capa compartida `packages/core`.

## Requisitos

- Node 20+ y pnpm (workspace root).
- El backend de `services/api` escuchando en el host que indique `EXPO_PUBLIC_API_URL`.

## Variables de entorno

| Variable | Descripción |
| --- | --- |
| `EXPO_PUBLIC_API_URL` | URL base de la API. Se inyecta en tiempo de compilación desde `.env`. |

`localhost` solo funciona con el simulador en la misma máquina. Con dispositivo físico usa la IP LAN, por ejemplo `EXPO_PUBLIC_API_URL=http://192.168.1.50:3000`.

## Comandos

```bash
pnpm install                          # desde la raíz del monorepo
pnpm --filter mobile exec expo start
pnpm --filter mobile exec expo lint
pnpm --filter mobile exec tsc --noEmit
pnpm --filter mobile exec expo export --platform android
```

Desde `apps/mobile`: `npx expo start`, `npx expo lint`, `npx tsc --noEmit`, `npx expo-doctor`, `npx expo export --platform android`.

Las dependencias se añaden siempre con `npx expo install <paquete>` para resolver versiones compatibles con el SDK. No editar `package.json` a mano.

## Estructura

- `src/app/` — pantallas (Expo Router, rutas planas): `/`, `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify`, `/dashboard` y `+not-found`.
- `src/components/ui/` — kit de UI propio (Button, Input, Select, Dialog, SegmentedControl, DateField…).
- `src/components/{dashboard,modals,auth,fab}` — piezas de pantalla.
- `src/lib/` — cliente API con refresh, store de sesión, almacenamiento y guard de ruta.
- `src/theme/` — tokens de colores/espaciado y tema claro/oscuro según el sistema.

## Notas

- `services/api` debe estar en ejecución; no hay mock. Para el email de verificación el token se pega manualmente en la pantalla `/verify` (la app no tiene deep links de email configurados).
- Presupuestos y listas de compra están implementados contra la API real, aunque en el web son stubs.
- Los directorios `ios/` y `android/` no se versionan: se generan con `npx expo prebuild`.
