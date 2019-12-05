import {NodeUtils} from './NodeUtils';
import {StringUtils} from './StringUtils';

export default class RangeUtils {
  public static trim(range: Range): Range {
    const oldStart = range.startContainer;
    let newStart = NodeUtils.nextValidTextNode(oldStart, true);
    let newStartOffset = StringUtils.indexOfNthNotEmptyChar(newStart.data, 0);
    if (oldStart === newStart) {
      newStartOffset = Math.max(range.startOffset, newStartOffset);
      if (newStartOffset > StringUtils.indexOfNthNotEmptyCharFromEnd(newStart.data, 0)) {
        // start at the tail of a valid text node
        newStart = NodeUtils.nextValidTextNode(newStart, false);
        newStartOffset = StringUtils.indexOfNthNotEmptyChar(newStart.data, 0);
      } else {
        // start at midden of a valid text node
        const head = newStart.substringData(newStartOffset, newStart.length - newStartOffset);
        // num of whitespaces at head
        const headSpaces = StringUtils.indexOfNthNotEmptyChar(head, 0);
        newStartOffset += headSpaces;// skip whitespaces
      }
    }

    const oldEnd = range.endContainer;
    let newEnd = NodeUtils.prevValidTextNode(oldEnd, true);
    let newEndOffset = StringUtils.indexOfNthNotEmptyCharFromEnd(newEnd.data, 0) + 1;
    if (oldEnd === newEnd) {
      newEndOffset = Math.min(range.endOffset, newEndOffset);
      if (newEndOffset <= StringUtils.indexOfNthNotEmptyChar(newEnd.data, 0)) {
        // end at the head of a valid text node
        newEnd = NodeUtils.prevValidTextNode(newEnd, false);
        newEndOffset = StringUtils.indexOfNthNotEmptyCharFromEnd(newEnd.data, 0) + 1;
      } else {
        // end at midden of a valid text node
        const tail = newEnd.substringData(0, newEndOffset);
        // num of whitespaces at tail
        const tailSpaces = tail.length - 1 - StringUtils.indexOfNthNotEmptyCharFromEnd(tail, 0);
        newEndOffset -= tailSpaces;// skip whitespaces
      }
    }

    range.setStart(newStart, newStartOffset); // start with a non-whitespace char
    range.setEnd(newEnd, newEndOffset); // end with a non-whitespace char
    return range;
  }

  public static extractTextNodes(range: Range): Array<Text> {
    let sContainer: Text = range.startContainer as Text;
    let eContainer: Text = range.endContainer as Text;
    let sOffset = range.startOffset;
    let eOffset = range.endOffset;

    if (eContainer.data.length !== eOffset) {
      eContainer.splitText(eOffset);
    }

    if (sOffset !== 0) {
      const newStartContainer = sContainer.splitText(sOffset);
      if (eContainer === sContainer) {
        eContainer = newStartContainer;
        eOffset = eOffset - sOffset;
      }
      sContainer = newStartContainer;
      sOffset = 0;
    }

    range.setStart(sContainer, sOffset);
    range.setEnd(eContainer, eOffset);

    return NodeUtils.getTextNodesBetween(sContainer, eContainer);
  }
}
