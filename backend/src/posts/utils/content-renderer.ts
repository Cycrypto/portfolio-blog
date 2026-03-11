import { generateHTML, generateJSON, generateText, JSONContent } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Typography from '@tiptap/extension-typography';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import CodeBlock from '@tiptap/extension-code-block';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Mathematics from '@tiptap/extension-mathematics';
import Youtube from '@tiptap/extension-youtube';
import TextAlign from '@tiptap/extension-text-align';
import * as DOMPurify from 'isomorphic-dompurify';
import { marked } from 'marked';
import { HeadingItem, injectHeadingIds } from './heading-processor';
import { JSDOM } from 'jsdom';

// Setup DOM environment for Tiptap in Node.js
if (typeof window === 'undefined') {
    const jsdom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    (global as any).window = jsdom.window;
    (global as any).document = jsdom.window.document;
}

const purify = (DOMPurify as any).default ?? DOMPurify;

purify.addHook('uponSanitizeAttribute', (node, data) => {
    const attrName = data.attrName;
    const attrValue = String(data.attrValue || '').trim().toLowerCase();

    if (attrName === 'srcset') {
        data.keepAttr = false;
        return;
    }

    if (attrName === 'href') {
        if (attrValue.startsWith('javascript:') || attrValue.startsWith('data:')) {
            data.keepAttr = false;
        }
        return;
    }

    if (attrName === 'style') {
        const safeDeclarations = attrValue
            .split(';')
            .map((declaration) => declaration.trim())
            .filter(Boolean)
            .map((declaration) => {
                const [property, ...valueParts] = declaration.split(':');
                return {
                    property: property?.trim().toLowerCase(),
                    value: valueParts.join(':').trim().toLowerCase(),
                };
            })
            .filter(({ property, value }) => {
                if (!property || !value) {
                    return false;
                }

                if (property === 'text-align') {
                    return ['left', 'center', 'right', 'justify'].includes(value);
                }

                if (property === 'color' || property === 'background-color') {
                    return /^(#[0-9a-f]{3,8}|rgba?\([^\)]+\)|hsla?\([^\)]+\)|transparent|inherit|currentcolor)$/i.test(value);
                }

                return false;
            })
            .map(({ property, value }) => `${property}: ${value}`);

        if (safeDeclarations.length === 0) {
            data.keepAttr = false;
        } else {
            data.attrValue = safeDeclarations.join('; ');
        }
        return;
    }

    if (attrName === 'src') {
        if (attrValue.startsWith('javascript:')) {
            data.keepAttr = false;
            return;
        }
    }

    if (node.tagName === 'IMG' && attrName === 'src') {
        const allowedPrefixes = ['http://', 'https://', '/', './', '../', 'data:image/'];
        const isAllowed = allowedPrefixes.some((prefix) => attrValue.startsWith(prefix));
        if (!isAllowed) {
            data.keepAttr = false;
        }
    }
});

const viewerExtensions = [
    StarterKit.configure({
        codeBlock: false,
        horizontalRule: false,
        heading: {
            levels: [1, 2, 3],
        },
    }),
    Underline,
    Highlight.configure({
        multicolor: true,
    }),
    Typography,
    HorizontalRule,
    TaskList,
    TaskItem.configure({
        nested: true,
    }),
    TextStyle,
    Color.configure({
        types: ['textStyle'],
    }),
    CodeBlock,
    Image.extend({
        addAttributes() {
            return {
                ...this.parent?.(),
                width: {
                    default: null,
                    parseHTML: (element) => element.getAttribute('width'),
                    renderHTML: (attributes) => {
                        if (!attributes.width) {
                            return {};
                        }
                        return { width: attributes.width };
                    },
                },
                height: {
                    default: null,
                    parseHTML: (element) => element.getAttribute('height'),
                    renderHTML: (attributes) => {
                        if (!attributes.height) {
                            return {};
                        }
                        return { height: attributes.height };
                    },
                },
            };
        },
    }).configure({
        allowBase64: true,
        HTMLAttributes: {
            class: 'rounded-lg my-4',
            loading: 'lazy',
        },
    }),
    Link.configure({
        openOnClick: false,
        HTMLAttributes: {
            class: 'text-blue-600 underline hover:text-blue-800',
            rel: 'noopener noreferrer',
            target: '_blank',
        },
    }),
    Table,
    TableRow,
    TableCell,
    TableHeader,
    Mathematics.configure({
        katexOptions: {
            throwOnError: false,
        },
    }),
    Youtube.configure({
        controls: true,
        nocookie: true,
        HTMLAttributes: {
            class: 'youtube-embed',
        },
    }),
    TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
    }),
];

const PURIFY_CONFIG = {
    ALLOWED_TAGS: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'br', 'strong', 'em', 'u', 's',
        'a', 'img', 'iframe',
        'ul', 'ol', 'li',
        'blockquote', 'code', 'pre',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'div', 'span', 'hr', 'mark', 'input', 'label',
        'math', 'semantics', 'mrow', 'mi', 'mo', 'mn', 'msup', 'msub', 'mfrac', 'annotation',
    ],
    ALLOWED_ATTR: [
        'href', 'src', 'alt', 'title', 'class',
        'target', 'rel', 'loading', 'id', 'style',
        'colspan', 'rowspan', 'type', 'checked', 'disabled',
        'width', 'height', 'frameborder', 'allowfullscreen', 'allow',
        'encoding', 'xmlns',
    ],
    ALLOW_DATA_ATTR: true,
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|\/|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
};

export interface RenderedContent {
    html: string;
    headings: HeadingItem[];
    plainText: string;
    wordCount: number;
    readTime: number;
}

export function renderTiptapContent(json: JSONContent): RenderedContent {
    try {
        const rawHtml = generateHTML(json, viewerExtensions);
        const { html: htmlWithIds, headings } = injectHeadingIds(rawHtml);
        const sanitizedHtml = purify.sanitize(htmlWithIds, PURIFY_CONFIG);
        const plainText = generateText(json, viewerExtensions);
        const wordCount = calculateWordCount(plainText);
        const readTime = calculateReadTime(plainText);

        return {
            html: sanitizedHtml,
            headings,
            plainText,
            wordCount,
            readTime,
        };
    } catch (error) {
        console.error('Error rendering Tiptap content:', error);
        console.error('Content JSON:', JSON.stringify(json, null, 2));
        throw new Error(`Failed to render Tiptap content: ${error.message}`);
    }
}

export function renderMarkdownContent(markdown: string): RenderedContent {
    const rawHtml = marked.parse(markdown, { breaks: true, gfm: true }) as string;
    const { html: htmlWithIds, headings } = injectHeadingIds(rawHtml);
    const sanitizedHtml = purify.sanitize(htmlWithIds, PURIFY_CONFIG);
    const plainText = extractPlainText(sanitizedHtml);
    const wordCount = calculateWordCount(plainText);
    const readTime = calculateReadTime(plainText);

    return {
        html: sanitizedHtml,
        headings,
        plainText,
        wordCount,
        readTime,
    };
}

export function convertMarkdownToTiptapJSON(markdown: string): JSONContent {
    const html = marked.parse(markdown, { breaks: true, gfm: true }) as string;
    return generateJSON(html, viewerExtensions);
}

function extractPlainText(html: string): string {
    return html.replace(/<[^>]*>/g, '').trim();
}

function calculateWordCount(text: string): number {
    return text.split(/\s+/).filter((word) => word.length > 0).length;
}

function calculateCharacterCount(text: string): number {
    return text.replace(/\s/g, '').length;
}

function calculateReadTime(text: string): number {
    const wordCount = calculateWordCount(text);
    const characterCount = calculateCharacterCount(text);
    const effectiveWordCount = Math.max(wordCount, Math.ceil(characterCount / 4));

    return Math.max(1, Math.ceil(effectiveWordCount / 220));
}
