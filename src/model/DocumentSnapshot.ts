import type { Shape } from "./shapes/Shape.js";

export interface DocumentSnapshot {
  width: number;
  height: number;
  sourcePath: string | null;
  roots: Shape[];
}
