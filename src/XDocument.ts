import {XText, XSelection} from './XSelection';
import {StringUtils} from './StringUtils';
import {NodeUtils} from './NodeUtils';

export class SelectionEvent {
  public static from(selection: XSelection) {
    return new CustomEvent('x-selection', {
      detail: {selection},
      bubbles: true,
      cancelable: false,
    })
  }
}

export class XDocument {
  public static from(root: Element = document.body): XDocument {
    return new XDocument(root);
  }

  private readonly nodes: XText[];
  private readonly text: string;
  private readonly doc: Document;
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
    this.init();
  }

  private init() {
    this.root.addEventListener('mouseup', () => {
      let selection = this.win.getSelection();
      if (selection && !selection.isCollapsed) {
        this.selection = this.select();
        if (this.selection && this.selection.getOccurrence().nth >= 0) {
          this.root.dispatchEvent(SelectionEvent.from(this.selection));
        }
      }
    });
  }

  /**
   * @param {string=} optText
   * @param {number=1} optNth
   * @param {boolean=false} optSelect = false whether to select the range
   * @return {XSelection}
   */
  public select(optText?: string, optNth: number = 1, optSelect: boolean = false): XSelection | null {
    if (optText && optText!.trim()) {
      if (this.selection && !this.selection.isEmpty()) {
        this.selection.cancel();
        this.selection.getSelection().empty();
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

  private fromSelection(selection: Selection): XSelection | null {
    let range: Range = this.doc.createRange();
    if (selection.rangeCount > 0 && !selection.isCollapsed) {
      range = selection.getRangeAt(0);
      return new XSelection(range, this);
    }
    return null;
  }

  private fromText(text: string, nth: number = 1, optSelect: boolean = false): XSelection | null {
    let range: Range | null = this.rangeFrom_(text, nth);
    if (range) {
      if (optSelect) {
        const selection: Selection | null = this.win.getSelection();
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
      return new XSelection(range, this);
    }
    return null;
  }

  /**
   *  return an empty range object that has both of its boundary points positioned at
   *  the beginning of the document when no parameters are given, else return an range
   *  object that contains the nth occurrence of the specified text
   *
   * @param {string} text the base text
   * @param {number} nth = 1 the nth index
   * @return {Range} the range created that contains the specified text
   * @private
   */
  private rangeFrom_(text: string, nth: number = 1): Range | null {

    const nodes: XText[] = this.nodes;
    const cText: string = StringUtils.compact(text);
    const index: number = StringUtils.indexOf(this.text, cText, nth || 1);
    if (index > -1) {
      const sPos: number = index + nodes[0].startPosition; // include the first character
      const ePos: number = sPos + cText.length; // exclude the last character

      const sIndex = nodes.findIndex((node: XText) => node.endPosition >= sPos);
      const eIndex = nodes.findIndex((node: XText) => node.startPosition >= ePos) - 1;
      const sContainer = nodes[sIndex];
      const eContainer = eIndex >= 0 ? nodes[eIndex] : nodes[nodes.length - 1];
      if (sContainer) {
        const sOffset = StringUtils.indexOfNthNotEmptyChar(sContainer.data, sPos - sContainer.startPosition);
        const eOffset = StringUtils.indexOfNthNotEmptyChar(eContainer.data, ePos - eContainer.startPosition - 1);

        const range: Range = this.doc.createRange();
        range.setStart(sContainer, sOffset);
        range.setEnd(eContainer, eOffset + 1);
        return range;
      }
    }
    return null;
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

  public getNodes(): Text[] {
    return this.nodes;
  }

  public getText(): string {
    return this.text;
  }
}
