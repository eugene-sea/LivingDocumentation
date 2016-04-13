/// <reference path="../app/typings/browser.d.ts" />

import { widen } from '../app/components/filters';

describe('filters', () => {
    describe('#widen()', () => {
        it('Non-breaking spaces should be inserted correctly', () => {
            const result = widen('Non-breaking spaces should be inserted correctly');
            expect(result).toBe('Non-breaking&nbsp;spaces&nbsp;should be&nbsp;inserted&nbsp;correctly');
        });
    });
});
