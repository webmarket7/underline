import { diffObj, hasAnyKey, percentageAsDecimal } from './utils';

describe('utils', () => {

    describe('diffObj', () => {
        interface DiffObjTestObj {
            first: number;
            second: number;
        }

        it('should compare two objects and return difference', () => {
            const curr = {first: 1, second: 3};
            const last = {first: 1, second: 2};

            expect(diffObj<DiffObjTestObj>(curr, {...curr})).toEqual(null);
            expect(diffObj<DiffObjTestObj>(curr, last)).toEqual({second: 3});
        });
    });

    describe('hasAnyKey', () => {
        interface HasAnyKeyTestObj {
            first: number;
            second: number;
            third: number;
            fourth: number;
        }

        it('should return true if provided object has any of provided keys', () => {
            expect(hasAnyKey<HasAnyKeyTestObj>({first: 1, second: 2}, ['first', 'third'])).toBe(true);
        });

        it('should return false if provided object has none of provided keys', () => {
            expect(hasAnyKey<HasAnyKeyTestObj>({first: 1, second: 2}, ['third', 'fourth'])).toBe(false);
        });
    });

    describe('percentageAsDecimal', () => {

        it('should return provided percentage as a decimal value', () => {
            expect(percentageAsDecimal(0)).toBe(0);
            expect(percentageAsDecimal(5)).toBe(0.05);
            expect(percentageAsDecimal(50)).toBe(0.5);
            expect(percentageAsDecimal(100)).toBe(1);
        });
    });
});
