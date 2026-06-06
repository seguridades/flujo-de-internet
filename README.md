# seguridades · ¿Cómo funciona internet?

Simulador interactivo y educativo para visualizar cómo viaja un paquete de datos
por internet y cómo lo protegen (o no) los distintos mecanismos de seguridad:
HTTP básico, HTTPS, cifrado de extremo a extremo (E2EE) y VPN.

**Pruébalo en línea: [https://flujo.seguridades.org/](https://flujo.seguridades.org/)**

Está pensado para talleres en línea: los participantes arrastran nodos (Persona,
Laptop, Módem, ISP, nubes, VPN, etc.) a un lienzo, los conectan y observan el
recorrido del paquete, con explicaciones paso a paso de qué puede leer cada actor
del camino. Es un proyecto de código abierto.

## Características

- Lienzo con zoom, scroll y arrastrar/soltar de nodos.
- Inventario de nodos y herramientas; conexiones por arrastre y borrado por click.
- **Auto-Armado**: genera el flujo completo de un click; **Desordenar** reparte
  las piezas sin conectar para que el grupo arme el flujo (modo taller).
- Cuatro modos de seguridad con visualización dedicada (llaves, arcos de cifrado,
  túnel VPN) y narración didáctica en HTTPS y E2EE.
- La VPN se representa como una computadora de confianza ubicada en alguna parte
  del mundo (ciudad y país visibles en el nodo).
- Simulación animada del paquete con telemetría (latencia, seguridad, paquetes),
  inspector DPI, interceptación MitM y log técnico.
- Exportar el lienzo como imagen PNG, manual de uso y sección "Acerca de"
  integrados.
- Multiidioma (español y portugués por ahora), con un selector en la barra
  superior. Cada idioma es un archivo JSON en `src/locales/` (por ejemplo
  `es.json`, `pt.json`), pensado para sumar fácilmente nuevas traducciones en el
  futuro, incluidas lenguas indígenas.

## Stack

- React 18 + TypeScript + Vite
- Tailwind CSS
- Framer Motion (animaciones)
- Lucide React (iconos)
- html-to-image (exportar PNG)

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

1. Pulsa **Auto-Armado** para generar el flujo completo, o arma el tuyo
   arrastrando nodos del panel izquierdo al lienzo.
2. Para conectar nodos, arrastra desde el punto azul de uno hasta otro. Click en
   un cable para borrarlo.
3. Agrega un **Atacante MitM** dentro del camino para ver qué puede leer.
4. Selecciona el modo (Básico / HTTPS / E2EE / VPN) en la barra inferior.
5. Pulsa **Enviar** y avanza con **Continuar** (o Enter / Espacio) en las pausas.

El botón de imagen exporta el lienzo a PNG, y los iconos de ayuda e información
abren el manual de uso y la sección "Acerca de".

## Estructura

- `src/App.tsx`: toda la lógica de estado y los componentes principales.
- `src/i18n.tsx`: carga de idiomas, interpolación y contexto de traducción.
- `src/locales/*.json`: las cadenas de cada idioma (`es.json`, `pt.json`, ...).
- `src/main.tsx`, `src/index.css`: punto de entrada y estilos base.

## Agregar un idioma

1. Copia `src/locales/es.json` a `src/locales/<código>.json` y traduce sus
   valores. Las variables van entre llaves y no se traducen: `{label}`, `{next}`,
   `{start}`, etc.
2. En `src/i18n.tsx`: añade el código a `Lang`, importa el JSON y regístralo en
   `RAW` y en `LANGS` (nombre y bandera para el selector).

TypeScript valida que cada JSON tenga exactamente las mismas claves que
`es.json`, así no falta ninguna cadena.

## Ayuda con traducciones

Buscamos personas que nos ayuden a llevar el simulador a lenguas indígenas. Ahora
mismo nos interesa especialmente el **náhuat** y el **quechua**. Si quieres
colaborar con una traducción (o revisar las existentes), abre un issue en GitHub
o escríbenos a `info` arroba `seguridades.org`. No necesitas saber programar:
basta con traducir un archivo de texto (`src/locales/es.json`).

## Contacto

¿Comentarios o sugerencias? Escríbenos a `info` arroba `seguridades.org`.

## Estado

Proyecto en desarrollo. Consulta el historial de cambios en
[CHANGELOG.md](CHANGELOG.md).
