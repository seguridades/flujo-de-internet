# Historial de cambios

Todos los cambios relevantes de este proyecto se documentan aquí. El formato
sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el proyecto
usa [versionado semántico](https://semver.org/lang/es/).

## [No publicado]

### Añadido

- Favicon e icono para dispositivos (`public/favicon.png`).
- Metadatos Open Graph y Twitter Card (título, descripción e imagen) para las
  vistas previas al compartir el enlace, usando `public/og-image.png`.

### Corregido

- El túnel VPN morado no aparecía al cambiar a modo VPN cuando el flujo tenía
  nodos agregados a mano (por ejemplo un Atacante MitM). Ahora el nodo VPN se
  inserta o se quita sobre el grafo existente sin perder los demás nodos.

### Cambiado

- Las traducciones ahora viven en un archivo JSON por idioma dentro de
  `src/locales/` (`es.json`, `pt.json`). `src/i18n.tsx` quedó solo con la lógica
  (carga de idiomas, interpolación de variables y contexto). Las variables en las
  cadenas van entre llaves: `{label}`, `{next}`, `{start}`, etc.
- El selector de idioma muestra el código abreviado del idioma activo (`ES`,
  `PT`) en lugar de un icono.

## [1.0.0] - 2026-06-06

### Añadido

- Soporte multiidioma con selector en la barra superior. Idiomas iniciales:
  español y portugués. La arquitectura está pensada para sumar más idiomas,
  incluidas lenguas indígenas.
- Exportación del lienzo como imagen PNG.
- Manual de uso y sección "Acerca de" (proyecto de código abierto, enlace a
  GitHub y correo de contacto).
- Modo taller: botón **Desordenar** que reparte las piezas sin conexiones para
  que el grupo arme el flujo por su cuenta.

### Cambiado

- La VPN se representa como una computadora de confianza ubicada en alguna parte
  del mundo, con ciudad y país visibles en el nodo.
- Se reemplazó la exportación a JSON por la exportación a imagen PNG.

### Corregido

- El nodo VPN no aparecía al cambiar a modo VPN cuando el flujo se había generado
  antes con Auto-Armado.
- El tooltip de un nodo quedaba oculto detrás del encabezado cuando el nodo estaba
  pegado al borde superior del lienzo; ahora se voltea hacia abajo.

## [0.0.1]

### Añadido

- Versión inicial: lienzo con zoom y arrastrar/soltar, inventario de nodos y
  herramientas, conexiones por arrastre, simulación animada del paquete, cuatro
  modos de seguridad (Básico / HTTPS / E2EE / VPN), inspector DPI, interceptación
  MitM, telemetría y log técnico.
