/**
 * Punto único de acceso al paquete compartido.
 * El código de `@protea/shared` se compila dentro de `lib/` en el build,
 * por lo que el deploy de Functions es autocontenido (sin dependencias
 * workspace en runtime).
 */
export * from '../../packages/shared/src/index.js';
