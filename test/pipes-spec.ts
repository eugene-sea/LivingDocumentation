import { widen, HighlightPipe } from '../app/components/pipes';

describe('pipes', () => {
    describe('#widen()', () => {
        it('Non-breaking spaces should be inserted correctly', () => {
            const result = widen('Non-breaking spaces should be inserted correctly');
            expect(result).toBe('Non-breaking&nbsp;spaces&nbsp;should be&nbsp;inserted&nbsp;correctly');
        });
    });

    describe('#highlight pipe', () => {
        it('Undefined or null string should be returned as empty', () => {
            const result = new HighlightPipe(<any>{}).transform(undefined);
            expect(result).toBe('');
        });
    });
});
