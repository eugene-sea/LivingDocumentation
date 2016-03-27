/// <reference path="../typings/mocha/mocha.d.ts" />
/// <reference path="../typings/should/should.d.ts" />

import { widen } from '../app/components/filters';

describe('filters', () => {
    describe('#widen()', () => {
        it('Non-breaking spaces should be inserted correctly', () => {
            const result = widen('Non-breaking spaces should be inserted correctly');
            result.should.equal('Non-breaking&nbsp;spaces&nbsp;should be&nbsp;inserted&nbsp;correctly');
        });
    });
});
