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

  public getTextNodes(): Text[] {
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

    const bTexts = this.xDocument.getNodes() as Array<XText>;
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

    const content: string = this.xDocument.getText().substr(0, eContainer.startPosition + cLength);
    const occurrences: IOccurrence[] = StringUtils.find(content, cText);
    if (occurrences && occurrences.length > 0) {
      return occurrences[occurrences.length - 1];
    }
    return None;
  }

  public getContent(): string {
    return this.range.toString();
  }

  public getSelection(): Selection {
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
    const selection: Selection = this.getSelection();
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

    const bTexts: XText[] = this.xDocument.getNodes() as XText[];
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
