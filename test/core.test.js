import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Production, Token, scan, highlight } from '../src/index.js';

test('scans a simple keyword and number', () => {
  const productions = [
    new Production('keyword', /if/),
    new Production('number', /\d+/),
  ];
  const tokens = scan('if 42', productions);
  assert.deepEqual(
    tokens.map((t) => [t.tag, t.start, t.end, t.text]),
    [
      ['keyword', 0, 2, 'if'],
      ['number', 3, 5, '42'],
    ],
  );
});

test('unmatched characters are skipped', () => {
  const productions = [new Production('word', /[a-z]+/)];
  const tokens = scan('  hello  ', productions);
  assert.deepEqual(
    tokens.map((t) => [t.tag, t.start, t.end, t.text]),
    [['word', 2, 7, 'hello']],
  );
});

test('production order is priority order, not longest match', () => {
  const productions = [
    new Production('short', /ab/),
    new Production('long', /abc/),
  ];
  const tokens = scan('abc', productions);
  assert.deepEqual(tokens.map((t) => t.tag), ['short']);
  assert.equal(tokens[0].text, 'ab');
});

test('zero-length matches do not cause an infinite loop', () => {
  const productions = [new Production('empty', /x*/)];
  const tokens = scan('abc', productions);
  assert.deepEqual(tokens, []);
});

test('zero-length match is skipped but later productions still apply', () => {
  const productions = [
    new Production('empty', /x*/),
    new Production('letter', /[a-z]/),
  ];
  const tokens = scan('a', productions);
  assert.deepEqual(tokens.map((t) => [t.tag, t.text]), [['letter', 'a']]);
});

test('highlight builds productions from plain specs', () => {
  const tokens = highlight('let x = 1', [
    { name: 'kw', pattern: /let/ },
    { name: 'id', pattern: /[a-z]+/ },
    { name: 'num', pattern: /\d+/ },
  ]);
  assert.deepEqual(
    tokens.map((t) => [t.tag, t.text]),
    [
      ['kw', 'let'],
      ['id', 'x'],
      ['num', '1'],
    ],
  );
});

test('pattern with global flag is treated as non-global', () => {
  const productions = [new Production('word', /[a-z]+/g)];
  const tokens = scan('one two', productions);
  assert.deepEqual(tokens.map((t) => t.text), ['one', 'two']);
});

test('pattern that matches later in the slice is not accepted', () => {
  // The pattern is not anchored; the scanner must reject a match that does
  // not start at the current position.
  const productions = [new Production('word', /[a-z]+/)];
  const tokens = scan('123abc', productions);
  assert.deepEqual(tokens.map((t) => [t.tag, t.text]), [['word', 'abc']]);
});

test('empty input returns no tokens', () => {
  const productions = [new Production('word', /[a-z]+/)];
  assert.deepEqual(scan('', productions), []);
});

test('non-string input throws', () => {
  assert.throws(() => scan(null, []), TypeError);
  assert.throws(() => scan(42, []), TypeError);
});

test('non-array productions throws', () => {
  assert.throws(() => scan('x', 'nope'), TypeError);
});

test('Production validates its arguments', () => {
  assert.throws(() => new Production('', /x/), TypeError);
  assert.throws(() => new Production('tag', 'x'), TypeError);
});

test('Token exposes tag, start, end and text', () => {
  const token = new Token('tag', 1, 3, 'ab');
  assert.equal(token.tag, 'tag');
  assert.equal(token.start, 1);
  assert.equal(token.end, 3);
  assert.equal(token.text, 'ab');
});
