# Extensión de exportación de pendientes Zajuna

Extensión para Google Chrome (Manifest V3) que agrega un botón fijo en la vista de calificaciones de Zajuna para exportar a Excel las actividades tipo **Evidencia** con pendientes por calificar.

## Características
- Se ejecuta automáticamente en `https://zajuna.sena.edu.co/zajuna/grade/report/user/index.php?id=*`.
- Detecta las fases (Fase 1, Fase 2, etc.) en la página y permite elegir cuál exportar.
- Recorre las actividades **Evidencia** de la fase seleccionada, abre cada URL en un iframe oculto y lee el número de "Pendientes por calificar".
- Solo incluye en el Excel las actividades con pendientes mayores a 0.
- Genera el archivo `zajuna_pendientres_calificar.xlsx` con las columnas Actividad, URL y Pendientes por calificar.
- Muestra mensajes de progreso y continúa el proceso aunque alguna actividad falle.

## Archivos
- `manifest.json`: configuración del plugin (permisos, URL objetivo y scripts).
- `content.js`: lógica del content script, interfaz del botón y modal, extracción de datos y generación del Excel.
- `xlsx.full.min.js`: versión minificada de SheetJS usada para crear el archivo Excel.

## Uso
1. Carga la extensión en modo desarrollador en Chrome apuntando a la carpeta del proyecto.
2. Visita la página de calificaciones de un curso en Zajuna.
3. Pulsa **Exportar pendientes por fase**, elige la fase deseada y presiona **Iniciar exportación**.
