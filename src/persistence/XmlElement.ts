export interface XmlElement {
  name: string;
  attributes: Map<string, string>;
  children: XmlElement[];
  text: string;
}
