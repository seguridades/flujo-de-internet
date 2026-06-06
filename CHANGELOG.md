# Changelog

Todas las novedades relevantes de este proyecto se documentan aquí.
El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/)
y el versionado [SemVer](https://semver.org/lang/es/).

## [0.0.1] - 2026-06-06

Primera versión del simulador interactivo "seguridades - ¿Cómo funciona internet?".

### Agregado
- **Lienzo interactivo** con zoom (+, -, reset), scroll y fondo de rejilla.
- **Inventario de nodos** arrastrables: Persona 1/2, Laptop, Módem/WiFi, Colector,
  Cableado, ISP, Gmail, Hotmail, Torre Celular, Móvil, VPN, YouTube, Portal Gob
  y Atacante MitM.
- **Conexiones**: se crean arrastrando desde el puerto azul de un nodo a otro; se
  eliminan haciendo click sobre el cable. Reposicionamiento de nodos por arrastre.
- **Menú de Escenarios**: Flujo simple, VPN a varios servicios y Lienzo vacío
  (modo interactivo). Botón Desordenar (modo taller) que reparte los nodos.
- **Modos de seguridad** con visualización propia:
  - Básico: paquete visible, contenido en texto plano.
  - HTTPS: cifrado por tramos, pares de llaves de color por sesión TLS, arcos de
    llave a llave y narración que muestra cómo los servidores leen y vuelven a cifrar.
  - E2EE: una sola llave compartida origen-destino; las nubes no pueden leer.
  - VPN: túnel cifrado al servidor VPN (con etiqueta de país), oculta la IP y
    ciega al ISP.
- **Simulación** del viaje del paquete con Framer Motion, soporte de destinos
  múltiples (BFS) para topologías ramificadas, y telemetría de Latencia,
  Seguridad y Paquetes.
- **Inspector DPI**, **interceptación MitM** (texto plano vs cifrado) y
  **explicaciones por llave** en modales que pausan la simulación (Continuar,
  Enter o Espacio).
- **Log técnico** con marcas de tiempo, paneles laterales colapsables y aviso de
  resolución mínima para escritorio.
