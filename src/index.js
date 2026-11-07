/**
 * Public entry point for synchronous-grammar-highlighter.
 *
 * Re-exports the scanner and the token/production types so consumers can
 * import everything from one place.
 */
export { Production, Token, scan, highlight } from './core.js';
