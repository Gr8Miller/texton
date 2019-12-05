import {XSelection, XText} from './XSelection';
import {StringUtils} from './StringUtils';
import {NodeUtils} from './NodeUtils';
import {ITextIndex, ITextRange} from './texton';

export class XDocument {
  public static from(root: Element = document.body): XDocument {
    return new XDocument(root);
  }

  public nodes!: XText[];
  public text!: string;
  public readonly doc: Document;
  public readonly win: Window;
  public readonly root: Element;
  private selection: XSelection | null = null;

  constructor(root: Element) {
    this.root = root;
    this.doc = (root instanceof Document ? root : root.ownerDocument)!;
    this.win = this.doc.defaultView!;
    this.refresh();
  }

  public refresh() {
    const nodes: XText[] = NodeUtils.getValidTextNodes(this.root) as Array<XText>;
    let position = 0;
    let text: string = '';
    nodes.forEach((node: XText) => {
      node.startPosition = position;
      const nodeText = StringUtils.compact(node.data);
      text += nodeText;
      position += nodeText.length;
      node.endPosition = position - 1;
    });
    this.text = text;
    this.nodes = nodes;
  }

  /**
   * @see {@code XSelection.fromText}
   */
  public select(optText?: string, optNth: number = 1, optSelect: boolean = false): XSelection | null {
    if (optText && optText!.trim()) {
      if (this.selection && !this.selection.isEmpty()) {
        this.selection.empty();
      }
      this.selection = this.fromText(optText.trim(), optNth, optSelect);
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
    return this.selection = this.fromTextIndex({text, nth}, optSelect);
  }

  /**
   * @see {@code XSelection.fromText}
   */
  public fromTextIndex(index: ITextIndex, optSelect: boolean = false): XSelection | null {
    return this.selection = XSelection.fromText(index, optSelect, this);
  }

  /**
   * @see {@code XSelection.fromTextRange}
   */
  public fromTextRange(range: ITextRange, optSelect: boolean = false): XSelection | null {
    return this.selection = XSelection.fromTextRange(range, optSelect, this);
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
