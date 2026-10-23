import type { SvgDocument } from "../model/SvgDocument.js";

export interface Command {
  execute(document: SvgDocument): string;
  undo(document: SvgDocument): string;
  redo(document: SvgDocument): string;
}
