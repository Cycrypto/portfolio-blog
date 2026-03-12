import { normalizeRenderedHtml, sanitizeStyleAttribute } from './rendered-html-normalizer';

describe('rendered-html-normalizer', () => {
    describe('sanitizeStyleAttribute', () => {
        it('preserves allowed alignment styles', () => {
            const style = sanitizeStyleAttribute(
                'text-align: center; color: rgb(255, 0, 0); min-width: 180px; height: 72px; position: absolute',
            );

            expect(style).toContain('text-align: center');
            expect(style).toContain('color: rgb(255, 0, 0)');
            expect(style).toContain('min-width: 180px');
            expect(style).toContain('height: 72px');
            expect(style).not.toContain('position: absolute');
        });
    });

    describe('normalizeRenderedHtml', () => {
        it('renders math nodes with katex markup', () => {
            const html = normalizeRenderedHtml('<p><span data-type="inline-math" data-latex="E = mc^2"></span></p>');

            expect(html).toContain('class="math-node');
            expect(html).toContain('class="katex"');
            expect(html).toContain('annotation encoding="application/x-tex">E = mc^2</annotation>');
        });

        it('converts legacy checklist bullet lists into task lists', () => {
            const html = normalizeRenderedHtml(`
                <ul>
                    <li><p>[ ] 첫 번째 작업</p></li>
                    <li><p>[x] 완료된 작업</p></li>
                </ul>
            `);

            expect(html).toContain('ul data-type="taskList"');
            expect(html).toContain('li data-type="taskItem" data-checked="false"');
            expect(html).toContain('li data-type="taskItem" data-checked="true"');
            expect(html).toContain('<p>첫 번째 작업</p>');
            expect(html).toContain('<p>완료된 작업</p>');
        });
    });
});
