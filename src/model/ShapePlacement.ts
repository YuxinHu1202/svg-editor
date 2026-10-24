import type { Shape } from "./shapes/Shape.js";

export interface ShapePlacement {
  shape: Shape;
  parentId: string | null;
  index: number;
}
