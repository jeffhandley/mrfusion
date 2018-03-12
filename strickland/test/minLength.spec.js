import deepFreeze from 'deep-freeze';
import minLength from '../src/minLength';

describe('minLength', () => {
    describe('throws', () => {
        it('when minLength is non-numeric', () => {
            const validate = minLength({minLength: 'non-numeric'});
            expect(() => validate()).toThrow();
        });
    });

    describe('validates', () => {
        const validate = minLength({minLength: 3});

        it('with the string length equal to the minLength, it is valid', () => {
            const result = validate('123');
            expect(result.isValid).toBe(true);
        });

        it('with the string length greater than the minLength, it is valid', () => {
            const result = validate('1234');
            expect(result.isValid).toBe(true);
        });

        it('with the string length less than the minLength, it is invalid', () => {
            const result = validate('12');
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

    describe('with a props argument', () => {
        const validate = minLength({minLength: 3, message: 'Custom message', isValid: false});
        const result = validate('1234');

        it('uses the minLength prop', () => {
            expect(result.minLength).toBe(3);
        });

        it('spreads the other props onto the result', () => {
            expect(result.message).toBe('Custom message');
        });

        it('overrides the isValid prop with the validation result', () => {
            expect(result.isValid).toBe(true);
        });
    });

    describe('returns the length on the result', () => {
        const validate = minLength({minLength: 5});

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

    describe('with a function passed to the validator', () => {
        it('does not call the function during validator construction', () => {
            const getMinLength = jest.fn();
            getMinLength.mockReturnValue({minLength: 6});

            minLength(getMinLength);
            expect(getMinLength).not.toHaveBeenCalled();
        });

        it('the function is called at the time of validation', () => {
            const getMinLength = jest.fn();
            getMinLength.mockReturnValue({minLength: 6});

            const validate = minLength(getMinLength);
            validate('A');

            expect(getMinLength).toHaveBeenCalledTimes(1);
        });

        it('the function is called every time validation occurs', () => {
            const getMinLength = jest.fn();
            getMinLength.mockReturnValue({minLength: 6});

            const validate = minLength(getMinLength);
            validate(0);
            validate(0);

            expect(getMinLength).toHaveBeenCalledTimes(2);
        });

        it('validates using the function result', () => {
            const getMinLengthProps = jest.fn();
            getMinLengthProps.mockReturnValue({minLength: 2});

            const validate = minLength(getMinLengthProps);
            const result = validate('1234');

            expect(result).toMatchObject({
                isValid: true,
                minLength: 2
            });
        });

        it('validation context is passed to the function', () => {
            const getMinLength = jest.fn();
            getMinLength.mockReturnValue({minLength: 6});

            const validate = minLength(getMinLength);
            validate('abcde', {contextProp: 'validation context'});

            expect(getMinLength).toHaveBeenCalledWith(expect.objectContaining({
                contextProp: 'validation context'
            }));
        });

        it('validation context includes the length', () => {
            const getMinLength = jest.fn();
            getMinLength.mockReturnValue({minLength: 6});

            const validate = minLength(getMinLength);
            validate('abcde', {contextProp: 'validation context'});

            expect(getMinLength).toHaveBeenCalledWith(expect.objectContaining({
                length: 5
            }));
        });
    });

    it('does not mutate props', () => {
        const props = {minLength: 5};
        deepFreeze(props);

        expect(() => minLength(props)('12345')).not.toThrow();
    });

    describe('does not include validation context props on the result', () => {
        it('for new props', () => {
            const validate = minLength({minLength: 5});
            const result = validate(5, {contextProp: 'validation context'});

            expect(result).not.toHaveProperty('contextProp');
        });

        it('for props with the same name as other result props', () => {
            const validate = minLength({minLength: 5});
            const result = validate(5, {minLength: 6});

            expect(result.minLength).toBe(5);
        });
    });
});
