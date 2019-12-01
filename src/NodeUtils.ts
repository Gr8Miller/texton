import {XText} from './XSelection';
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

  public static getTextNodesBetween(root: Node, startNode: Text, endNode: Text): Array<Text> {
    const nodes = NodeUtils.getValidTextNodes(root);
    const si = nodes.indexOf(startNode);
    const ei = nodes.indexOf(endNode);
    return nodes.slice(si, ei + 1);
  }

  public static getValidTextNode(node: Node): XText | null {
    if (node.nodeType === 3 && /\S/.test((node as Text).data)) {
      return node as XText;
    } else if (node.nodeType === 1 && !NodeUtils.isSkippable(node as Element)) {
      for (let i = 0, len = node.childNodes.length; i < len; ++i) {
        const valid = NodeUtils.getValidTextNode(node.childNodes[i]);
        if (valid) {
          return valid;
        }
      }
    }
    return NodeUtils.getValidTextNode(node.nextSibling!);
  }

  public static getValidTextNodes(node: Node): Text[] {
    if (node.nodeType === 3 && /\S/.test((node as Text).data)) {
      return [node as Text];
    } else if (node.nodeType === 1 && !NodeUtils.isSkippable(node as Element)) {
      return Array.from(node.childNodes).reduce((nodes: Text[], child: Node) => {
        return nodes.concat(NodeUtils.getValidTextNodes(child));
      }, []);
    }
    return [];
  }

  private static isSkippable(node: Element): boolean {
    return NodeUtils.elementsToSkip.test(node, null);
  }

  public static split(text: XText, offset: number): XText {
    const rp: XText = text.splitText(offset) as XText;
    rp.startPosition = text.startPosition + StringUtils.compact(text.data).length;
    rp.endPosition = text.endPosition;
    text.endPosition = rp.startPosition - 1;
    return rp;
  }
}
