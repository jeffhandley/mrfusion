import deepFreeze from 'deep-freeze';
import { jest } from '@jest/globals';
import compare from '../src/compare.js';

describe('compare', () => {
    describe('throws', () => {
        it('if the compare value is not defined', () => {
            expect(() => compare()()).toThrow();
        });

        it('if a props function does not define a compare value', () => {
            expect(() => compare(() => ({}))()).toThrow();
        });
    });

    describe('validates', () => {
        const validate = compare(3);

        it('with the value equal to the compare, it is valid', () => {
            const result = validate(3);
            expect(result.isValid).toBe(true);
        });

        it('with the value less than the compare, it is invalid', () => {
            const result = validate(2);
            expect(result.isValid).toBe(false);
        });

        it('with the value greater than the compare, it is invalid', () => {
            const result = validate(4);
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

        it('comparing against 0', () => {
            const validateAgainst0 = compare(0);
            const result = validateAgainst0(1);

            expect(result).toMatchObject({
                isValid: false,
                compare: 0
            });
        });

        it('with a value of 0', () => {
            const result = validate(0);

            expect(result).toMatchObject({
                isValid: false,
                compare: 3
            });
        });
    });

    describe('validates boolean', () => {
        const validateIs3 = compare(3);
        const validateIsTrue = compare(true);
        const validateIsFalse = compare(false);

        it('with a boolean true value, compared to 3, it is invalid', () => {
            const result = validateIs3(true);
            expect(result.isValid).toBe(false);
        });

        it('with a boolean false value, compared to 3, it is invalid', () => {
            const result = validateIs3(false);
            expect(result.isValid).toBe(false);
        });

        it('with a boolean false value, compared to false, it is valid', () => {
            const result = validateIsFalse(false);
            expect(result.isValid).toBe(true);
        });

        it('with a boolean true value, compared to false, it is invalid', () => {
            const result = validateIsFalse(true);
            expect(result.isValid).toBe(false);
        });

        it('with a string "false" value, compared to false, it is invalid', () => {
            const result = validateIsFalse('false');
            expect(result.isValid).toBe(false);
        });

        it('with a string "true" value, compared to false, it is invalid', () => {
            const result = validateIsFalse('true');
            expect(result.isValid).toBe(false);
        });

        it('with a boolean false value, compared to true, it is invalid', () => {
            const result = validateIsTrue(false);
            expect(result.isValid).toBe(false);
        });

        it('with a boolean true value, compared to true, it is valid', () => {
            const result = validateIsTrue(true);
            expect(result.isValid).toBe(true);
        });

        it('with a string "false" value, compared to true, it is invalid', () => {
            const result = validateIsTrue('false');
            expect(result.isValid).toBe(false);
        });

        it('with a string "true" value, compared to true, it is invalid', () => {
            const result = validateIsTrue('true');
            expect(result.isValid).toBe(false);
        });
    });

    describe('with a value argument', () => {
        it('validates using the compare value argument', () => {
            const validate = compare(5);
            const result = validate(4);

            expect(result).toMatchObject({
                compare: 5,
                isValid: false
            });
        });
    });

    describe('with a props argument', () => {
        const validate = compare({compare: 5, message: 'Custom message', isValid: false});
        const result = validate(5);

        it('uses the compare prop', () => {
            expect(result.compare).toBe(5);
        });

        it('spreads the other props onto the result', () => {
            expect(result.message).toBe('Custom message');
        });

        it('overrides the isValid prop with the validation result', () => {
            expect(result.isValid).toBe(true);
        });
    });

    describe('with a props function', () => {
        it('does not call the function during validator construction', () => {
            const getProps = jest.fn();
            getProps.mockReturnValue({compare: 6});

            compare(getProps);
            expect(getProps).not.toHaveBeenCalled();
        });

        it('the function is called at the time of validation', () => {
            const getProps = jest.fn();
            getProps.mockReturnValue({compare: 6});

            const validate = compare(getProps);
            validate(5);

            expect(getProps).toHaveBeenCalledTimes(1);
        });

        it('the function is called every time validation occurs', () => {
            const getProps = jest.fn();
            getProps.mockReturnValue({compare: 6});

            const validate = compare(getProps);
            validate(7);
            validate(7);

            expect(getProps).toHaveBeenCalledTimes(2);
        });

        it('validates using the function result', () => {
            const getProps = jest.fn();
            getProps.mockReturnValue({compare: 6});

            const validate = compare(getProps);
            const result = validate(6);

            expect(result).toMatchObject({
                isValid: true,
                compare: 6
            });
        });

        it('validation context is passed to the function', () => {
            const getProps = jest.fn();
            getProps.mockReturnValue({compare: 6});

            const validate = compare(getProps);
            validate(6, {contextProp: 'validation context'});

            expect(getProps).toHaveBeenCalledWith(expect.objectContaining({
                contextProp: 'validation context'
            }));
        });
    });

    it('does not mutate props', () => {
        const props = {compare: 5};
        deepFreeze(props);

        expect(() => compare(props)(5)).not.toThrow();
    });

    describe('does not include validation context props on the result', () => {
        it('for new props', () => {
            const validate = compare(5);
            const result = validate(5, {contextProp: 'validation context'});

            expect(result).not.toHaveProperty('contextProp');
        });

        it('for props with the same name as other result props', () => {
            const validate = compare(5);
            const result = validate(6, {compare: 7});

            expect(result.compare).toBe(5);
        });
    });
});
