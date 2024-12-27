import deepFreeze from 'deep-freeze';
import range from '../src/range.js';

describe('range', () => {
    describe('with numeric arguments', () => {
        it('validates using the value arguments', () => {
            const validate = range(5, 10);
            const result = validate(4);

            expect(result).toMatchObject({
                min: 5,
                max: 10,
                isValid: false
            });
        });
    });

    describe('with a props argument', () => {
        const validate = range({min: 3, max: 5, message: 'Custom message', isValid: false});
        const result = validate(4);

        it('uses the min prop', () => {
            expect(result.min).toBe(3);
        });

        it('uses the max prop', () => {
            expect(result.max).toBe(5);
        });

        it('spreads the other props onto the result', () => {
            expect(result.message).toBe('Custom message');
        });

        it('overrides the isValid prop with the validation result', () => {
            expect(result.isValid).toBe(true);
        });
    });

    describe('validates', () => {
        const validate = range(3, 5);

        it('with the value equal to the min, it is valid', () => {
            const result = validate(3);
            expect(result.isValid).toBe(true);
        });

        it('with the value equal to the max, it is valid', () => {
            const result = validate(5);
            expect(result.isValid).toBe(true);
        });

        it('with the value greater than the min and less than the max, it is valid', () => {
            const result = validate(4);
            expect(result.isValid).toBe(true);
        });

        it('with the value less than the min, it is invalid', () => {
            const result = validate(2);
            expect(result.isValid).toBe(false);
        });

        it('with the value greater than the max, it is invalid', () => {
            const result = validate(6);
            expect(result.isValid).toBe(false);
        });

        it('with a null value, it is valid', () => {
            const result = validate(null);
            expect(result.isValid).toBe(true);
        });

        it('with an undefined value, it is valid', () => {
            const result = validate();
            expect(result.isValid).toBe(true);
        });
    });

    it('does not mutate props', () => {
        const props = {min: 3, max: 5, message: 'Custom message'};
        deepFreeze(props);

        expect(() => range(props)(4)).not.toThrow();
    });
});
