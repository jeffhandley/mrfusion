import deepFreeze from 'deep-freeze';
import min from '../src/min';

describe('min', () => {
    describe('throws', () => {
        it('when min is non-numeric', () => {
            const validate = min({min: 'non-numeric'});
            expect(() => validate()).toThrow();
        });
    });

    describe('validates', () => {
        const validate = min({min: 3});

        it('with the value equal to the min, it is valid', () => {
            const result = validate(3);
            expect(result.isValid).toBe(true);
        });

        it('with the value greater than the min, it is valid', () => {
            const result = validate(4);
            expect(result.isValid).toBe(true);
        });

        it('with the value less than the min, it is invalid', () => {
            const result = validate(2);
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
    });

    describe('with a props argument', () => {
        const validate = min({min: 5, message: 'Custom message', isValid: false});
        const result = validate(6);

        it('uses the min prop', () => {
            expect(result.min).toBe(5);
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
            const getMin = jest.fn();
            getMin.mockReturnValue(6);

            min(getMin);
            expect(getMin).not.toHaveBeenCalled();
        });

        it('the function is called at the time of validation', () => {
            const getMin = jest.fn();
            getMin.mockReturnValue({min: 6});

            const validate = min(getMin);
            validate(0);

            expect(getMin).toHaveBeenCalledTimes(1);
        });

        it('the function is called every time validation occurs', () => {
            const getMin = jest.fn();
            getMin.mockReturnValue({min: 6});

            const validate = min(getMin);
            validate(0);
            validate(0);

            expect(getMin).toHaveBeenCalledTimes(2);
        });

        it('validates using the function result', () => {
            const getMaxProps = jest.fn();
            getMaxProps.mockReturnValue({min: 4});

            const validate = min(getMaxProps);
            const result = validate(6);

            expect(result).toMatchObject({
                isValid: true,
                min: 4
            });
        });

        it('validation context is passed to the function', () => {
            const getMin = jest.fn();
            getMin.mockReturnValue({min: 6});

            const validate = min(getMin);
            validate(6, {contextProp: 'validation context'});

            expect(getMin).toHaveBeenCalledWith(expect.objectContaining({
                contextProp: 'validation context'
            }));
        });
    });

    it('does not mutate props', () => {
        const props = {min: 5};
        deepFreeze(props);

        expect(() => min(props)(5)).not.toThrow();
    });

    describe('does not include validation context props on the result', () => {
        it('for new props', () => {
            const validate = min({min: 5});
            const result = validate(5, {contextProp: 'validation context'});

            expect(result).not.toHaveProperty('contextProp');
        });

        it('for props with the same name as other result props', () => {
            const validate = min({min: 5});
            const result = validate(5, {min: 6});

            expect(result.min).toBe(5);
        });
    });
});
