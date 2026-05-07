import { describe, it, expect } from 'vitest';
import { parseBiblePaste } from '../src/parse-bible-paste.js';

describe('parseBiblePaste', () => {
  describe('Bible app single verse format', () => {
    it('parses standard Bible app paste (reference + verse number + text + URL)', () => {
      const paste = `Romans 1:1 NLT
[1] This letter is from Paul, a slave of Christ Jesus, chosen by God to be an apostle and sent out to preach his Good News.

https://bible.com/bible/116/rom.1.1.NLT`;

      const result = parseBiblePaste(paste);
      expect(result).toHaveLength(1);
      expect(result[0].reference).toBe('Romans 1:1');
      expect(result[0].translation).toBe('NLT');
      expect(result[0].text).toBe('This letter is from Paul, a slave of Christ Jesus, chosen by God to be an apostle and sent out to preach his Good News.');
    });

    it('strips verse number brackets from text', () => {
      const paste = `John 3:16 ESV
[16] For God so loved the world, that he gave his only Son.

https://bible.com/bible/59/jhn.3.16.ESV`;

      const result = parseBiblePaste(paste);
      expect(result[0].text).not.toContain('[16]');
      expect(result[0].text).toBe('For God so loved the world, that he gave his only Son.');
    });

    it('handles missing URL gracefully', () => {
      const paste = `Romans 1:1 NLT
[1] This letter is from Paul, a slave of Christ Jesus.`;

      const result = parseBiblePaste(paste);
      expect(result).toHaveLength(1);
      expect(result[0].reference).toBe('Romans 1:1');
      expect(result[0].text).toBe('This letter is from Paul, a slave of Christ Jesus.');
    });

    it('handles no verse number brackets', () => {
      const paste = `Psalm 23:1 KJV
The LORD is my shepherd; I shall not want.`;

      const result = parseBiblePaste(paste);
      expect(result[0].reference).toBe('Psalm 23:1');
      expect(result[0].translation).toBe('KJV');
      expect(result[0].text).toBe('The LORD is my shepherd; I shall not want.');
    });
  });

  describe('multi-verse paste', () => {
    it('parses multiple verses from a single paste', () => {
      const paste = `Romans 1:1-3 NLT
[1] This letter is from Paul, a slave of Christ Jesus, chosen by God to be an apostle and sent out to preach his Good News. [2] God promised this Good News long ago through his prophets in the holy Scriptures. [3] The Good News is about his Son.

https://bible.com/bible/116/rom.1.1-3.NLT`;

      const result = parseBiblePaste(paste);
      expect(result).toHaveLength(3);
      expect(result[0].reference).toBe('Romans 1:1');
      expect(result[0].text).toBe('This letter is from Paul, a slave of Christ Jesus, chosen by God to be an apostle and sent out to preach his Good News.');
      expect(result[1].reference).toBe('Romans 1:2');
      expect(result[1].text).toBe('God promised this Good News long ago through his prophets in the holy Scriptures.');
      expect(result[2].reference).toBe('Romans 1:3');
      expect(result[2].text).toBe('The Good News is about his Son.');
    });

    it('all multi-verse results share the same translation', () => {
      const paste = `Romans 1:1-2 NLT
[1] First verse text. [2] Second verse text.`;

      const result = parseBiblePaste(paste);
      expect(result[0].translation).toBe('NLT');
      expect(result[1].translation).toBe('NLT');
    });
  });

  describe('plain text fallback', () => {
    it('handles plain reference: text format', () => {
      const paste = 'John 3:16 - For God so loved the world';
      const result = parseBiblePaste(paste);
      expect(result).toHaveLength(1);
      expect(result[0].reference).toBe('John 3:16');
      expect(result[0].text).toBe('For God so loved the world');
    });

    it('handles multiple lines of ref: text', () => {
      const paste = `John 3:16 - For God so loved the world
John 3:17 - For God did not send his Son`;

      const result = parseBiblePaste(paste);
      expect(result).toHaveLength(2);
      expect(result[0].reference).toBe('John 3:16');
      expect(result[1].reference).toBe('John 3:17');
    });

    it('returns empty array for unparseable input', () => {
      expect(parseBiblePaste('')).toEqual([]);
      expect(parseBiblePaste(null)).toEqual([]);
      expect(parseBiblePaste('random nonsense')).toEqual([]);
    });
  });

  describe('edge cases', () => {
    it('handles books with numbers (1 Corinthians, 2 Timothy)', () => {
      const paste = `1 Corinthians 13:4 NIV
[4] Love is patient, love is kind.

https://bible.com/bible/111/1co.13.4.NIV`;

      const result = parseBiblePaste(paste);
      expect(result[0].reference).toBe('1 Corinthians 13:4');
      expect(result[0].translation).toBe('NIV');
    });

    it('handles Song of Solomon (multi-word book)', () => {
      const paste = `Song of Solomon 2:1 KJV
[1] I am the rose of Sharon, and the lily of the valleys.`;

      const result = parseBiblePaste(paste);
      expect(result[0].reference).toBe('Song of Solomon 2:1');
    });

    it('trims extra whitespace from text', () => {
      const paste = `Romans 1:1 NLT
[1]   This letter is from Paul.  

https://bible.com/bible/116/rom.1.1.NLT`;

      const result = parseBiblePaste(paste);
      expect(result[0].text).toBe('This letter is from Paul.');
    });

    it('handles verse text spanning multiple lines', () => {
      const paste = `Romans 1:1 NLT
[1] This letter is from Paul, a slave of Christ Jesus,
chosen by God to be an apostle and sent out to preach his Good News.

https://bible.com/bible/116/rom.1.1.NLT`;

      const result = parseBiblePaste(paste);
      expect(result[0].text).toBe('This letter is from Paul, a slave of Christ Jesus, chosen by God to be an apostle and sent out to preach his Good News.');
    });

    it('handles reference without translation code', () => {
      const paste = `Romans 1:1
[1] This letter is from Paul.`;

      const result = parseBiblePaste(paste);
      expect(result[0].reference).toBe('Romans 1:1');
      expect(result[0].translation).toBe('');
    });
  });
});
