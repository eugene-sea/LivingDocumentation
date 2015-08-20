/// <reference path="../app/components/filters.ts" />
/// <reference path="../typings/mocha/mocha.d.ts" />
/// <reference path="../typings/should/should.d.ts" />
'use strict';
describe('filters', function () {
    describe('#widen()', function () {
        it('Non-breaking spaces should be inserted correctly', function () {
            var result = livingDocumentation.widen('Non-breaking spaces should be inserted correctly');
            result.should.equal('Non-breaking&nbsp;spaces&nbsp;should be&nbsp;inserted&nbsp;correctly');
        });
    });
});
//# sourceMappingURL=filters-spec.js.map