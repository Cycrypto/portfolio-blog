import * as katex from 'katex';
import { JSDOM } from 'jsdom';

export function sanitizeStyleAttribute(styleValue: string): string | null {
    const colorMatch = styleValue.match(/color:\s*(#[0-9a-f]{3,8}|rgba?\([^\)]+\)|hsla?\([^\)]+\))/i);
    const alignMatch = styleValue.match(/text-align:\s*(left|center|right|justify)/i);
    const declarations: string[] = [];
    const sizeMatches = Array.from(
        styleValue.matchAll(/(?:^|;)\s*(width|min-width|height)\s*:\s*(\d+(?:\.\d+)?(?:px|%))/gi),
    );

    if (colorMatch) {
        declarations.push(colorMatch[0]);
    }

    if (alignMatch) {
        declarations.push(`text-align: ${alignMatch[1].toLowerCase()}`);
    }

    sizeMatches.forEach((match) => {
        const declaration = `${match[1].toLowerCase()}: ${match[2]}`;
        if (!declarations.includes(declaration)) {
            declarations.push(declaration);
        }
    });

    return declarations.length > 0 ? declarations.join('; ') : null;
}

export function normalizeRenderedHtml(html: string): string {
    const needsMathRendering = html.includes('data-type="inline-math"') || html.includes('data-type="block-math"');
    const needsLegacyTaskListNormalization = html.includes('[ ]') || html.includes('[x]') || html.includes('[X]');

    if (!needsMathRendering && !needsLegacyTaskListNormalization) {
        return html;
    }

    const dom = new JSDOM(`<body>${html}</body>`);
    const { document } = dom.window;

    if (needsLegacyTaskListNormalization) {
        normalizeLegacyTaskLists(document);
    }

    if (needsMathRendering) {
        renderMathNodes(document);
    }

    return document.body.innerHTML;
}

function normalizeLegacyTaskLists(document: any): void {
    const unorderedLists = Array.from(document.querySelectorAll('ul:not([data-type="taskList"])') as ArrayLike<any>);

    unorderedLists.forEach((list: any) => {
        const listItems = Array.from(list.children as ArrayLike<any>).filter((child: any) => child.tagName === 'LI');

        if (listItems.length === 0) {
            return;
        }

        const taskStates = listItems.map((listItem) => extractLegacyTaskState(listItem));
        if (taskStates.some((taskState) => taskState === null)) {
            return;
        }

        list.setAttribute('data-type', 'taskList');
        listItems.forEach((listItem, index) => {
            const checked = taskStates[index] === true;
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            const checkboxStyler = document.createElement('span');
            const contentWrapper = document.createElement('div');

            checkbox.setAttribute('type', 'checkbox');
            if (checked) {
                checkbox.setAttribute('checked', 'checked');
            }

            label.append(checkbox, checkboxStyler);

            while (listItem.firstChild) {
                contentWrapper.appendChild(listItem.firstChild);
            }

            listItem.setAttribute('data-type', 'taskItem');
            listItem.setAttribute('data-checked', checked ? 'true' : 'false');
            listItem.replaceChildren(label, contentWrapper);
        });
    });
}

function extractLegacyTaskState(listItem: any): boolean | null {
    const firstContentNode = Array.from(listItem.childNodes as ArrayLike<any>).find((childNode: any) => {
        if (childNode.nodeType === childNode.TEXT_NODE) {
            return Boolean(childNode.textContent?.trim());
        }

        return childNode.nodeType === childNode.ELEMENT_NODE;
    });

    if (!firstContentNode) {
        return null;
    }

    const firstTextNode = findFirstTextNode(firstContentNode);
    const markerMatch = firstTextNode?.textContent?.match(/^\s*\[([ xX])\]\s*/);
    if (!markerMatch || !firstTextNode) {
        return null;
    }

    firstTextNode.textContent = firstTextNode.textContent.replace(/^\s*\[([ xX])\]\s*/, '');
    return markerMatch[1].toLowerCase() === 'x';
}

function findFirstTextNode(node: any) {
    if (node.nodeType === node.TEXT_NODE) {
        return node.textContent?.trim() ? node : null;
    }

    for (const childNode of Array.from(node.childNodes as ArrayLike<any>)) {
        const textNode = findFirstTextNode(childNode);
        if (textNode) {
            return textNode;
        }
    }

    return null;
}

function renderMathNodes(document: any): void {
    const mathNodes = document.querySelectorAll('[data-type="inline-math"], [data-type="block-math"]');

    mathNodes.forEach((node) => {
        const latex = node.getAttribute('data-latex') || '';
        const isBlockMath = node.getAttribute('data-type') === 'block-math';

        node.classList.add(isBlockMath ? 'math-display' : 'math-node');

        if (!latex) {
            node.textContent = '';
            return;
        }

        try {
            node.innerHTML = katex.renderToString(latex, {
                throwOnError: false,
                displayMode: isBlockMath,
            });
        } catch {
            node.textContent = latex;
            node.classList.add(isBlockMath ? 'block-math-error' : 'inline-math-error');
        }
    });
}
