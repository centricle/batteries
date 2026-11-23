// Ids for SVG defs. A page can draw the same battery twice (the 3D viewer's
// fallback and a tile), and the viewer hides its fallback with display:none
// once WebGL starts. A gradient defined inside a hidden subtree paints
// nothing, including for every other element that references its id, so each
// instance needs its own.
let n = 0;
export const uid = (prefix: string) => `${prefix}-${(++n).toString(36)}`;
