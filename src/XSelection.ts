import {StringUtils} from './StringUtils';
import {XDocument} from './XDocument';
import {IOccurrence, ITextRange} from './texton';
import RangeUtils from './RangeUtils';

export interface XText extends Text {
  startPosition: number;
  endPosition: number;
}

export class XSelection {
  public readonly range: Range;
  private readonly xdoc: XDocument;
  private texts: Text[] | undefined;

  constructor(range: Range, xDocument: XDocument) {
    this.range = range;
    this.xdoc = xDocument;
  }

  /**
   * create {@link XSelection} from native {@link Selection}
   * @param selection the native `Selection` from which to create the `XSelection` instance.
   * @param xDoc the context of the to be created `XSelection` instance.
   */
  public static fromSelection(selection: Selection, xDoc: XDocument): XSelection | null {
    const range: Range | null = XSelection.rangeFromSelection(selection, xDoc);
    return XSelection.fromRange(range, false, xDoc);
  }

  /**
   * create {@link XSelection} from {@link ITextRange} pojo;
   * {@link ITextRange} specifies the start point and end point
   * <pre>
   * export interface ITextRange {
   *   from: { text: string, nth: number }, // means starting from the `nth` `text`
   *   to: { text: string, nth: number }, // means ending at the `nth` `text`
   * }
   * </pre>
   * @param textRange the serialized pojo from which to create the `XSelection` instance.
   * @param optSelect true to create explicit selection(be selected visibly from browser), false otherwise
   * @param xDoc the context of the to be created `XSelection` instance.
   */
  public static fromTextRange(textRange: ITextRange, optSelect: boolean = false, xDoc: XDocument): XSelection | null {
    xDoc.refresh();
    const range: Range | null = XSelection.rangeFromTextRange(textRange, xDoc);
    return XSelection.fromRange(range, optSelect, xDoc);
  }

  /**
   * create {@link XSelection} from {@link ITextRange} pojo
   * @param text the text content to be selected.
   * @param nth together with {@param text} specifies the exact {@code nth} {@code text} will be used to create the selection.
   * @param optSelect true to create explicit selection(be selected visibly from browser), false otherwise
   * @param xDoc the context of the to be created `XSelection` instance.
   */
  public static fromText(text: string, nth: number = 1, optSelect: boolean = false, xDoc: XDocument): XSelection | null {
    xDoc.refresh();
    const range: Range | null = XSelection.rangeFromText(text, nth, xDoc);
    return XSelection.fromRange(range, optSelect, xDoc);
  }

  /**
   * create {@link XSelection} from native {@link Range}
   * @param range the text content to be selected.
   * @param optSelect true to create selection explicitly(be selected visibly from browser), false otherwise
   * @param xDoc the context of the to be created `XSelection` instance.
   */
  public static fromRange(range: Range | null, optSelect: boolean = false, xDoc: XDocument): XSelection | null {
    if (range) {
      range = RangeUtils.trim(range);
      if (optSelect) {
        const selection: Selection | null = xDoc.win.getSelection();
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
      return new XSelection(range, xDoc);
    }
    return null;
  }

  private static rangeFromSelection(selection: Selection, xDoc: XDocument): Range | null {
    if (selection.rangeCount > 0 && !selection.isCollapsed) {
      return selection.getRangeAt(0);
    }
    return null;
  }

  private static rangeFromTextRange(textRange: ITextRange, xDoc: XDocument): Range | null {
    const head = XSelection.rangeFromText(textRange.from.text, textRange.from.nth, xDoc);
    const tail = XSelection.rangeFromText(textRange.to.text, textRange.to.nth, xDoc);
    if (head && tail) {
      const range: Range = xDoc.doc.createRange();
      range.setStart(head.endContainer, head.endOffset);
      range.setEnd(tail.endContainer, tail.endOffset);
      return range;
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
   * @param {XDocument} xDoc
   * @return {Range} the range created that contains the specified text
   * @private
   */
  private static rangeFromText(text: string, nth: number = 1, xDoc: XDocument): Range | null {
    const nodes: XText[] = xDoc.nodes;
    const cText: string = StringUtils.compact(text);
    const index: number = StringUtils.indexOf(xDoc.text, cText, nth || 1);
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

        const range: Range = xDoc.doc.createRange();
        range.setStart(sContainer, sOffset);
        range.setEnd(eContainer, eOffset + 1);
        return range;
      }
    }
    return null;
  }

  public trim() {
    RangeUtils.trim(this.range);
    const selection: Selection | null = this.xdoc.win.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(this.range);
    }
  }

  /**
   * the text nodes contained in the selection.
   * <em>
   * text node will be splatted into 2 parts if the selection is start from/end in a internal
   * position of a text node
   * </em>
   */
  public getTextNodes(): Text[] {
    if (this.texts) {
      return this.texts;
    }
    this.texts = RangeUtils.getTextNodes(this.range);
    return this.texts;
  }

  /**
   * get the exact "occurrence" of this selection.
   * <em>
   *   the selected text content may appear >=1 times in this page, and the selection is it's
   *   {@code occurrence.nth} time. and the start char of this selection is the
   *   {@code occurrence.position}th char of the whole text content in this page.
   * </em>
   *
   */
  public getOccurrence(): IOccurrence {
    const cText: string = StringUtils.compact(this.range.toString());
    if (cText.length < 1) {
      return IOccurrence.None;
    }

    const temp: Range = this.xdoc.doc.createRange();
    temp.setStart(this.xdoc.root, 0);
    temp.setEnd(this.range.endContainer, this.range.endOffset);
    const content: string = StringUtils.compact(temp.toString());
    const occurrences: IOccurrence[] = StringUtils.find(content, cText);
    if (occurrences && occurrences.length > 0) {
      return occurrences[occurrences.length - 1];
    }
    return IOccurrence.None;
  }

  /**
   * get the text range of the selection in this page.
   * <pre>
   * export interface ITextRange {
   *   from: { text: string, nth: number }, // means starting from the `nth` `text`
   *   to: { text: string, nth: number }, // means ending at the `nth` `text`
   * }
   * </pre>
   * that is, the text content of this selection starts with {@code textRange.from.text} and
   * ends with {@code textRange.to.text}. and {@code textRange.from.text} is its {@code textRange.from.nth}
   * occurrence, {@code textRange.to.text} is its {@code textRange.to.nth} occurrence.
   * e.g.
   * for text
   * <span>hello world, hello miller, hello world, hello miller, hello miller</span>
   * <pre>
   * {
   *   from:{text: 'hello', nth: 2}
   *   to:{text: 'miller', nth: 3}
   * }
   * means, the selection starts from the 2nd `hello` and ends with 3rd `miller`. that is:
   * <span>hello world, <selected>hello miller, hello world, hello miller, hello miller<selected>, hello world<span>
   * </pre>
   *
   * @param len
   */
  public getTextRange(len: number = 5): ITextRange {
    const cText: string = StringUtils.compact(this.range.toString());
    if (cText.length < 1) {
      return ITextRange.None;
    }

    const temp: Range = this.xdoc.doc.createRange();
    temp.setStart(this.xdoc.root, 0);

    temp.setEnd(this.range.endContainer, this.range.endOffset);
    const eContent: string = StringUtils.compact(temp.toString());
    const eText = eContent.length > len ? eContent.substr(eContent.length - len, len) : eContent;
    const eOccurs: IOccurrence[] = StringUtils.find(eContent, eText);

    temp.setEnd(this.range.startContainer, this.range.startOffset);
    const sContent: string = StringUtils.compact(temp.toString());
    const sText = sContent.length > len ? sContent.substr(sContent.length - len, len) : sContent;
    const sOccurs: IOccurrence[] = StringUtils.find(sContent, sText);

    // const sContainer = this.range.startContainer as Text;
    // if (sContainer.nodeType !== 3) {
    //   sContainer = NodeUtils.getValidTextNode(sContainer)!;
    // }
    // const sText = cText.length > 5 ? cText.substr(0, 5) : cText;
    // const cHead: string = StringUtils.compact(sContainer.substringData(0, this.range.startOffset));
    // const cLength = cHead.length + sText.length;
    // const sOffset = StringUtils.indexOfNthNotEmptyChar(this.range.toString(), cLength);
    // temp.setEnd(sContainer, sOffset);
    // const sContent: string = StringUtils.compact(temp.toString());
    // const sOccurs: IOccurrence[] = StringUtils.find(sContent, sText);

    if (sOccurs && sOccurs.length > 0 && eOccurs && eOccurs.length > 0) {
      return {
        from: {text: sText, nth: sOccurs[sOccurs.length - 1].nth},
        to: {text: eText, nth: eOccurs[eOccurs.length - 1].nth}
      }
    }
    return ITextRange.None;
  }

  /**
   * get the selected text content
   * @param compact true to remove the white spaces. false otherwise
   */
  public getContent(compact: boolean = false): string {
    if (compact) {
      return StringUtils.compact(this.range.toString());
    }
    return this.range.toString();
  }

  /**
   * get the native selection
   */
  public get selection(): Selection {
    const selection: Selection = this.xdoc.win.getSelection()!;
    if (selection.rangeCount < 1) {
      selection.addRange(this.range);
    }
    return selection;
  }

  /**
   * clear the selection
   */
  public empty(): void {
    if (!this.texts || this.texts.length < 1) {
      return;
    }
    const first: Text = this.range.startContainer as Text;
    const last: Text = this.range.endContainer as Text;
    if (first && first.parentNode) {
      first.parentNode.normalize();
    }
    if (last && last.parentNode) {
      last.parentNode.normalize();
    }

    this.range.collapse();
    this.texts = [];
    const selection: Selection = this.xdoc.win.getSelection()!;
    selection.collapseToStart();
    selection.empty && selection.empty();
    selection.removeAllRanges && selection.removeAllRanges();
  }

  /**
   * check if the selection is cleared or not.
   */
  public isEmpty(): boolean {
    const selection: Selection = this.selection;
    return selection.rangeCount < 1 || selection.isCollapsed || this.range.collapsed;
  }
}
