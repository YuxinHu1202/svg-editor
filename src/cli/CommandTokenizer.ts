import { EditorError } from "../errors/EditorError.js";

export class CommandTokenizer {
  public tokenize(line: string): string[] {
    const tokens: string[] = [];
    let current = "";
    let quoted = false;

    for (const character of line.trim()) {
      if (character === '"') {
        quoted = !quoted;
      } else if (/\s/.test(character) && !quoted) {
        if (current) {
          tokens.push(current);
          current = "";
        }
      } else {
        current += character;
      }
    }
    if (quoted) throw new EditorError("unterminated quoted string");
    if (current) tokens.push(current);
    return tokens;
  }
}
