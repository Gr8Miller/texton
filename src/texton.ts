export {XText, XSelection} from './XSelection';
export {XDocument} from './XDocument';
export {NodeUtils} from './NodeUtils';

export interface IOccurrence {
  nth: number;
  position: number;
}

export namespace IOccurrence {
  export const None: IOccurrence = {
    nth: -1,
    position: -1,
  };
}

export interface ITextRange {
  from: { text: string, nth: number },
  to: { text: string, nth: number },
}

export namespace ITextRange {
  export const None: ITextRange = {
    from: {text: '', nth: -1},
    to: {text: '', nth: -1},
  };

  export function toSimpleString(range: ITextRange): string {
    return JSON.stringify([`${range.from.nth}:${range.from.text}`, `${range.to.nth}:${range.to.text}`]);
  }

  export function fromSimpleString(str: string): ITextRange {
    const simple: [string, string] = JSON.parse(str);
    const from = simple[0].split(':', 2);
    const to = simple[1].split(':');
    return {
      from: {text: from[1], nth: parseInt(from[0], 10)},
      to: {text: to[1], nth: parseInt(to[0], 10)}
    }
  }
}
