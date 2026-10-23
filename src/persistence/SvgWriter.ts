import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { EditorError } from "../errors/EditorError.js";
import type { SvgDocument } from "../model/SvgDocument.js";

export class SvgWriter {
  public write(document: SvgDocument, requestedPath?: string): string {
    const path = requestedPath ?? document.sourcePath;
    if (!path) throw new EditorError("cannot write file: no path specified");
    try {
      writeFileSync(path, document.toSvg(), "utf8");
    } catch {
      throw new EditorError(`cannot write file: ${path}`);
    }
    const absolutePath = resolve(path);
    document.sourcePath = absolutePath;
    return requestedPath ?? absolutePath;
  }
}
