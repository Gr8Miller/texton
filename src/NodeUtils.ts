import {XDocument} from './texton';
import {StringUtils} from './StringUtils';

export class NodeUtils {

  private static readonly elementsToSkip = {
    elements: [
      'applet',
      'area',
      'base',
      'basefont',
      'bdo',
      'button',
      'frame',
      'frameset',
      'iframe',
      'head',
      'hr',
      'img',
      'input',
      'link',
      'map',
      'meta',
      'noframes',
      'noscript',
      'optgroup',
      'option',
      'param',
      'script',
      'select',
      'style',
      'textarea',
      'title',
    ],

    /**
     * @param {Element} node
     * @param {string[]|null} list
     * @return {boolean}
     */
    test(node: Element, list: string[] | null): boolean {
      const elements = list || this.elements;
      return elements.indexOf(node.tagName.toLowerCase()) > -1;
    },
  };

  public static nextValidTextNode(node: Node, including?: boolean): Text {
    node = including ? node : this.nextNode(node);
    while (node) {
      const valid = this.firstValidTextNode(node);
      if (valid) {
        return valid;
      }
      node = this.nextNode(node);
    }
    throw new Error('No Valid Text Node');
  }

  public static prevValidTextNode(node: Node, including?: boolean): Text {
    node = including ? node : this.prevNode(node);
    while (node) {
      const valid = this.lastValidTextNode(node);
      if (valid) {
        return valid;
      }
      node = this.prevNode(node);
    }
    throw new Error('No Valid Text Node');
  }

  private static nextNode(node: Node): Node {
    let next = node.nextSibling as Node;
    while (!next) {
      node = node.parentNode as Node;
      next = node!.nextSibling as Node;
    }
    return next;
  }

  private static prevNode(node: Node): Node {
    let prev = node.previousSibling as Node;
    while (!prev) {
      node = node.parentNode as Node;
      prev = node!.previousSibling as Node;
    }
    return prev;
  }

  public static firstValidTextNode(node: Node): Text | null {
    if (this.isValidTextNode(node)) {
      return node as Text;
    } else if (node.nodeType === 1 && !this.isSkippable(node as Element)) {
      const ordered = Array.from(node.childNodes);
      for (let childNode of ordered) {
        const valid = this.firstValidTextNode(childNode);
        if (valid) {
          return valid;
        }
      }
    }
    return null;
  }

  public static lastValidTextNode(node: Node): Text | null {
    if (this.isValidTextNode(node)) {
      return node as Text;
    } else if (node.nodeType === 1 && !this.isSkippable(node as Element)) {
      const reversed = Array.from(node.childNodes).reverse();
      for (let childNode of reversed) {
        const valid = this.lastValidTextNode(childNode);
        if (valid) {
          return valid;
        }
      }
    }
    return null;
  }

  public static isValidTextNode(node: Node) {
    return node.nodeType === 3 && (node as Text).length > 0 && /\S/.test((node as Text).data);
  }

  public static getTextNodesBetween(startNode: Text, endNode: Text): Array<Text> {
    const result = [];
    let node = startNode;
    result.push(node);
    while (node !== endNode) {
      node = this.nextValidTextNode(node);
      result.push(node);
    }
    return result;
  }

  public static getValidTextNodes(node: Node): Text[] {
    if (this.isValidTextNode(node)) {
      return [node as Text];
    } else if (node.nodeType === 1 && !this.isSkippable(node as Element)) {
      return Array.from(node.childNodes).reduce((nodes: Text[], child: Node) => {
        return nodes.concat(this.getValidTextNodes(child));
      }, []);
    }
    return [];
  }

  public static getContentTo(end: Text, endOffset: number, xdoc: XDocument) {
    const temp: Range = xdoc.doc.createRange();
    temp.setStart(xdoc.root, 0);
    temp.setEnd(end, endOffset);
    return StringUtils.compact(temp.toString());
  }

  private static isSkippable(node: Element): boolean {
    return this.elementsToSkip.test(node, null);
  }
}
