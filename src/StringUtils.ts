export class StringUtils {

  /**
   * the position of the nth occurrence of searchString
   * @param {string} source
   * @param {string} searchString
   * @param {number} nth = 1
   * @return {number} start position of the nth occurrence of <em>searchString</em>
   */
  public static indexOf(source: string, searchString: string, nth: number = 1): number {
    let times = 0;
    let index = -2;
    while (times < nth && index !== -1) {
      index = source.indexOf(searchString, index + 1);
      times++;
    }
    return index;
  }

  public static indexOfNthNotEmptyChar(source: string, nth: number): number {
    let i = 0;
    for (let n = -1; n <= nth && i < source.length; i++) {
      if (!/\s+/m.test(source[i])) {
        n++;
        if (n === nth) {
          return i;
        }
      }
    }
    return -1;
  }

  /**
   * the occurrences(include the positions) of searchString
   * @param {string} source
   * @param {string} searchString
   * @returns {Array<IOccurrence>}
   */
  public static find(source: string, searchString: string): IOccurrence[] {
    let times = 0;
    let position = -2;
    const result: IOccurrence[] = [];
    if (searchString.length < 1) {
      return result;
    }
    while (position !== -1) {
      position = source.indexOf(searchString, position + 1);
      if (position < 0) {
        break;
      }
      result.push({nth: ++times, position});
    }
    return result;
  }

  /**
   * @return {string} compacted string
   */
  public static compact(source: string): string {
    return source.replace(/\s+/gm, '');
  }

  /**
   * @return {string} trimmed string
   */
  public static trim(source: string): string {
    return source.replace(/(^\s*)|(\s*$)/g, '');
  }
}

export interface IOccurrence {
  nth: number;
  position: number;
}

export const None: IOccurrence = {
  nth: -1,
  position: -1,
};
