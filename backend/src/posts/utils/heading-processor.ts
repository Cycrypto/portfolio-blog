import { JSDOM } from 'jsdom';

export interface HeadingItem {
    level: number;
    text: string;
    id: string;
}

export function slugify(text: string): string {
    const slug = text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9가-힣\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

    return slug || 'section';
}

function isValidId(id: string): boolean {
    return /^[a-z0-9가-힣_.-]+$/i.test(id);
}

export function injectHeadingIds(html: string): { html: string; headings: HeadingItem[] } {
    const dom = new JSDOM(html);
    const document = dom.window.document;
    const headingElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6');

    const headings: HeadingItem[] = [];
    const usedIds = new Set<string>();

    headingElements.forEach((element) => {
        const level = parseInt(element.tagName[1]);
        const text = element.textContent?.trim() || '';

        if (!text) {
            return;
        }

        const existingId = element.getAttribute('id');
        let finalId: string;

        if (existingId && existingId.trim() && isValidId(existingId.trim()) && !usedIds.has(existingId.trim())) {
            finalId = existingId.trim();
        } else {
            const baseId = slugify(text);
            if (usedIds.has(baseId)) {
                let counter = 2;
                while (usedIds.has(`${baseId}-${counter}`)) {
                    counter += 1;
                }
                finalId = `${baseId}-${counter}`;
            } else {
                finalId = baseId;
            }
        }

        usedIds.add(finalId);
        element.setAttribute('id', finalId);
        headings.push({ level, text, id: finalId });
    });

    return {
        html: document.body.innerHTML,
        headings,
    };
}
