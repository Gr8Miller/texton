export {XText, XSelection} from './XSelection';
export {XDocument} from './XDocument';

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
}
