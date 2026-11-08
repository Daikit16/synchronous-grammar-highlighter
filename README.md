# synchronous-grammar-highlighter

Scans a string for tokens matching a set of context-free grammar production rules and returns the matched regions with their tags.

```js
import { Production, scan } from './src/index.js';

const productions = [
  new Production('keyword', /if|else|while/),
  new Production('number', /\d+/),
  new Production('ident', /[A-Za-z_][A-Za-z0-9_]*/),
];

const tokens = scan('if x < 42', productions);
// [
//   Token { tag: 'keyword', start: 0, end: 2, text: 'if' },
//   Token { tag: 'ident',   start: 3, end: 4, text: 'x' },
//   Token { tag: 'number',  start: 7, end: 9, text: '42' },
// ]
```

`highlight(input, specs)` is a convenience wrapper that accepts plain `{ name, pattern }` objects instead of `Production` instances.

## Why this exists

Most highlighters are regex-only or parser-only. A regex-only highlighter cannot express ordering constraints between token classes; a full parser is heavier than a syntax highlighter needs to be. This library sits in between: the caller supplies ordered production rules, and the scanner applies them left to right. The trade-off is that the scanner does not backtrack, so a production that matches a prefix of a longer construct will win if it appears earlier in the list. That is a feature for highlighting (you control priority explicitly) but it means the rule order matters and is not inferred from specificity.

## The edge you will hit

Productions that can match the empty string are ignored at each position to guarantee the scanner makes progress. If you write `/\s*/` as a production, it will never produce a token; write `/[ \t]+/` instead if you want to tag runs of whitespace.

Unmatched characters are skipped one at a time and do not appear in the output. If you need to preserve gaps, reconstruct them from the `start` and `end` offsets of adjacent tokens.

## API

- `new Production(name, pattern)` — `name` is a non-empty string used as the tag; `pattern` is a `RegExp` matched at the current position.
- `new Token(tag, start, end, text)` — `start` is inclusive, `end` is exclusive, both are code-unit offsets into the original input.
- `scan(input, productions)` — returns `Token[]`.
- `highlight(input, specs)` — builds `Production` instances from `{ name, pattern }` objects and calls `scan`.
