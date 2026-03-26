import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { createElement } from 'react';
import { MarkdownContent } from '../src/components/MarkdownContent';

function render(content: string): string {
  return renderToString(createElement(MarkdownContent, { content }));
}

describe('MarkdownContent security', () => {
  it('strips script tags', () => {
    const html = render('<script>alert("xss")</script>');
    expect(html).not.toContain('<script');
    expect(html).not.toContain('alert');
  });

  it('strips raw img onerror handlers via skipHtml', () => {
    const html = render('<img src="x" onerror="alert(1)">');
    expect(html).not.toContain('onerror');
    expect(html).not.toContain('alert');
  });

  it('strips javascript: URLs in markdown links', () => {
    const html = render('[click](javascript:alert("xss"))');
    expect(html).not.toContain('javascript:');
  });

  it('strips raw HTML event handlers', () => {
    const html = render('<div onclick="alert(1)">test</div>');
    expect(html).not.toContain('onclick');
  });

  it('strips iframe tags', () => {
    const html = render('<iframe src="https://evil.com"></iframe>');
    expect(html).not.toContain('<iframe');
    expect(html).not.toContain('evil.com');
  });

  it('strips form tags', () => {
    const html = render('<form action="https://evil.com"><input type="submit"></form>');
    expect(html).not.toContain('<form');
    expect(html).not.toContain('evil.com');
  });
});

describe('MarkdownContent rendering', () => {
  it('renders bold text', () => {
    const html = render('**bold**');
    expect(html).toContain('<strong>bold</strong>');
  });

  it('renders inline code', () => {
    const html = render('`code`');
    expect(html).toContain('<code>code</code>');
  });

  it('renders links with target=_blank and noopener noreferrer', () => {
    const html = render('[example](https://example.com)');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('href="https://example.com"');
  });

  it('renders blockquotes', () => {
    const html = render('> quoted text');
    expect(html).toContain('<blockquote>');
  });

  it('renders unordered lists', () => {
    const html = render('- item 1\n- item 2');
    expect(html).toContain('<ul>');
    expect(html).toContain('<li>');
  });

  it('renders tables (GFM)', () => {
    const md = '| a | b |\n|---|---|\n| 1 | 2 |';
    const html = render(md);
    expect(html).toContain('<table>');
    expect(html).toContain('<th>');
    expect(html).toContain('<td>');
  });

  it('strips markdown images from untrusted content', () => {
    const html = render('![alt text](https://example.com/img.png)');
    expect(html).not.toContain('<img');
    expect(html).not.toContain('https://example.com/img.png');
  });

  it('renders strikethrough (GFM)', () => {
    const html = render('~~deleted~~');
    expect(html).toContain('<del>');
  });
});
