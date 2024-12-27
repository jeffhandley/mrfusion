import deepFreeze from 'deep-freeze';
import { jest } from '@jest/globals';
import max from '../src/max.js';

describe('max', () => {
    describe('throws', () => {
        it('when max is non-numeric', () => {
            const validate = max('non-numeric');
            expect(() => validate()).toThrow();
        });
    });

    describe('validates', () => {
        const validate = max(3);

        it('with the value equal to the max, it is valid', () => {
            const result = validate(3);
            expect(result.isValid).toBe(true);
        });

        it('with the value less than the max, it is valid', () => {
            const result = validate(2);
            expect(result.isValid).toBe(true);
        });

        it('with the value greater than the max, it is invalid', () => {
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

        it('with a string value, it is not valid', () => {
            const result = validate('A');
            expect(result.isValid).toBe(false);
        });

        it('with a boolean false value, it is not valid', () => {
            const result = validate(false);
            expect(result.isValid).toBe(false);
        });

        it('with a boolean true value, it is not valid', () => {
            const result = validate(true);
            expect(result.isValid).toBe(false);
        });
    });

    describe('with a numeric argument', () => {
        it('validates using the max value argument', () => {
            const validate = max(5);
            const result = validate(6);

            expect(result).toMatchObject({
                max: 5,
                isValid: false
            });
        });
    });

    describe('with a props argument', () => {
        const validate = max({max: 5, message: 'Custom message', isValid: false});
        const result = validate(4);

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

    describe('with a function passed to the validator', () => {
        it('does not call the function during validator construction', () => {
            const getProps = jest.fn();
            getProps.mockReturnValue({max: 6});

            max(getProps);
            expect(getProps).not.toHaveBeenCalled();
        });

        it('the function is called at the time of validation', () => {
            const getProps = jest.fn();
            getProps.mockReturnValue({max: 6});

            const validate = max(getProps);
            validate(0);

            expect(getProps).toHaveBeenCalledTimes(1);
        });

        it('the function is called every time validation occurs', () => {
            const getProps = jest.fn();
            getProps.mockReturnValue({max: 6});

            const validate = max(getProps);
            validate(0);
            validate(0);

            expect(getProps).toHaveBeenCalledTimes(2);
        });

        it('validates using the function result', () => {
            const getProps = jest.fn();
            getProps.mockReturnValue({max: 6});

            const validate = max(getProps);
            const result = validate(4);

            expect(result).toMatchObject({
                isValid: true,
                max: 6
            });
        });

        it('validation context is passed to the function', () => {
            const getProps = jest.fn();
            getProps.mockReturnValue({max: 6});

            const validate = max(getProps);
            validate(6, {contextProp: 'validation context'});

            expect(getProps).toHaveBeenCalledWith(expect.objectContaining({
                contextProp: 'validation context'
            }));
        });
    });

    it('does not mutate props', () => {
        const props = {max: 5};
        deepFreeze(props);

        expect(() => max(props)(5)).not.toThrow();
    });

    describe('does not include validation context props on the result', () => {
        it('for new props', () => {
            const validate = max(5);
            const result = validate(5, {contextProp: 'validation context'});

            expect(result).not.toHaveProperty('contextProp');
        });

        it('for props with the same name as other result props', () => {
            const validate = max(5);
            const result = validate(6, {max: 7});

            expect(result.max).toBe(5);
        });
    });
});
