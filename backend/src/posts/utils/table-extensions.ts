import TableCellBase from '@tiptap/extension-table-cell';
import TableHeaderBase from '@tiptap/extension-table-header';

function parseRowHeight(element: any): number | null {
    const dataRowHeight = element.getAttribute('data-rowheight');
    const styleHeight = String(element.style?.height || '').replace('px', '');
    const nextValue = dataRowHeight ?? styleHeight;
    const parsed = Number.parseInt(nextValue, 10);

    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function renderRowHeight(rowheight: unknown) {
    if (typeof rowheight !== 'number' || !Number.isFinite(rowheight) || rowheight <= 0) {
        return {};
    }

    return {
        'data-rowheight': String(rowheight),
        style: `height: ${Math.round(rowheight)}px`,
    };
}

export const TableCell = TableCellBase.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            rowheight: {
                default: null,
                parseHTML: (element) => parseRowHeight(element),
                renderHTML: (attributes) => renderRowHeight(attributes.rowheight),
            },
        };
    },
});

export const TableHeader = TableHeaderBase.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            rowheight: {
                default: null,
                parseHTML: (element) => parseRowHeight(element),
                renderHTML: (attributes) => renderRowHeight(attributes.rowheight),
            },
        };
    },
});
