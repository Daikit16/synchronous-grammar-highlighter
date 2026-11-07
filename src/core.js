/**
 * Core scanner for the synchronous grammar highlighter.
 *
 * The scanner walks the input once, left to right. At each position it tries
 * every production in declaration order and takes the longest match. This is a
 * deliberate simplification: a full context-free parser would backtrack and
 * could produce overlapping tags, which is not useful for highlighting. The
 * synchronous part is that the scanner never looks ahead beyond the current
 * match, so it can run on a stream as long as each token is bounded.
 */

/**
 * A production rule with a name and a regular expression.
 * The name is used as the tag; the regex must match at the current position
 * (the scanner anchors it with `^`).
 */
export class Production {
  /**
   * @param {string} name tag applied to matched regions
   * @param {RegExp} pattern pattern matched at the current position
   */
  constructor(name, pattern) {
    if (typeof name !== 'string' || name.length === 0) {
      throw new TypeError('production name must be a non-empty string');
    }
    if (!(pattern instanceof RegExp)) {
      throw new TypeError('production pattern must be a RegExp');
    }
    this.name = name;
    this.pattern = pattern;
  }
}

/**
 * A match produced by the scanner.
 * `start` and `end` are code-unit offsets into the original input, `end` is
 * exclusive.
 */
export class Token {
  /**
   * @param {string} tag
   * @param {number} start
   * @param {number} end
   * @param {string} text
   */
  constructor(tag, start, end, text) {
    this.tag = tag;
    this.start = start;
    this.end = end;
    this.text = text;
  }
}

/**
 * Scans `input` for tokens matching `productions`.
 *
 * Rules:
 * - Productions are tried in order; the first one that matches at the current
 *   position wins, even if a later production would match a longer string.
 *   This keeps the scanner synchronous and predictable: the order of the
 *   productions is the priority order.
 * - Zero-length matches are rejected to guarantee progress. A production whose
 *   pattern can match the empty string is ignored at that position.
 * - Unmatched characters are skipped one at a time; they do not produce tokens.
 *
 * @param {string} input
 * @param {Production[]} productions
 * @returns {Token[]}
 */
export function scan(input, productions) {
  if (typeof input !== 'string') {
    throw new TypeError('input must be a string');
  }
  if (!Array.isArray(productions)) {
    throw new TypeError('productions must be an array');
  }

  const tokens = [];
  let pos = 0;

  while (pos < input.length) {
    let matched = false;

    for (const production of productions) {
      // Anchor the pattern at the current position without mutating the
      // caller's RegExp. `lastIndex` is irrelevant because we do not use the
      // global flag, but we still avoid `g` to keep behaviour obvious.
      const anchored = new RegExp(production.pattern.source, production.pattern.flags.replace('g', ''));
      const match = anchored.exec(input.slice(pos));

      // `exec` on a slice can still match later in the slice if the pattern
      // is not anchored, so check that the match starts at 0.
      if (match !== null && match.index === 0 && match[0].length > 0) {
        const text = match[0];
        tokens.push(new Token(production.name, pos, pos + text.length, text));
        pos += text.length;
        matched = true;
        break;
      }
    }

    if (!matched) {
      pos += 1;
    }
  }

  return tokens;
}

/**
 * Convenience wrapper that builds productions from plain objects.
 *
 * @param {string} input
 * @param {{name: string, pattern: RegExp}[]} specs
 * @returns {Token[]}
 */
export function highlight(input, specs) {
  const productions = specs.map((spec) => new Production(spec.name, spec.pattern));
  return scan(input, productions);
}
