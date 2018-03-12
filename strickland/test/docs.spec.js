import validate, {validateAsync, required, compare, min, max, range, minLength, maxLength, length, every, each, some, props, form} from '../src/strickland';

describe('docs', () => {
    describe('introduction', () => {
        describe('validators', () => {
            it('as an arrow function', () => {
                expect(() => {
                    // eslint-disable-next-line no-unused-vars
                    const letterA = (value) => (value === 'A');
                }).not.toThrow();
            });

            it('as a traditional function', () => {
                expect(() => {
                    // eslint-disable-next-line no-unused-vars
                    function letterA(value) {
                        return (value === 'A');
                    }
                }).not.toThrow();
            });
        });

        it('validation', () => {
            expect(() => {
                function letterA(value) {
                    return (value === 'A');
                }

                validate(letterA, 'B');
            }).not.toThrow();
        });

        describe('validation results', () => {
            it('as a boolean', () => {
                function letterA(value) {
                    return (value === 'A');
                }

                const result = validate(letterA, 'B');

                expect(result).toMatchObject({
                    isValid: false,
                    value: 'B'
                });
            });

            it('as an object', () => {
                function letterA(value) {
                    return {
                        isValid: (value === 'A')
                    };
                }

                const result = validate(letterA, 'B');

                expect(result).toMatchObject({
                    isValid: false,
                    value: 'B'
                });
            });
        });
    });

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
                }
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
                }
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
                }
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
    });

    describe('validators', () => {
        describe('required', () => {
            describe('usage', () => {
                it('nameRequired example', () => {
                    const nameRequired = required({
                        message: 'Name is required'
                    });

                    const result = validate(nameRequired, '');

                    expect(result).toMatchObject({
                        required: true,
                        message: 'Name is required',
                        isValid: false,
                        value: ''
                    });
                });

                it('required by default', () => {
                    const a = required();
                    expect(validate(a, '')).toMatchObject({
                        required: true,
                        isValid: false
                    })
                });

                it('supplying the `required` named prop', () => {
                    const b = required({
                        required: true,
                        message: '"Name" is required'
                    });

                    expect(validate(b, '')).toMatchObject({
                        required: true,
                        message: '"Name" is required',
                        isValid: false
                    })
                });

                it('using a function to resolve the required prop along with validator props', () => {
                    const c = required((context) => ({
                        required: context.required,
                        message: context.required ?
                            '"Name" is required' :
                            '"Name" is optional'
                    }));

                    expect(validate(c, '', {required: true})).toMatchObject({
                        required: true,
                        message: '"Name" is required',
                        isValid: false
                    })
                });
            });
        });

        describe('compare', () => {
            it('as a named prop', () => {
                const letterA = compare({
                    compare: 'A',
                    message: 'Must be the letter "A"'
                });

                expect(validate(letterA, 'Z')).toMatchObject({
                    isValid: false,
                    compare: 'A',
                    value: 'Z',
                    message: 'Must be the letter "A"'
                });
            });

            it('as a function that resolves to have the named prop', () => {
                const letterValidator = compare((context) => ({
                    compare: context.compare,
                    message: `Must match "${context.compare}"`
                }));

                expect(validate(letterValidator, 'Z', {compare: 'Y'})).toMatchObject({
                    isValid: false,
                    compare: 'Y',
                    value: 'Z',
                    message: 'Must match "Y"'
                });
            });
        });

        describe('min', () => {
            it('as a named prop', () => {
                const minOf2 = min({
                    min: 2,
                    message: 'Must be at least 2'}
                );

                expect(validate(minOf2, 5)).toMatchObject({
                    isValid: true,
                    value: 5,
                    min: 2,
                    message: 'Must be at least 2'
                });
            });

            it('as a function that resolves to have the named prop', () => {
                const minValidator = min((context) => ({
                    min: context.min,
                    message: `Must be at least ${context.min}`
                }));

                expect(validate(minValidator, 5, {min: 4})).toMatchObject({
                    isValid: true,
                    value: 5,
                    min: 4,
                    message: 'Must be at least 4'
                });
            });
        });

        describe('max', () => {
            it('as a named prop', () => {
                const maxOf2 = max({
                    max: 2,
                    message: 'Must be at most 2'}
                );

                expect(validate(maxOf2, 5)).toMatchObject({
                    isValid: false,
                    value: 5,
                    max: 2,
                    message: 'Must be at most 2'
                });
            });

            it('as a function that resolves to have the named prop', () => {
                const maxValidator = max((context) => ({
                    max: context.max,
                    message: `Must be at most ${context.max}`
                }));

                expect(validate(maxValidator, 5, {max: 4})).toMatchObject({
                    isValid: false,
                    value: 5,
                    max: 4,
                    message: 'Must be at most 4'
                });
            });
        });

        describe('range', () => {
            it('as named props', () => {
                const between10and20 = range({
                    min: 10,
                    max: 20,
                    message: 'Must be between 10 and 20'
                });

                expect(validate(between10and20, 5)).toMatchObject({
                    isValid: false,
                    value: 5,
                    min: 10,
                    max: 20,
                    message: 'Must be between 10 and 20'
                });
            });

            it('as a function that resolves to have the named props', () => {
                const rangeValidator = range((context) => ({
                    min: context.min,
                    max: context.max,
                    message: `Must be between ${context.min} and ${context.max}`
                }));

                expect(validate(rangeValidator, 5, {min: 10, max: 20})).toMatchObject({
                    isValid: false,
                    value: 5,
                    min: 10,
                    max: 20,
                    message: 'Must be between 10 and 20'
                });
            });
        });

        describe('minLength', () => {
            it('as a named prop', () => {
                const minLengthOf2 = minLength({
                    minLength: 2,
                    message: 'Must have a length of at least 2'
                });

                expect(validate(minLengthOf2, 'ABCDE')).toMatchObject({
                    isValid: true,
                    value: 'ABCDE',
                    minLength: 2,
                    message: 'Must have a length of at least 2'
                });
            });

            it('as a function that resolves to have the named prop', () => {
                const minLengthValidator = minLength((context) => ({
                    minLength: context.minLength,
                    message: `Must have a length of at least ${context.minLength}`
                }));

                expect(validate(minLengthValidator, 'ABCDE', {minLength: 4})).toMatchObject({
                    isValid: true,
                    value: 'ABCDE',
                    minLength: 4,
                    message: 'Must have a length of at least 4'
                });
            });
        });

        describe('maxLength', () => {
            it('as a named prop', () => {
                const maxLengthOf2 = maxLength({
                    maxLength: 2,
                    message: 'Must have a length of at most 2'
                });

                expect(validate(maxLengthOf2, 'ABCDE')).toMatchObject({
                    isValid: false,
                    value: 'ABCDE',
                    maxLength: 2,
                    message: 'Must have a length of at most 2'
                });
            });

            it('as a function that resolves to have the named prop', () => {
                const maxLengthValidator = maxLength((context) => ({
                    maxLength: context.maxLength,
                    message: `Must have a length of at most ${context.maxLength}`
                }));

                expect(validate(maxLengthValidator, 'ABCDE', {maxLength: 4})).toMatchObject({
                    isValid: false,
                    value: 'ABCDE',
                    maxLength: 4,
                    message: 'Must have a length of at most 4'
                });
            });
        });

        describe('length', () => {
            it('as named props', () => {
                const maxLengthBetween10and20 = length({
                    minLength: 10,
                    maxLength: 20,
                    message: 'Must have a length between 10 and 20'
                });

                expect(validate(maxLengthBetween10and20, 'ABCDE')).toMatchObject({
                    isValid: false,
                    value: 'ABCDE',
                    minLength: 10,
                    maxLength: 20,
                    message: 'Must have a length between 10 and 20'
                });
            });

            it('as a function that resolves to have the named props', () => {
                const lengthValidator = length((context) => ({
                    minLength: context.minLength,
                    maxLength: context.maxLength,
                    message: `Must have a length between ${context.minLength} and ${context.maxLength}`
                }));

                expect(validate(lengthValidator, 'ABCDE', {minLength: 10, maxLength: 20})).toMatchObject({
                    isValid: false,
                    value: 'ABCDE',
                    minLength: 10,
                    maxLength: 20,
                    message: 'Must have a length between 10 and 20'
                });
            });
        });
    });

    describe('composition', () => {
        it('arrays of validators', () => {
            function everyValidator(validators) {
                return function validateEvery(value, context) {
                    let result = {
                        value,
                        isValid: true
                    };

                    validators.every((validator) => {
                        let validatorResult = validate(
                            validator, value, context
                        );

                        result = {
                            ...result,
                            ...validatorResult,
                            isValid: validatorResult.isValid
                        };

                        return result.isValid;
                    });

                    return result;
                }
            }

            const mustExistWithLength5 = everyValidator([
                required(),
                minLength({minLength: 5})
            ]);

            const result = validate(mustExistWithLength5, '1234', {
                message: 'Must have a length of at least 5'
            });

            expect(result).toMatchObject({
                isValid: false,
                value: '1234',
                required: true,
                minLength: 5,
                length: 4
            });
        });

        describe('every', () => {
            it('atLeast5Chars', () => {
                const atLeast5Chars = every(
                    [
                        required(),
                        minLength({minLength: 5})
                    ],
                    {message: 'Must have at least 5 characters'}
                );

                const result = validate(atLeast5Chars, '1234');

                expect(result).toMatchObject({
                    isValid: false,
                    value: '1234',
                    length: 4,
                    required: true,
                    minLength: 5,
                    message: 'Must have at least 5 characters'
                });
            });

            it('requiredWithMinLength', () => {
                const requiredWithMinLength = every(
                    [
                        required(),
                        minLength((context) => ({minLength: context.minLength}))
                    ],
                    (context) => ({message: `Must have at least ${context.minLength} characters`})
                );

                const result = validate(requiredWithMinLength, '1234', {minLength: 5});

                expect(result).toMatchObject({
                    isValid: false,
                    value: '1234',
                    length: 4,
                    required: true,
                    minLength: 5,
                    message: 'Must have at least 5 characters'
                });
            });

            it('mustExistWithLength5to10', () => {
                const mustExistWithLength5to10 = every([
                    required({message: 'Required'}),
                    minLength({minLength: 5, message: 'Must have at least 5 characters'}),
                    maxLength({maxLength: 10, message: 'Must have at most 10 characters'})
                ]);

                const result = validate(mustExistWithLength5to10, '1234');

                expect(result).toMatchObject({
                    isValid: false,
                    value: '1234',
                    required: true,
                    minLength: 5,
                    message: 'Must have at least 5 characters',
                    every: [
                        {
                            isValid: true,
                            value: '1234',
                            required: true,
                            message: 'Required'
                        },
                        {
                            isValid: false,
                            value: '1234',
                            minLength: 5,
                            message: 'Must have at least 5 characters'
                        }
                    ]
                });
            });
        });

        describe('each', () => {
            it('atLeast5Chars', () => {
                const atLeast5Chars = each(
                    [
                        required(),
                        minLength({minLength: 5})
                    ],
                    {message: 'Must have at least 5 characters'}
                );

                const result = validate(atLeast5Chars, '1234');

                expect(result).toMatchObject({
                    isValid: false,
                    value: '1234',
                    length: 4,
                    required: true,
                    minLength: 5,
                    message: 'Must have at least 5 characters'
                });
            });

            it('requiredWithMinLength', () => {
                const requiredWithMinLength = each(
                    [
                        required(),
                        minLength((context) => ({minLength: context.minLength}))
                    ],
                    (context) => ({message: `Must have at least ${context.minLength} characters`})
                );

                const result = validate(requiredWithMinLength, '1234', {minLength: 5});

                expect(result).toMatchObject({
                    isValid: false,
                    value: '1234',
                    length: 4,
                    required: true,
                    minLength: 5,
                    message: 'Must have at least 5 characters'
                });
            });

            it('mustExistWithLength5to10', () => {
                const mustExistWithLength5to10 = each([
                    required({message: 'Required'}),
                    minLength({minLength: 5, message: 'Must have at least 5 characters'}),
                    maxLength({maxLength: 10, message: 'Must have at most 10 characters'})
                ]);

                const result = validate(mustExistWithLength5to10, '1234');

                expect(result).toMatchObject({
                    isValid: false,
                    value: '1234',
                    required: true,
                    minLength: 5,
                    message: 'Must have at most 10 characters',
                    each: [
                        {
                            isValid: true,
                            value: '1234',
                            required: true,
                            message: 'Required'
                        },
                        {
                            isValid: false,
                            value: '1234',
                            minLength: 5,
                            message: 'Must have at least 5 characters'
                        },
                        {
                            isValid: true,
                            value: '1234',
                            maxLength: 10,
                            message: 'Must have at most 10 characters'
                        }
                    ]
                });
            });
        });

        describe('some', () => {
            const max5orMin10orValue7 = some([
                max({max: 5}),
                min({min: 10}),
                compare({compare: 7})
            ]);

            const result = validate(max5orMin10orValue7, 12);

            expect(result).toMatchObject({
                isValid: true,
                value: 12,
                max: 5,
                min: 10,
                some: [
                    {
                        isValid: false,
                        value: 12,
                        max: 5
                    },
                    {
                        isValid: true,
                        value: 12,
                        min: 10
                    }
                ]
            });
        });

        describe('props', () => {
            it('parameters', () => {
                const validateProps = props({
                    firstName: every([required(), length({minLength: 2, maxLength: 20})]),
                    lastName: every([required(), length({minLength: 2, maxLength: 20})]),
                    birthYear: range({min: 1900, max: 2018})
                }, {
                    message: 'The person must be valid'
                });

                const result = validate(validateProps, {});

                expect(result).toMatchObject({
                    isValid: false,
                    message: 'The person must be valid'
                });
            });

            it('validation context', () => {
                const validateProps = props({
                    firstName: every([
                        required(),
                        length((context) => ({
                            minLength: context.minLength,
                            maxLength: context.maxLength
                        }))
                    ]),
                    lastName: every([
                        required(),
                        length((context) => ({
                            minLength: context.minLength,
                            maxLength: context.maxLength
                        }))
                    ]),
                    birthYear: range((context) => ({
                        min: context.min,
                        max: context.max
                    }))
                }, {
                    message: 'The person must be valid'
                });

                // Create a person
                const person = {
                    firstName: 'Stanford',
                    lastName: 'Strickland',
                    birthYear: 1925
                };

                const result = validate(validateProps, person, {
                    props: {
                        firstName: {
                            minLength: 5,
                            maxLength: 20
                        },
                        lastName: {
                            minLength: 8,
                            maxLength: 23
                        },
                        birthYear: {
                            min: 1900,
                            max: 2018
                        }
                    }
                });

                expect(result).toMatchObject({
                    props: {
                        firstName: {
                            minLength: 5,
                            maxLength: 20
                        },
                        lastName: {
                            minLength: 8,
                            maxLength: 23
                        },
                        birthYear: {
                            min: 1900,
                            max: 2018
                        }
                    }
                });
            });

            it('result properties', () => {
                // Define the rules for first name, last name, and birthYear
                const validatePersonProps = props({
                    firstName: every([required(), length({minLength: 2, maxLength: 20})]),
                    lastName: every([required(), length({minLength: 2, maxLength: 20})]),
                    birthYear: range({min: 1900, max: 2018})
                });

                // Create a person
                const person = {
                    firstName: 'Stanford',
                    lastName: 'Strickland',
                    birthYear: 1925
                };

                const result = validate(validatePersonProps, person);

                expect(result).toMatchObject({
                    isValid: true,
                    value: person,
                    props: {
                        firstName: {
                            isValid: true,
                            value: 'Stanford',
                            required: true,
                            minLength: 2,
                            maxLength: 20,
                            every: [
                                {
                                    isValid: true,
                                    value: 'Stanford',
                                    required: true
                                },
                                {
                                    isValid: true,
                                    value: 'Stanford',
                                    minLength: 2,
                                    maxLength: 20
                                }
                            ]
                        },
                        lastName: {
                            isValid: true,
                            value: 'Strickland',
                            required: true,
                            minLength: 2,
                            maxLength: 20,
                            every: [
                                {
                                    isValid: true,
                                    value: 'Strickland',
                                    required: true
                                },
                                {
                                    isValid: true,
                                    value: 'Strickland',
                                    minLength: 2,
                                    maxLength: 20
                                }
                            ]
                        },
                        birthYear: {
                            isValid: true,
                            value: 1925,
                            min: 1900,
                            max: 2018
                        }
                    }
                });
            });
        });

        it('advanced object validation', () => {
            // Define the rules for first name, last name, and birthYear
            const validatePersonProps = props({
                firstName: every([required(), length({minLength: 2, maxLength: 20})]),
                lastName: every([required(), length({minLength: 2, maxLength: 20})]),
                birthYear: range({min: 1900, max: 2018})
            });

            function stanfordStricklandBornIn1925(person) {
                if (!person) {
                    // If there's no person provided, return valid and
                    // rely on `required` to ensure a person exists
                    return true;
                }

                const {firstName, lastName} = person;

                if (firstName === 'Stanford' && lastName === 'Strickland') {
                    return (person.birthYear === 1925);
                }

                return true;
            }

            const validatePerson = every([
                required(),
                validatePersonProps,
                stanfordStricklandBornIn1925
            ]);

            // Create a person
            const person = {
                firstName: 'Stanford',
                lastName: 'Strickland',
                birthYear: 1925
            };

            const result = validate(validatePerson, person);
            expect(result.isValid).toBe(true);
        });

        it('nested objects', () => {
            const validatePerson = props({
                name: every([required(), length({minLength: 5, maxLength: 40})]),
                address: props({
                    street: props({
                        number: every([required(), range({min: 1, max: 99999})]),
                        name: every([required(), length({minLength: 2, maxLength: 40})])
                    }),
                    city: required(),
                    state: every([required(), length({minLength: 2, maxLength: 2})])
                })
            });

            const person = {
                name: 'Marty McFly',
                address: {
                    street: {
                        number: 9303,
                        name: 'Lyon Drive'
                    },
                    city: 'Hill Valley',
                    state: 'CA'
                }
            };

            const result = validate(validatePerson, person);
            expect(result.isValid).toBe(true);
        });

        it('conventions', () => {
            const validatePerson = [
                required(),
                {
                    name: [required(), length({minLength: 5, maxLength: 40})],
                    address: [
                        required(),
                        {
                            street: [
                                required(),
                                {
                                    number: [required(), range({min: 1, max: 99999})],
                                    name: [required(), length({minLength: 2, maxLength: 40})]
                                }
                            ],
                            city: required(),
                            state: [required(), length({minLength: 2, maxLength: 2})]
                        }
                    ]
                }
            ];

            const person = {
                name: 'Stanford Strickland',
                address: {
                    city: 'Hill Valley',
                    state: 'CA'
                }
            };

            const result = validate(validatePerson, person);
            expect(result.isValid).toBe(false);
        });
    });

    describe('async validation', () => {
        function usernameIsAvailable(username) {
            return new Promise((resolve) => {
                if (username === 'marty') {
                    // Resolve to an invalid validation result object
                    resolve({
                        isValid: false,
                        message: `"${username}" is not available`
                    });
                }

                // Resolve to a boolean
                resolve(true);
            });
        }

        describe('readme', () => {
            it('introduction', () => {
                expect.assertions(1);

                const result = validate(usernameIsAvailable, 'marty');

                result.validateAsync().then((asyncResult) => {
                    expect(asyncResult).toMatchObject({
                        isValid: false,
                        value: 'marty',
                        message: '"marty" is not available'
                    });
                });
            });

            it('resolving', () => {
                expect.assertions(1);

                const result = validate(usernameIsAvailable, 'marty');
                const handleValidationResult = jest.fn();

                if (result.validateAsync) {
                    return result.validateAsync().then((asyncResult) => handleValidationResult(asyncResult)).then(() => {
                        expect(handleValidationResult).toHaveBeenCalledWith(expect.objectContaining({
                            isValid: false,
                            value: 'marty',
                            message: '"marty" is not available'
                        }));
                    });
                } else {
                    handleValidationResult(result);
                    expect(handleValidationResult).not.toHaveBeenCalled(); // test should not reach here
                }
            });

            it('deferring async validation', () => {
                function usernameIsAvailableDeferred(username) {
                    return function validateUsernameAsync() {
                        return new Promise((resolve) => {
                            if (username === 'marty') {
                                // Resolve to an invalid validation result object
                                resolve({
                                    isValid: false,
                                    message: `"${username}" is not available`
                                });
                            }

                            // Resolve to a boolean
                            resolve(true);
                        });
                    }
                }

                const result = validate(usernameIsAvailableDeferred, 'marty');

                result.validateAsync().then((asyncResult) => {
                    expect(asyncResult).toMatchObject({
                        isValid: false,
                        value: 'marty',
                        message: '"marty" is not available'
                    });
                });
            });

            it('validateAsync', () => {
                expect.assertions(1);

                const result = validateAsync(usernameIsAvailable, 'marty');
                const handleValidationResult = jest.fn();

                return result.then((asyncResult) => handleValidationResult(asyncResult)).then(() => {
                    expect(handleValidationResult).toHaveBeenCalledWith(expect.objectContaining({
                        isValid: false,
                        value: 'marty',
                        message: '"marty" is not available'
                    }));
                });
            });
        });

        it('async arrays and objects', () => {
            expect.assertions(1);

            function validateCity(address) {
                return new Promise((resolve) => {
                    if (!address) {
                        resolve(true);
                    }

                    const {city, state} = address;

                    if (city === 'Hill Valley' && state !== 'CA') {
                        resolve({
                            isValid: false,
                            message: 'Hill Valley is in California'
                        });
                    } else {
                        resolve(true);
                    }
                });
            }

            const validatePerson = {
                name: [
                    required(),
                    length({
                        minLength: 2,
                        maxLength: 20,
                        message: 'Name must be 2-20 characters'
                    })
                ],
                username: [
                    required(),
                    length({minLength: 2, maxLength: 20}),
                    usernameIsAvailable
                ],
                address: [
                    required({message: 'Address is required'}),
                    {
                        street: [required(), length({minLength: 2, maxLength: 40})],
                        city: [required(), length({minLength: 2, maxLength: 40})],
                        state: [required(), length({minLength: 2, maxLength: 2})]
                    },
                    validateCity
                ]
            };

            const person = {
                name: 'Marty McFly',
                username: 'marty',
                address: {
                    street: '9303 Lyon Dr.',
                    city: 'Hill Valley',
                    state: 'WA'
                }
            };

            return validateAsync(validatePerson, person).then((result) => {
                expect(result).toMatchObject({
                    isValid: false,
                    props: {
                        name: {
                            isValid: true,
                            value: 'Marty McFly'
                        },
                        username: {
                            isValid: false,
                            value: 'marty',
                            message: '"marty" is not available'
                        },
                        address: {
                            isValid: false,
                            message: 'Hill Valley is in California',
                            props: {
                                street: {isValid: true},
                                city: {isValid: true},
                                state: {isValid: true}
                            }
                        }
                    }
                });
            });
        });

        describe('two-stage validation', () => {
            function usernameIsAvailableTwoStage(username) {
                if (!username) {
                    // Do not check availability of an empty username

                    // Return just a boolean - it will be
                    // converted to a valid result
                    return true;
                }

                // Return an initial result indicating the value is
                // not (yet) valid, but availability will be checked
                return {
                    isValid: false,
                    message: `Checking availability of "${username}"...`,
                    validateAsync() {
                        return new Promise((resolve) => {
                            if (username === 'marty') {
                                resolve({
                                    isValid: false,
                                    message: `"${username}" is not available`
                                });
                            } else {
                                resolve({
                                    isValid: true,
                                    message: `"${username}" is available`
                                });
                            }
                        });
                    }
                };
            }

            const validateUser = {
                name: [
                    required(),
                    length({minLength: 2, maxLength: 20})
                ],
                username: [
                    required(),
                    length({minLength: 2, maxLength: 20}),
                    usernameIsAvailableTwoStage
                ]
            };

            const user = {
                name: 'Marty McFly',
                username: 'marty'
            };

            const result = validate(validateUser, user);

            it('first stage', () => {
                expect(result).toMatchObject({
                    isValid: false,
                    props: {
                        name: {
                            isValid: true,
                            value: 'Marty McFly'
                        },
                        username: {
                            isValid: false,
                            value: 'marty',
                            required: true,
                            minLength: 2,
                            maxLength: 20,
                            message: 'Checking availability of "marty"...',
                            validateAsync: expect.any(Function)
                        }
                    },
                    validateAsync: expect.any(Function)
                });
            });

            it('second stage', () => {
                expect.assertions(1);

                return result.validateAsync().then((asyncResult) => {
                    expect(asyncResult).toMatchObject({
                        isValid: false,
                        props: {
                            name: {
                                isValid: true,
                                value: 'Marty McFly'
                            },
                            username: {
                                isValid: false,
                                value: 'marty',
                                required: true,
                                minLength: 2,
                                maxLength: 20,
                                message: '"marty" is not available'
                            }
                        }
                    });
                });
            });

            describe('race conditions', () => {
                it('handled in application code', () => {
                    expect.assertions(1);
                    const resultUsed = jest.fn();

                    const validateUsername = [required(), length({minLength: 2, maxLength: 20}), usernameIsAvailableTwoStage];

                    let username = 'marty';
                    let usernameResult = validate(validateUsername, username);

                    username = 'mcfly';

                    if (usernameResult.validateAsync) {
                        return usernameResult.validateAsync().then((asyncResult) => {
                            if (asyncResult.value === username) {
                                // this will not be reached since
                                // the username has changed
                                usernameResult = asyncResult;
                                resultUsed();
                            }

                            expect(resultUsed).not.toHaveBeenCalled();
                        });
                    }
                });
            });
        });
    });

    describe('form validation', () => {
        const validatePerson = form({
            firstName: [required(), length({minLength: 2, maxLength: 20})],
            lastName: [required(), length({minLength: 2, maxLength: 20})],
            birthYear: range({min: 1900, max: 2018})
        });

        // Initialize the person with only a firstName
        let person = {
            firstName: 'Stanford'
        };

        // Validate the firstName field
        let result = validate(validatePerson, person, {
            form: {
                fields: ['firstName']
            }
        });

        describe('form', () => {
            it('validates firstName', () => {
                expect(result).toMatchObject({
                    isValid: false,
                    value: {
                        firstName: 'Stanford'
                    },
                    form: {
                        isComplete: false,
                        validationResults: {
                            firstName: {
                                isValid: true,
                                value: 'Stanford',
                                required: true,
                                minLength: 2,
                                maxLength: 20
                            }
                        },
                        validationErrors: []
                    }
                });
            });

            it('validates lastName', () => {
                // Add the lastName field
                person = {
                    firstName: 'Stanford',
                    lastName: 'Strickland'
                };

                // Validate the lastName field, build on
                // previous form validation results
                result = validate(validatePerson, person, {
                    form: {
                        ...result.form,
                        fields: ['lastName']
                    }
                });

                expect(result).toMatchObject({
                    isValid: false,
                    value: {
                        firstName: 'Stanford',
                        lastName: 'Strickland'
                    },
                    form: {
                        isComplete: false,
                        validationResults: {
                            firstName: {
                                isValid: true,
                                value: 'Stanford',
                                required: true,
                                minLength: 2,
                                maxLength: 20
                            },
                            lastName: {
                                isValid: true,
                                value: 'Strickland',
                                required: true,
                                minLength: 2,
                                maxLength: 20
                            }
                        },
                        validationErrors: []
                    }
                });
            });

            it('validates birthYear', () => {
                // Add a birthYear (that is invalid)
                person = {
                    ...person,
                    birthYear: 2020
                };

                // Validate the birthYear field
                result = validate(validatePerson, person, {
                    form: {
                        ...result.form,
                        fields: ['birthYear']
                    }
                });

                expect(result).toMatchObject({
                    isValid: false,
                    value: {
                        firstName: 'Stanford',
                        lastName: 'Strickland'
                    },
                    form: {
                        isComplete: true,
                        validationResults: {
                            firstName: {
                                isValid: true,
                                value: 'Stanford',
                                required: true,
                                minLength: 2,
                                maxLength: 20
                            },
                            lastName: {
                                isValid: true,
                                value: 'Strickland',
                                required: true,
                                minLength: 2,
                                maxLength: 20
                            },
                            birthYear: {
                                isValid: false,
                                value: 2020,
                                min: 1900,
                                max: 2018
                            }
                        },
                        validationErrors: [
                            {
                                fieldName: 'birthYear',
                                isValid: false,
                                value: 2020,
                                min: 1900,
                                max: 2018
                            }
                        ]
                    }
                });
            });
        });
    });
});
