import {XSelection, XText} from './XSelection';
import {StringUtils} from './StringUtils';
import {NodeUtils} from './NodeUtils';
import {ITextRange} from './texton';

export class XDocument {
  public static from(root: Element = document.body): XDocument {
    return new XDocument(root);
  }

  public readonly nodes: XText[];
  public readonly text: string;
  public readonly doc: Document;
  public readonly win: Window;
  public readonly root: Element;
  private selection: XSelection | null = null;

  constructor(root: Element) {
    this.root = root;
    this.doc = (root instanceof Document ? root : root.ownerDocument)!;
    this.win = this.doc.defaultView!;
    const {text, nodes} = this.prepare(root);
    this.text = text;
    this.nodes = nodes;
  }

  /**
   * @see {@code XSelection.fromText}
   */
  public select(optText?: string, optNth: number = 1, optSelect: boolean = false): XSelection | null {
    if (optText && optText!.trim()) {
      if (this.selection && !this.selection.isEmpty()) {
        this.selection.cancel();
        this.selection.selection.empty();
      }
      this.selection = this.fromText(optText.trim(), optNth);
    } else {
      let selection = this.win.getSelection()!;
      if (selection) {
        this.selection = this.fromSelection(selection);
      }
    }
    return this.selection;
  }

  /**
   * @see {@code XSelection.fromSelection}
   */
  public fromSelection(selection: Selection): XSelection | null {
    return this.selection = XSelection.fromSelection(selection, this);
  }

  /**
   * @see {@code XSelection.fromText}
   */
  public fromText(text: string, nth: number = 1, optSelect: boolean = false): XSelection | null {
    return this.selection = XSelection.fromText(text, nth, optSelect, this);
  }

  /**
   * @see {@code XSelection.fromTextRange}
   */
  public fromTextRange(range: ITextRange, optSelect: boolean = false): XSelection | null {
    return this.selection = XSelection.fromTextRange(range, optSelect, this);
  }

  private prepare(root: Element): { text: string; nodes: XText[] } {
    const texts: XText[] = NodeUtils.getValidTextNodes(root);
    let position = 0;
    let xText: string = '';
    texts.forEach((node: XText) => {
      node.startPosition = position;
      const cText = StringUtils.compact(node.data);
      xText += cText;
      position += cText.length;
      node.endPosition = position - 1;
    });
    return {text: xText, nodes: texts};
  }

  public normalize(): void {
    this.root.normalize();
    let end = 0;
    this.nodes.reverse().forEach((node, index) => {
      if (!node.parentNode) {
        end = node.endPosition;
        this.nodes.splice(this.nodes.length - index, 1);
      } else if (end > 0) {
        node.endPosition = end;
      }
    });
  }
}
