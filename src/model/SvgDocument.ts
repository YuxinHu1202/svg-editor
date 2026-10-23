import { EditorError } from "../errors/EditorError.js";
import type { DocumentSnapshot } from "./DocumentSnapshot.js";
import { GroupShape } from "./shapes/GroupShape.js";
import type { Shape } from "./shapes/Shape.js";

export class SvgDocument {
  private rootShapes: Shape[] = [];
  private sourcePathValue: string | null = null;

  public constructor(
    private widthValue = 800,
    private heightValue = 600,
  ) {
    this.validateCanvas(widthValue, heightValue);
  }

  public get width(): number {
    return this.widthValue;
  }

  public get height(): number {
    return this.heightValue;
  }

  public get sourcePath(): string | null {
    return this.sourcePathValue;
  }

  public set sourcePath(path: string | null) {
    this.sourcePathValue = path;
  }

  public get roots(): readonly Shape[] {
    return this.rootShapes;
  }

  public setCanvas(width: number, height: number): void {
    this.validateCanvas(width, height);
    this.widthValue = width;
    this.heightValue = height;
  }

  public add(shape: Shape, containerId?: string): void {
    this.validateNewSubtree(shape);
    if (containerId === undefined) {
      shape.setParent(null);
      this.rootShapes.push(shape);
      return;
    }
    const container = this.requireContainer(containerId);
    container.addChild(shape);
  }

  public requireShape(id: string): Shape {
    const shape = this.find(id);
    if (!shape) throw new EditorError(`no such shape: ${id}`);
    return shape;
  }

  public requireContainer(id: string): GroupShape {
    const shape = this.find(id);
    if (!shape) throw new EditorError(`no such container: ${id}`);
    if (!(shape instanceof GroupShape)) throw new EditorError(`not a container: ${id}`);
    return shape;
  }

  public find(id: string): Shape | undefined {
    return this.flatten().find((shape) => shape.id === id);
  }

  public delete(id: string): Shape {
    const shape = this.requireShape(id);
    this.detach(shape);
    return shape;
  }

  public group(newId: string, ids: string[]): GroupShape {
    if (ids.length === 0) throw new EditorError("usage: group <newGid> <id1> <id2>…");
    this.validateId(newId);
    if (this.find(newId)) throw new EditorError(`id already exists: ${newId}`);
    if (new Set(ids).size !== ids.length) throw new EditorError("group targets must be unique");

    const targets = ids.map((id) => this.requireShape(id));
    for (const candidate of targets) {
      if (!(candidate instanceof GroupShape)) continue;
      for (const other of targets) {
        if (candidate !== other && candidate.containsDescendant(other)) {
          throw new EditorError(`cannot group a container into its own descendant: ${candidate.id}`);
        }
      }
    }

    const documentOrder = this.flatten();
    targets.sort((left, right) => documentOrder.indexOf(left) - documentOrder.indexOf(right));
    const first = targets[0];
    if (!first) throw new EditorError("group needs at least one target");
    const destinationParent = first.parent;
    const insertionIndex = this.indexInParent(first);
    for (const target of targets) this.detach(target);

    const group = new GroupShape(newId);
    this.insert(group, destinationParent, insertionIndex);
    for (const target of targets) group.addChild(target);
    return group;
  }

  public ungroup(id: string): number {
    const group = this.requireContainer(id);
    if (group.parent === null) throw new EditorError(`cannot ungroup top-level container: ${id}`);
    const parent = group.parent;
    const index = parent.indexOf(group);
    const children = [...group.children];
    parent.removeChild(group);
    for (let offset = 0; offset < children.length; offset += 1) {
      const child = children[offset];
      if (!child) continue;
      group.removeChild(child);
      parent.addChild(child, index + offset);
    }
    return children.length;
  }

  public addTo(groupId: string, shapeId: string): void {
    const group = this.requireContainer(groupId);
    const shape = this.requireShape(shapeId);
    if (group === shape || (shape instanceof GroupShape && shape.containsDescendant(group))) {
      throw new EditorError(`cannot add a container into its own descendant: ${shapeId}`);
    }
    this.detach(shape);
    group.addChild(shape);
  }

  public bringToFront(id: string): void {
    const shape = this.requireShape(id);
    const parent = shape.parent;
    this.detach(shape);
    this.insert(shape, parent, this.siblingCount(parent));
  }

  public sendToBack(id: string): void {
    const shape = this.requireShape(id);
    const parent = shape.parent;
    this.detach(shape);
    this.insert(shape, parent, 0);
  }

  public snapshot(): DocumentSnapshot {
    return {
      width: this.widthValue,
      height: this.heightValue,
      sourcePath: this.sourcePathValue,
      roots: this.rootShapes.map((shape) => shape.clone()),
    };
  }

  public restore(snapshot: DocumentSnapshot): void {
    this.widthValue = snapshot.width;
    this.heightValue = snapshot.height;
    this.sourcePathValue = snapshot.sourcePath;
    this.rootShapes = snapshot.roots.map((shape) => shape.clone());
    for (const root of this.rootShapes) root.setParent(null);
  }

  public countElements(): number {
    return this.flatten().length;
  }

  public tree(id?: string): string {
    if (id !== undefined) return this.renderSubtree(this.requireShape(id));
    const lines = [`svg (${this.formatNumber(this.widthValue)}x${this.formatNumber(this.heightValue)})`];
    this.appendTreeChildren(lines, this.rootShapes, "");
    return lines.join("\n");
  }

  public show(id: string): string {
    const shape = this.requireShape(id);
    const parent = shape.parent ? `g#${shape.parent.id}` : "svg";
    return [`${shape.type}#${shape.id}  parent=${parent}`, ...shape.detailLines().map((line) => `  ${line}`)].join("\n");
  }

  public toSvg(): string {
    const width = this.formatNumber(this.widthValue);
    const height = this.formatNumber(this.heightValue);
    const children = this.rootShapes.map((shape) => shape.toSvg(1)).join("\n");
    const body = children ? `\n${children}\n` : "\n";
    return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${body}</svg>\n`;
  }

  private validateCanvas(width: number, height: number): void {
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
      throw new EditorError("canvas width and height must be positive");
    }
  }

  private validateId(id: string): void {
    if (!id || /\s/.test(id)) throw new EditorError(`invalid id: ${id}`);
  }

  private validateNewSubtree(shape: Shape): void {
    const currentIds = new Set(this.flatten().map((candidate) => candidate.id));
    const incoming = this.flattenFrom([shape]);
    const incomingIds = new Set<string>();
    for (const candidate of incoming) {
      this.validateId(candidate.id);
      if (currentIds.has(candidate.id) || incomingIds.has(candidate.id)) {
        throw new EditorError(`id already exists: ${candidate.id}`);
      }
      incomingIds.add(candidate.id);
    }
  }

  private flatten(): Shape[] {
    return this.flattenFrom(this.rootShapes);
  }

  private flattenFrom(shapes: readonly Shape[]): Shape[] {
    const result: Shape[] = [];
    for (const shape of shapes) {
      result.push(shape);
      if (shape instanceof GroupShape) result.push(...this.flattenFrom(shape.children));
    }
    return result;
  }

  private detach(shape: Shape): number {
    if (shape.parent) return shape.parent.removeChild(shape);
    const index = this.rootShapes.indexOf(shape);
    if (index < 0) throw new EditorError(`no such shape: ${shape.id}`);
    this.rootShapes.splice(index, 1);
    shape.setParent(null);
    return index;
  }

  private insert(shape: Shape, parent: GroupShape | null, index: number): void {
    if (parent) parent.addChild(shape, index);
    else {
      const boundedIndex = Math.max(0, Math.min(index, this.rootShapes.length));
      this.rootShapes.splice(boundedIndex, 0, shape);
      shape.setParent(null);
    }
  }

  private indexInParent(shape: Shape): number {
    return shape.parent ? shape.parent.indexOf(shape) : this.rootShapes.indexOf(shape);
  }

  private siblingCount(parent: GroupShape | null): number {
    return parent ? parent.children.length : this.rootShapes.length;
  }

  private renderSubtree(shape: Shape): string {
    const lines = [shape.summary()];
    if (shape instanceof GroupShape) this.appendTreeChildren(lines, shape.children, "");
    return lines.join("\n");
  }

  private appendTreeChildren(lines: string[], children: readonly Shape[], prefix: string): void {
    children.forEach((child, index) => {
      const last = index === children.length - 1;
      lines.push(`${prefix}${last ? "└── " : "├── "}${child.summary()}`);
      if (child instanceof GroupShape) {
        this.appendTreeChildren(lines, child.children, `${prefix}${last ? "    " : "│   "}`);
      }
    });
  }

  private formatNumber(value: number): string {
    return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(6)));
  }
}
