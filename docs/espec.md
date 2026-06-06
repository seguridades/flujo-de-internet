# Especificaciones Técnicas Finales: Simulador de Flujo de Red Pro

## 1. Stack Tecnológico Recomendado
- **Framework:** React 18+ (Vite)
- **Styling:** Tailwind CSS (para la interfaz y el grid)
- **Animaciones:** Framer Motion (crítico para el movimiento del sobre, el zoom y las transiciones del inspector)
- **Drag & Drop:** @dnd-kit/core (para la manipulación de los 13+ nodos en el canvas)
- **Iconografía:** Lucide React

## 2. Componentes de la Arquitectura
### A. Canvas (Lienzo)
- **Infinite/Scrollable Surface:** Contenedor con `overflow-x-auto` para soportar el flujo largo de 13 nodos.
- **Zoom Engine:** Estado de `scale` aplicado al contenedor de nodos mediante Framer Motion.
- **Connection Engine:** Sistema de líneas SVG dinámicas que se dibujan entre los `rects` de los nodos.

### B. Lógica de Simulación (SimEngine)
- **Flujos de Auto-Armado:**
    - `BASIC`: Persona -> Laptop -> Módem -> Colector -> Cableado -> ISP -> Nube1 -> Nube2 -> ISP -> Cableado -> Torre Celular -> Móvil -> Persona.
    - `HTTPS/E2EE`: Mismo flujo + inyección de `key_pairs` en nodos específicos.
    - `VPN`: Encapsulamiento visual desde Laptop hasta el nodo VPN.
- **Inspector DPI:** Modal que intercepta el estado del `packet` y muestra `data.payload` (plano o hashed).
- **Telemetría:** Cálculos en tiempo real de `latencia` (basado en número de nodos y modo) y `seguridad`.

## 3. Estructura de Datos (JSON)
```json
{
  "nodes": [
    { "id": "n1", "type": "person", "label": "Persona 1", "position": { "x": 100, "y": 200 } },
    { "id": "n2", "type": "laptop", "label": "Laptop", "keys": ["https-client"] }
  ],
  "connections": [ { "from": "n1", "to": "n2" } ],
  "mode": "HTTPS"
}
```

## 4. Requerimientos de UI/UX
- **Tooltips:** Implementar con `title` o componentes de flotación para explicar cada nodo.
- **Log Técnico:** Un componente de consola que haga `append` de eventos según el paquete toque cada nodo.
- **Feedback de Error:** Validar que la cadena de IDs en `nodes` sea continua antes de iniciar `simulate()`.
