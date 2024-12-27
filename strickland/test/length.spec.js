import deepFreeze from 'deep-freeze';
import length from '../src/length.js';

describe('length', () => {
    describe('with numeric arguments', () => {
        it('validates using the value arguments', () => {
            const validate = length(5, 10);
            const result = validate('1234');

            expect(result).toMatchObject({
                minLength: 5,
                maxLength: 10,
                isValid: false
            });
        });
    });

    describe('with a props argument', () => {
        const validate = length({minLength: 3, maxLength: 5, message: 'Custom message', isValid: false});
        const result = validate('1234');

        it('uses the min prop', () => {
            expect(result.minLength).toBe(3);
        });

        it('uses the max prop', () => {
            expect(result.maxLength).toBe(5);
        });

        it('spreads the other props onto the result', () => {
            expect(result.message).toBe('Custom message');
        });

        it('overrides the isValid prop with the validation result', () => {
            expect(result.isValid).toBe(true);
        });
    });

    describe('returns the length on the result', () => {
        const validate = length(3, 5);

        it('when the value is a string', () => {
            const result = validate('1234');
            expect(result.length).toBe(4);
        });

        it('when the value is null', () => {
            const result = validate(null);
            expect(result.length).toBe(0);
        });

        it('when the value is an empty string', () => {
            const result = validate('');
            expect(result.length).toBe(0);
        });

        it('when the value is 0 as a string', () => {
            const result = validate('0');
            expect(result.length).toBe(1);
        });

        it('when the value has leading spaces', () => {
            const result = validate('   1234');
            expect(result.length).toBe(7);
        });

        it('when the value has trailing spaces', () => {
            const result = validate('1234   ');
            expect(result.length).toBe(7);
        });

        it('when the value has leading and trailing spaces', () => {
            const result = validate('   1234   ');
            expect(result.length).toBe(10);
        });
    });

    describe('validates', () => {
        const validate = length(3, 5);

        it('with the length equal to the min, it is valid', () => {
            const result = validate('123');
            expect(result.isValid).toBe(true);
        });

        it('with the length equal to the max, it is valid', () => {
            const result = validate('12345');
            expect(result.isValid).toBe(true);
        });

        it('with the length greater than the min and less than the max, it is valid', () => {
            const result = validate('1234');
            expect(result.isValid).toBe(true);
        });

        it('with the length less than the min, it is invalid', () => {
            const result = validate('12');
            expect(result.isValid).toBe(false);
        });

        it('with the length greater than the max, it is invalid', () => {
            const result = validate('123456');
            expect(result.isValid).toBe(false);
        });

        it('with an empty string, it is valid', () => {
            const result = validate('');
            expect(result.isValid).toBe(true);
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
        const props = {minLength: 3, maxLength: 5};
        deepFreeze(props);

        expect(() => length(props)('1234')).not.toThrow();
    });
});
