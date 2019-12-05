export {XText, XSelection} from './XSelection';
export {XDocument} from './XDocument';
export {NodeUtils} from './NodeUtils';

export interface ITextIndex {
  nth: number;
  text: string;
  position?: number
}

export namespace ITextIndex {
  export const None: ITextIndex = {
    nth: -1,
    position: -1,
    text: '',
  };
}

export interface ITextRange {
  start: ITextIndex,
  end: ITextIndex,
}

export namespace ITextRange {
  export const None: ITextRange = {
    start: {text: '', nth: -1},
    end: {text: '', nth: -1},
  };

  export function toSimpleString(range: ITextRange): string {
    return JSON.stringify([`${range.start.nth}:${range.start.text}`, `${range.end.nth}:${range.end.text}`]);
  }

  export function fromSimpleString(str: string): ITextRange {
    const simple: [string, string] = JSON.parse(str);
    const from = simple[0].split(':', 2);
    const to = simple[1].split(':');
    return {
      start: {text: from[1], nth: parseInt(from[0], 10)},
      end: {text: to[1], nth: parseInt(to[0], 10)}
    }
  }
}
