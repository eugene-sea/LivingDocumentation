/// <reference path="../app/components/filters.ts" />
/// <reference path="../typings/mocha/mocha.d.ts" />
/// <reference path="../typings/should/should.d.ts" />

'use strict';

describe('filters', () => {
    describe('#widen()', () => {
        it('Non-breaking spaces should be inserted correctly', () => {
            let result = livingDocumentation.widen('Non-breaking spaces should be inserted correctly');
            result.should.equal('Non-breaking&nbsp;spaces&nbsp;should be&nbsp;inserted&nbsp;correctly');
        });
    });
});
