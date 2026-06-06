# seguridades · ¿Cómo funciona internet?

Simulador interactivo y educativo para visualizar cómo viaja un paquete de datos
por internet y cómo lo protegen (o no) los distintos mecanismos de seguridad:
HTTP básico, HTTPS, cifrado de extremo a extremo (E2EE) y VPN.

Está pensado para talleres: los participantes arrastran nodos (Persona, Laptop,
Módem, ISP, nubes, VPN, etc.) a un lienzo, los conectan y observan el recorrido
del paquete, con explicaciones paso a paso de qué puede leer cada actor del camino.

## Características

- Lienzo con zoom, scroll y arrastrar/soltar de nodos.
- Inventario de nodos y herramientas; conexiones por arrastre y borrado por click.
- Escenarios listos: Flujo simple, VPN a varios servicios y lienzo vacío
  (interactivo), más un modo "Desordenar" para talleres.
- Cuatro modos de seguridad con visualización dedicada (llaves, arcos de cifrado,
  túnel VPN) y narración didáctica.
- Simulación animada del paquete con telemetría (latencia, seguridad, paquetes),
  inspector DPI, interceptación MitM y log técnico.

## Stack

- React 18 + TypeScript + Vite
- Tailwind CSS
- Framer Motion (animaciones)
- Lucide React (iconos)

## Requisitos

- Node.js 18 o superior.
- Navegador de escritorio (resolución mínima recomendada 1024 x 600).

## Puesta en marcha

```bash
npm install      # instala dependencias
npm run dev      # servidor de desarrollo (Vite)
npm run build    # build de producción en dist/
npm run preview  # sirve el build de producción
```

Abre la URL que imprime Vite (por defecto http://localhost:5173).

## Uso rápido

1. Elige un escenario en el menú **Escenarios**, o arma el flujo arrastrando nodos.
2. Para conectar nodos, arrastra desde el punto azul de uno hasta otro. Click en
   un cable para borrarlo.
3. Selecciona el modo (Básico / HTTPS / E2EE / VPN) en la barra inferior.
4. Pulsa **Enviar** y avanza con **Continuar** (o Enter / Espacio) en las pausas.
5. Haz click en un servicio para enviar solo a ese destino; sin selección, se
   recorren todos.

## Estructura

- `src/App.tsx` — toda la lógica de estado y los componentes principales.
- `src/main.tsx`, `src/index.css` — punto de entrada y estilos base.

## Estado

Proyecto en desarrollo. Ver [CHANGELOG.md](./CHANGELOG.md) para el detalle de versiones.
