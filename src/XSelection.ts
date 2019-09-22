import {IOccurrence, None, StringUtils} from './StringUtils';
import {XDocument} from './XDocument';
import {NodeUtils} from './NodeUtils';

export interface XText extends Text {
  startPosition: number;
  endPosition: number;
}

export class XSelection {
  public readonly range: Range;
  private readonly xDocument: XDocument;
  private xTexts: XText[] | undefined;

  constructor(range: Range, xDocument: XDocument) {
    this.range = range;
    this.xDocument = xDocument;
  }

  public static fromSelection(selection: Selection, xDoc: XDocument): XSelection | null {
    if (selection.rangeCount > 0 && !selection.isCollapsed) {
      const range = selection.getRangeAt(0);
      return new XSelection(range, xDoc);
    }
    return null;
  }

  public static fromText(text: string, nth: number = 1, optSelect: boolean = false, xDoc: XDocument): XSelection | null {
    let range: Range | null = XSelection.rangeFrom(text, nth, xDoc);
    if (range) {
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
  private static rangeFrom(text: string, nth: number = 1, xDoc: XDocument): Range | null {

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

  public get texts(): Text[] {
    if (this.xTexts) {
      return this.xTexts;
    }

    let sContainer: XText = this.range.startContainer as XText;
    let eContainer: XText = this.range.endContainer as XText;
    let sOffset = this.range.startOffset;
    let eOffset = this.range.endOffset;
    if (sContainer.nodeType !== 3) {
      sContainer = NodeUtils.getValidTextNode(sContainer)!;
    }
    if (eContainer.nodeType !== 3) {
      eContainer = NodeUtils.getValidTextNode(eContainer)!;
    }

    const bTexts = this.xDocument.nodes as Array<XText>;
    const si = bTexts.indexOf(sContainer);
    const srp = NodeUtils.split(sContainer, sOffset);
    if (srp.length > 0) {
      bTexts.splice(si + 1, 0, srp);
    }
    if (eContainer === sContainer) {
      eContainer = srp;
      eOffset = eOffset - sOffset;
    }
    const ei = bTexts.indexOf(eContainer);
    const erp = NodeUtils.split(eContainer, eOffset);
    if (erp.length > 0) {
      bTexts.splice(ei + 1, 0, erp);
    }
    this.xTexts = bTexts.slice(si + 1, ei + 1);
    this.range.setStart(bTexts[si + 1], 0);
    this.range.setEnd(bTexts[ei], bTexts[ei].data.length);
    return this.xTexts;
  }

  public getOccurrence(): IOccurrence {
    const cText: string = StringUtils.compact(this.range.toString());
    if (cText.length < 1) {
      return None;
    }

    let eContainer: XText = this.range.endContainer as XText;
    if (eContainer.nodeType !== 3) {
      eContainer = NodeUtils.getValidTextNode(eContainer)!;
    }
    const offset: number = this.range.endOffset;
    const cHead: string = StringUtils.compact(eContainer.substringData(0, offset));
    const cLength: number = cHead ? cHead.length : 0;

    const content: string = this.xDocument.text.substr(0, eContainer.startPosition + cLength);
    const occurrences: IOccurrence[] = StringUtils.find(content, cText);
    if (occurrences && occurrences.length > 0) {
      return occurrences[occurrences.length - 1];
    }
    return None;
  }

  public getContent(compact: boolean = false): string {
    if (compact) {
      return StringUtils.compact(this.range.toString());
    }
    return this.range.toString();
  }

  public get selection(): Selection {
    const selection: Selection = this.xDocument.win.getSelection()!;
    if (selection.rangeCount < 1) {
      selection.addRange(this.range);
    }
    return selection;
  }

  public empty(): void {
    this.range.collapse();
    const selection: Selection = this.xDocument.win.getSelection()!;
    selection.collapseToStart();
    selection.empty && selection.empty();
    selection.removeAllRanges && selection.removeAllRanges();
  }

  public isEmpty(): boolean {
    const selection: Selection = this.selection;
    return selection.rangeCount < 1 || selection.isCollapsed || this.range.collapsed;
  }

  public cancel(): void {
    const texts = this.xTexts!;
    if (!texts || texts.length < 1) {
      return;
    }
    const first: XText = texts[0];
    const last: XText = texts[texts.length - 1];
    if (first && first.parentNode) {
      first.parentNode.normalize();
    }
    if (last && last.parentNode) {
      last.parentNode.normalize();
    }

    const bTexts: XText[] = this.xDocument.nodes as XText[];
    const fi = bTexts.indexOf(first);
    const li = bTexts.indexOf(last);

    if (li < bTexts.length - 1 && last.nextSibling === bTexts[li + 1]) {
      last.endPosition = bTexts[li + 1].endPosition;
      bTexts.splice(li + 1, 1);
    }
    if (fi > 0 && first.previousSibling === bTexts[fi - 1]) {
      bTexts[fi - 1].endPosition = first.endPosition;
      bTexts.splice(fi, 1);
    }
  }
}
