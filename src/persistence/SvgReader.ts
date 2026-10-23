import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { EditorError } from "../errors/EditorError.js";
import { ShapeFactory } from "../model/ShapeFactory.js";
import { SvgDocument } from "../model/SvgDocument.js";
import { GroupShape } from "../model/shapes/GroupShape.js";
import type { Shape } from "../model/shapes/Shape.js";
import { SimpleXmlParser } from "./SimpleXmlParser.js";
import type { SvgReadResult } from "./SvgReadResult.js";
import type { XmlElement } from "./XmlElement.js";

export class SvgReader {
  public constructor(
    private readonly parser = new SimpleXmlParser(),
    private readonly factory = new ShapeFactory(),
  ) {}

  public read(path: string): SvgReadResult {
    let xml: string;
    try {
      xml = readFileSync(path, "utf8");
    } catch {
      throw new EditorError(`cannot read file: ${path}`);
    }

    const root = this.parser.parse(xml);
    const width = this.dimension(root, "width");
    const height = this.dimension(root, "height");
    const document = new SvgDocument(width, height);
    document.sourcePath = resolve(path);
    const warnings: string[] = [];
    const usedIds = this.collectExplicitIds(root.children);
    const counters = new Map<string, number>();

    for (const child of root.children) {
      document.add(this.buildShape(child, usedIds, counters, warnings));
    }
    return { document, warnings };
  }

  private buildShape(
    element: XmlElement,
    usedIds: Set<string>,
    counters: Map<string, number>,
    warnings: string[],
  ): Shape {
    let id = element.attributes.get("id");
    if (!id) {
      id = this.nextId(element.name, usedIds, counters);
      warnings.push(`warning: assigned id ${id} to unnamed <${element.name}>`);
      usedIds.add(id);
    }

    const shape = this.factory.createFromSvg(element.name, id, element.attributes, element.text);
    if (shape instanceof GroupShape) {
      for (const child of element.children) {
        shape.addChild(this.buildShape(child, usedIds, counters, warnings));
      }
    } else if (element.children.length > 0) {
      throw new EditorError(`invalid SVG: <${element.name}> cannot contain shapes`);
    }
    return shape;
  }

  private nextId(type: string, usedIds: Set<string>, counters: Map<string, number>): string {
    let counter = counters.get(type) ?? 0;
    let candidate: string;
    do {
      counter += 1;
      candidate = `${type}${counter}`;
    } while (usedIds.has(candidate));
    counters.set(type, counter);
    return candidate;
  }

  private collectExplicitIds(elements: readonly XmlElement[]): Set<string> {
    const ids = new Set<string>();
    const visit = (element: XmlElement): void => {
      const id = element.attributes.get("id");
      if (id) {
        if (ids.has(id)) throw new EditorError(`id already exists: ${id}`);
        ids.add(id);
      }
      for (const child of element.children) visit(child);
    };
    for (const element of elements) visit(element);
    return ids;
  }

  private dimension(root: XmlElement, name: string): number {
    const raw = root.attributes.get(name);
    if (!raw) throw new EditorError(`invalid SVG: missing ${name}`);
    const value = Number(raw.replace(/px$/i, ""));
    if (!Number.isFinite(value) || value <= 0) throw new EditorError(`invalid SVG ${name}: ${raw}`);
    return value;
  }
}
