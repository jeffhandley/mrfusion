import deepFreeze from 'deep-freeze';
import { jest } from '@jest/globals';
import required from '../src/required.js';

describe('required', () => {
    describe('validates', () => {
        const validate = required();

        it('with a null value, it is invalid', () => {
            const result = validate(null);
            expect(result.isValid).toBe(false);
        });

        it('with an undefined value, it is invalid', () => {
            let notDefined;
            const result = validate(notDefined);
            expect(result.isValid).toBe(false);
        });

        it('with an empty string value, it is invalid', () => {
            const result = validate('');
            expect(result.isValid).toBe(false);
        });

        it('with a non-empty string value, it is valid', () => {
            const result = validate('not empty');
            expect(result.isValid).toBe(true);
        });

        it('with the number 0, it is valid (because 0 is indeed a supplied number)', () => {
            const result = validate(0);
            expect(result.isValid).toBe(true);
        });

        it('with the number 1, it is valid', () => {
            const result = validate(1);
            expect(result.isValid).toBe(true);
        });

        it('with the boolean true, it is valid', () => {
            const result = validate(true);
            expect(result.isValid).toBe(true);
        });

        it('with the boolean false, it is invalid (supporting scenarios like required checkboxes)', () => {
            const result = validate(false);
            expect(result.isValid).toBe(false);
        });
    });

    describe('when the value is not required', () => {
        const validate = required({required: false});

        it('with a null value, it is valid', () => {
            const result = validate(null);
            expect(result.isValid).toBe(true);
        });

        it('with an undefined value, it is valid', () => {
            let notDefined;
            const result = validate(notDefined);
            expect(result.isValid).toBe(true);
        });

        it('with an empty string value, it is valid', () => {
            const result = validate('');
            expect(result.isValid).toBe(true);
        });

        it('with a non-empty string value, it is valid', () => {
            const result = validate('not empty');
            expect(result.isValid).toBe(true);
        });

        it('with the number 0, it is valid (because 0 is indeed a supplied number)', () => {
            const result = validate(0);
            expect(result.isValid).toBe(true);
        });

        it('with the number 1, it is valid', () => {
            const result = validate(1);
            expect(result.isValid).toBe(true);
        });

        it('with the boolean true, it is valid', () => {
            const result = validate(true);
            expect(result.isValid).toBe(true);
        });

        it('with the boolean false, it is valid', () => {
            const result = validate(false);
            expect(result.isValid).toBe(true);
        });
    });

    describe('with a required boolean argument', () => {
        describe('set to false', () => {
            it('validates using the required value argument', () => {
                const validate = required(false);
                const result = validate('');

                expect(result).toMatchObject({
                    required: false,
                    isValid: true
                });
            });
        });

        describe('set to true', () => {
            it('validates using the required value argument', () => {
                const validate = required(true);
                const result = validate('');

                expect(result).toMatchObject({
                    required: true,
                    isValid: false
                });
            });

            it('validates using the required value resolved from a function', () => {
                const validate = required(() => true);
                const result = validate('');

                expect(result).toMatchObject({
                    required: true,
                    isValid: false
                });
            });
        });
    });

    describe('with a props argument', () => {
        const validate = required({message: 'Custom message'});
        const result = validate('Valid');

        it('sets the required prop to true', () => {
            expect(result).toMatchObject({
                required: true,
                isValid: true
            });
        });

        it('spreads the other props onto the result', () => {
            expect(result.message).toBe('Custom message');
        });
    });

    describe('with a function passed to the validator', () => {
        it('does not call the function during validator construction', () => {
            const getProps = jest.fn();

            required(getProps);
            expect(getProps).not.toHaveBeenCalled();
        });

        it('the function is called at the time of validation', () => {
            const getProps = jest.fn();
            getProps.mockReturnValue();

            const validate = required(getProps);
            validate();

            expect(getProps).toHaveBeenCalledTimes(1);
        });

        it('the function is called every time validation occurs', () => {
            const getProps = jest.fn();
            getProps.mockReturnValue(6);

            const validate = required(getProps);
            validate();
            validate();

            expect(getProps).toHaveBeenCalledTimes(2);
        });

        it('validates using the function result', () => {
            const getProps = jest.fn();
            getProps.mockReturnValue({message: 'Custom message'});

            const validate = required(getProps);
            const result = validate(4);

            expect(result).toMatchObject({
                isValid: true,
                required: true,
                message: 'Custom message'
            });
        });

        it('validation context is passed to the function', () => {
            const getProps = jest.fn();

            const validate = required(getProps);
            validate(6, {contextProp: 'validation context'});

            expect(getProps).toHaveBeenCalledWith(expect.objectContaining({
                contextProp: 'validation context'
            }));
        });
    });

    describe('does not mutate props', () => {
        const props = {required: true};
        deepFreeze(props);

        expect(() => required(props)(5)).not.toThrow();
    });

    describe('does not include validation context props on the result', () => {
        it('for new props', () => {
            const validate = required();
            const result = validate(5, {contextProp: 'validation context'});

            expect(result).not.toHaveProperty('contextProp');
        });

        it('for props with the same name as other result props', () => {
            const validate = required();
            const result = validate(5, {required: false});

            expect(result.required).toBe(true);
        });
    });
});
