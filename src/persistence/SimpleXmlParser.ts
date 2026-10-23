import { EditorError } from "../errors/EditorError.js";
import type { XmlElement } from "./XmlElement.js";

export class SimpleXmlParser {
  public parse(xml: string): XmlElement {
    const rootHolder: XmlElement = { name: "#document", attributes: new Map(), children: [], text: "" };
    const stack: XmlElement[] = [rootHolder];
    const tokenPattern = /<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<![^>]*>|<[^>]+>|[^<]+/g;
    for (const match of xml.matchAll(tokenPattern)) {
      const token = match[0];
      if (token.startsWith("<!--") || token.startsWith("<?") || token.startsWith("<!")) continue;
      if (token.startsWith("</")) {
        const closingName = token.slice(2, -1).trim().split(":").at(-1);
        const current = stack.pop();
        if (!current || current === rootHolder || current.name !== closingName) {
          throw new EditorError("invalid SVG: mismatched closing tag");
        }
        continue;
      }
      if (token.startsWith("<")) {
        const selfClosing = /\/\s*>$/.test(token);
        const inside = token.slice(1, selfClosing ? token.lastIndexOf("/") : -1).trim();
        const separator = inside.search(/\s/);
        const rawName = separator < 0 ? inside : inside.slice(0, separator);
        const name = rawName.split(":").at(-1) ?? rawName;
        const attributeSource = separator < 0 ? "" : inside.slice(separator + 1);
        const element: XmlElement = {
          name,
          attributes: this.parseAttributes(attributeSource),
          children: [],
          text: "",
        };
        const parent = stack.at(-1);
        if (!parent) throw new EditorError("invalid SVG structure");
        parent.children.push(element);
        if (!selfClosing) stack.push(element);
        continue;
      }
      const current = stack.at(-1);
      if (current) current.text += this.decodeEntities(token);
    }
    if (stack.length !== 1) throw new EditorError("invalid SVG: unclosed tag");
    if (rootHolder.children.length !== 1 || rootHolder.children[0]?.name !== "svg") {
      throw new EditorError("invalid SVG: expected one <svg> root element");
    }
    return rootHolder.children[0];
  }

  private parseAttributes(source: string): Map<string, string> {
    const attributes = new Map<string, string>();
    const pattern = /([:\w-]+)\s*=\s*("[^"]*"|'[^']*')/g;
    let consumed = "";
    for (const match of source.matchAll(pattern)) {
      const name = match[1];
      const quoted = match[2];
      if (!name || !quoted) continue;
      attributes.set(name, this.decodeEntities(quoted.slice(1, -1)));
      consumed += match[0];
    }
    const compactSource = source.replace(/\s/g, "");
    const compactConsumed = consumed.replace(/\s/g, "");
    if (compactSource !== compactConsumed) throw new EditorError("invalid SVG attribute syntax");
    return attributes;
  }

  private decodeEntities(value: string): string {
    return value
      .replaceAll("&quot;", '"')
      .replaceAll("&apos;", "'")
      .replaceAll("&lt;", "<")
      .replaceAll("&gt;", ">")
      .replaceAll("&amp;", "&");
  }
}
