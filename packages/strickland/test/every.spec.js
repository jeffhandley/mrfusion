import {every, required, minLength, maxLength} from '../src/strickland';

describe('every', () => {
    it('returns a validate function', () => {
        const validate = every();
        expect(validate).toBeInstanceOf(Function);
    });

    it('defaults to valid when there are no validators', () => {
        const validate = every();
        const result = validate();
        expect(result.isValid).toBe(true);
    });

    it('defaults to valid when validators is empty', () => {
        const validate = every([]);
        const result = validate();
        expect(result.isValid).toBe(true);
    });

    describe('validates', () => {
        const validate = every([
            required({message: 'Required'}),
            minLength(2),
            maxLength(4)
        ]);

        const value = 'A';
        const result = validate(value);

        it('returning a result object', () => {
            expect(result).toBeInstanceOf(Object);
        });

        it('returning an every array on the result', () => {
            expect(result.every).toBeInstanceOf(Array);
        });

        it('returning results for all valid validators and the first invalid validator', () => {
            expect(result).toMatchObject({
                every: [
                    {isValid: true, message: 'Required'},
                    {isValid: false, minLength: 2}
                ]
            });
        });

        it('returning a top-level isValid property', () => {
            expect(result.isValid).toBe(false);
        });

        it('producing valid results', () => {
            const validResult = validate('ABC');
            expect(validResult).toMatchObject({
                isValid: true,
                every: [
                    {isValid: true, message: 'Required'},
                    {isValid: true, minLength: 2},
                    {isValid: true, maxLength: 4}
                ]
            });
        });
    });

    describe('with nested rules arrays', () => {
        const validate = every([
            required({message: 'Required'}),
            [
                minLength(2),
                maxLength(4)
            ]
        ]);

        it('returns results in the shape of the rules', () => {
            const result = validate('ABC');

            expect(result).toMatchObject({
                every: [
                    {isValid: true, message: 'Required'},
                    {
                        isValid: true,
                        every: [
                            {isValid: true, minLength: 2},
                            {isValid: true, maxLength: 4}
                        ]
                    }
                ]
            });
        });

        it('flattens result props onto the top-level result', () => {
            function resultPropValidator(props) {
                return () => ({
                    ...props,
                    isValid: true
                });
            }

            const validateWithResultProps = every([
                resultPropValidator({first: 'First'}),
                resultPropValidator({second: 'Second'}),
                every([
                    resultPropValidator({third: 'Third'}),
                    resultPropValidator({fourth: 'Fourth'}),
                    every([
                        resultPropValidator({fifth: 'Fifth'})
                    ])
                ])
            ]);

            const result = validateWithResultProps();

            expect(result).toMatchObject({
                isValid: true,
                first: 'First',
                second: 'Second',
                third: 'Third',
                fourth: 'Fourth',
                fifth: 'Fifth'
            });
        });
    });

    describe('passes props to the validators', () => {
        const validate = every([required({message: 'Required'}), minLength(2)], {validatorProp: 'Validator'});
        const result = validate('AB', {validateProp: 'Validate'});

        it('from the validator definition', () => {
            expect(result).toMatchObject({
                validatorProp: 'Validator',
                every: [
                    {validatorProp: 'Validator', message: 'Required'},
                    {validatorProp: 'Validator', minLength: 2}
                ]
            });
        });

        it('from the validate function', () => {
            expect(result).toMatchObject({
                validateProp: 'Validate',
                every: [
                    {validateProp: 'Validate', message: 'Required'},
                    {validateProp: 'Validate', minLength: 2}
                ]
            });
        });

        it('overrides validation props with result props', () => {
            function validator() {
                return {
                    isValid: true,
                    message: 'From the result'
                };
            }

            const validateWithMessage = every([(validator)]);
            const resultWithMessage = validateWithMessage('AB', {message: 'From validation'})

            expect(resultWithMessage.message).toBe('From the result');
        });
    });

    describe('given async validators', () => {
        it('returns a Promise if a validator returns a Promise', () => {
            const validate = every([
                () => Promise.resolve(true)
            ]);

            const result = validate();
            expect(result).toBeInstanceOf(Promise);
        });

        describe('resolves results', () => {
            it('resolves until an invalid result is encountered', () => {
                const validate = every([
                    () => Promise.resolve({isValid: true, first: 'First'}),
                    () => Promise.resolve({isValid: true, second: 'Second'}),
                    () => Promise.resolve({isValid: true, third: 'Third'}),
                    () => Promise.resolve({isValid: false, fourth: 'Fourth'}),
                    () => Promise.resolve({isValid: true, fifth: 'Fifth'})
                ]);

                const result = validate();

                return expect(result).resolves.toMatchObject({
                    first: 'First',
                    second: 'Second',
                    third: 'Third',
                    fourth: 'Fourth'
                });
            });

            it('does not resolve results after an invalid result is encountered', () => {
                const validate = every([
                    () => Promise.resolve({isValid: true, first: 'First'}),
                    () => Promise.resolve({isValid: true, second: 'Second'}),
                    () => Promise.resolve({isValid: true, third: 'Third'}),
                    () => Promise.resolve({isValid: false, fourth: 'Fourth'}),
                    () => Promise.resolve({isValid: true, fifth: 'Fifth'})
                ]);

                const result = validate();
                return expect(result).resolves.not.toHaveProperty('fifth');
            });

            it('that resolve as true', () => {
                const validate = every([
                    () => Promise.resolve(true)
                ]);

                const result = validate('every with a promise');
                return expect(result).resolves.toMatchObject({isValid: true});
            });

            it('that resolve as a valid result object', () => {
                const validate = every([
                    () => Promise.resolve({isValid: true})
                ]);

                const result = validate();
                return expect(result).resolves.toMatchObject({isValid: true});
            });

            it('that resolve as false', () => {
                const validate = every([
                    () => Promise.resolve(false)
                ]);

                const result = validate();
                return expect(result).resolves.toMatchObject({isValid: false});
            });

            it('that resolve as an invalid result object', () => {
                const validate = every([
                    () => Promise.resolve({isValid: false})
                ]);

                const result = validate();
                return expect(result).resolves.toMatchObject({isValid: false});
            });

            it('recursively', () => {
                const validate = every([
                    () => Promise.resolve(
                        Promise.resolve(
                            Promise.resolve({
                                isValid: true,
                                recursively: 'Yes!'
                            })
                        )
                    ),
                    every([
                        () => Promise.resolve(
                            Promise.resolve(true)
                        ),
                        every([
                            () => Promise.resolve(
                                Promise.resolve({
                                    isValid: true,
                                    inNestedValidators: 'Yep'
                                })
                            )
                        ])
                    ])
                ]);

                const result = validate();

                return expect(result).resolves.toMatchObject({
                    isValid: true,
                    recursively: 'Yes!',
                    inNestedValidators: 'Yep'
                });
            });

            it('puts the value on the resolved result', () => {
                const validate = every([
                    () => Promise.resolve(true)
                ]);

                const result = validate('ABC');
                return expect(result).resolves.toMatchObject({value: 'ABC'});
            });

            it('puts validate props on the resolved result', () => {
                const validate = every([
                    () => Promise.resolve(true)
                ]);

                const result = validate('ABC', {message: 'Message'});
                return expect(result).resolves.toMatchObject({message: 'Message'});
            });
        });

        describe('can return a partial result object', () => {
            const validate = every([
                () => ({isValid: true, first: 'First'}),
                () => Promise.resolve({isValid: true, second: 'Second'}),
                every([
                    () => ({isValid: true, third: 'Third'}),
                    () => Promise.resolve({isValid: true, fourth: 'Fourth'}),
                    () => ({isValid: true, fifth: 'Fifth'})
                ]),
                () => ({isValid: true, sixth: 'Sixth'})
            ]);

            const result = validate('ABC', {resolvePromise: false});

            it('that is not a Promise', () => {
                expect(result).not.toBeInstanceOf(Promise);
            });

            it('that is marked as not valid', () => {
                expect(result.isValid).toBe(false);
            });

            it('with sync results in place and a Promise result where the first promise was', () => {
                expect(result).toMatchObject({
                    first: 'First',
                    every: [
                        {first: 'First'},
                        Promise.prototype
                    ]
                });
            });

            describe('with a resolvePromise result prop', () => {
                it('that is a Promise', () => {
                    expect(result.resolvePromise).toBeInstanceOf(Promise);
                });

                it('that resolves result promises', () => {
                    return expect(result.resolvePromise).resolves.toMatchObject({
                        isValid: true,
                        first: 'First',
                        second: 'Second',
                        third: 'Third',
                        fourth: 'Fourth',
                        fifth: 'Fifth',
                        sixth: 'Sixth',
                        every: [
                            {first: 'First'},
                            {second: 'Second'},
                            {
                                third: 'Third',
                                fourth: 'Fourth',
                                fifth: 'Fifth',
                                every: [
                                    {third: 'Third'},
                                    {fourth: 'Fourth'},
                                    {fifth: 'Fifth'}
                                ]
                            },
                            {sixth: 'Sixth'}
                        ]
                    });
                });

                it('that results in a resolvePromise prop set to false when resolved', () => {
                    return expect(result.resolvePromise).resolves.toMatchObject({
                        resolvePromise: false
                    });
                });

                it('that resolves exclusively nested results', () => {
                    const validateNested = every([
                        every([
                            () => Promise.resolve(true)
                        ])
                    ]);

                    const nestedResult = validateNested('ABC', {resolvePromise: false});

                    return expect(nestedResult.resolvePromise).resolves.toMatchObject({
                        isValid: true,
                        every: [
                            {
                                isValid: true,
                                every: [{isValid: true}]
                            }
                        ]
                    });
                });
            });
        });
    });
});
