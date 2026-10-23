import type { SvgDocument } from "../model/SvgDocument.js";

export interface SvgReadResult {
  document: SvgDocument;
  warnings: string[];
}
