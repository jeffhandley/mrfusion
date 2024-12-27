import validate, { formatResult } from '../../src/strickland.js';

describe('docs', () => {
    describe('extensibility', () => {
        it('validator factories', () => {
            function letterValidator({letter}) {
                return (value) => value === letter;
            }

            const validator = letterValidator({letter: 'B'});
            const result = validate(validator, 'B');

            expect(result).toMatchObject({
                isValid: true,
                value: 'B'
            });
        });

        it('validation context', () => {
            function letterValidator(validatorProps) {
                return function validateLetter(value, context) {
                    // Be sure not to overwrite the original
                    // validatorProps variable
                    let resolvedProps = validatorProps;

                    if (typeof resolvedProps === 'function') {
                        resolvedProps = resolvedProps(context);
                    }

                    resolvedProps = resolvedProps || {};

                    const {letter} = resolvedProps;
                    return (value === letter);
                };
            }

            const validator = letterValidator((context) => ({letter: context.letter}));
            const result = validate(validator, 'B', {letter: 'B'});

            expect(result).toMatchObject({
                isValid: true,
                value: 'B'
            });
        });

        it('validation result props', () => {
            function letterValidator(validatorProps) {
                return function validateLetter(value, context) {
                    // Be sure not to overwrite the original
                    // validatorProps variable
                    let resolvedProps = validatorProps;

                    if (typeof resolvedProps === 'function') {
                        resolvedProps = resolvedProps(context);
                    }

                    resolvedProps = resolvedProps || {};

                    const {letter} = resolvedProps;

                    return {
                        isValid: (value === letter),
                        message: `Must match "${letter}"`
                    };
                };
            }

            const validator = letterValidator({letter: 'B'});
            const result = validate(validator, 'A');

            expect(result).toMatchObject({
                isValid: false,
                message: 'Must match "B"',
                value: 'A'
            });
        });

        it('pattern', () => {
            function letterValidator(validatorProps) {
                return function validateLetter(value, context) {
                    // Be sure not to overwrite the original
                    // validatorProps variable
                    let resolvedProps = validatorProps;

                    if (typeof resolvedProps === 'function') {
                        resolvedProps = resolvedProps(context);
                    }

                    resolvedProps = resolvedProps || {};

                    const {letter} = resolvedProps;

                    return {
                        message: `Must match "${letter}"`,
                        ...resolvedProps,
                        isValid: (value === letter)
                    };
                };
            }

            const termsAccepted = letterValidator({
                letter: 'Y',
                fieldName: 'acceptTerms',
                message: 'Enter the letter "Y" to accept the terms'
            });

            const termsEntered = 'N';

            const result = validate(termsAccepted, termsEntered);

            expect(result).toMatchObject({
                letter: 'Y',
                fieldName: 'acceptTerms',
                message: 'Enter the letter "Y" to accept the terms',
                isValid: false,
                value: 'N'
            });
        });

        it('formatResult', () => {
            function letterA(value) {
                return (value === 'A');
            }

            function withMessage(result, {value}) {
                return {
                    ...result,
                    message: `The letter "A" was expected, but the value "${value}" was supplied`
                };
            }

            const validator = formatResult(withMessage, letterA);

            const result = validate(validator, 'B');

            expect(result).toMatchObject({
                isValid: false,
                value: 'B',
                message: 'The letter "A" was expected, but the value "B" was supplied'
            });
        });
    });
});
