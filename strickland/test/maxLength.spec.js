import deepFreeze from 'deep-freeze';
import maxLength from '../src/maxLength';

describe('maxLength', () => {
    describe('throws', () => {
        it('when maxLength is non-numeric', () => {
            const validate = maxLength({maxLength: 'non-numeric'});
            expect(() => validate()).toThrow();
        });
    });

    describe('validates', () => {
        const validate = maxLength({maxLength: 3});

        it('with the string length equal to the maxLength, it is valid', () => {
            const result = validate('123');
            expect(result.isValid).toBe(true);
        });

        it('with the string length less than the maxLength, it is valid', () => {
            const result = validate('12');
            expect(result.isValid).toBe(true);
        });

        it('with the string length greater than the maxLength, it is invalid', () => {
            const result = validate('1234');
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
        const validate = maxLength({maxLength: 3, message: 'Custom message', isValid: false});
        const result = validate('123');

        it('uses the maxLength prop', () => {
            expect(result.maxLength).toBe(3);
        });

        it('spreads the other props onto the result', () => {
            expect(result.message).toBe('Custom message');
        });

        it('overrides the isValid prop with the validation result', () => {
            expect(result.isValid).toBe(true);
        });
    });

    describe('returns the length on the result', () => {
        const validate = maxLength({maxLength: 5});

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
            const getMaxLength = jest.fn();
            getMaxLength.mockReturnValue({maxLength: 6});

            maxLength(getMaxLength);
            expect(getMaxLength).not.toHaveBeenCalled();
        });

        it('the function is called at the time of validation', () => {
            const getMaxLength = jest.fn();
            getMaxLength.mockReturnValue({maxLength: 6});

            const validate = maxLength(getMaxLength);
            validate('A');

            expect(getMaxLength).toHaveBeenCalledTimes(1);
        });

        it('the function is called every time validation occurs', () => {
            const getMaxLength = jest.fn();
            getMaxLength.mockReturnValue({maxLength: 6});

            const validate = maxLength(getMaxLength);
            validate(0);
            validate(0);

            expect(getMaxLength).toHaveBeenCalledTimes(2);
        });

        it('validates using the function result', () => {
            const getMaxLengthProps = jest.fn();
            getMaxLengthProps.mockReturnValue({maxLength: 6});

            const validate = maxLength(getMaxLengthProps);
            const result = validate('1234');

            expect(result).toMatchObject({
                isValid: true,
                maxLength: 6
            });
        });

        it('validation context is passed to the function', () => {
            const getMaxLength = jest.fn();
            getMaxLength.mockReturnValue({maxLength: 6});

            const validate = maxLength(getMaxLength);
            validate('abcde', {contextProp: 'validation context'});

            expect(getMaxLength).toHaveBeenCalledWith(expect.objectContaining({
                contextProp: 'validation context'
            }));
        });

        it('validation context includes the length', () => {
            const getMaxLength = jest.fn();
            getMaxLength.mockReturnValue({maxLength: 6});

            const validate = maxLength(getMaxLength);
            validate('abcde', {contextProp: 'validation context'});

            expect(getMaxLength).toHaveBeenCalledWith(expect.objectContaining({
                length: 5
            }));
        });
    });

    it('does not mutate props', () => {
        const props = {maxLength: 5};
        deepFreeze(props);

        expect(() => maxLength(props)('12345')).not.toThrow();
    });

    describe('does not include validation context props on the result', () => {
        it('for new props', () => {
            const validate = maxLength({maxLength: 5});
            const result = validate(5, {contextProp: 'validation context'});

            expect(result).not.toHaveProperty('contextProp');
        });

        it('for props with the same name as other result props', () => {
            const validate = maxLength({maxLength: 5});
            const result = validate(5, {maxLength: 6});

            expect(result.maxLength).toBe(5);
        });
    });
});
