import { jest } from '@jest/globals';
import { maxLength, minLength, required, some } from '../src/strickland.js';

describe('some', () => {
    describe('throws', () => {
        it('when no validators are specified', () => {
            expect(() => some()).toThrow();
        });

        it('when validators is a function', () => {
            expect(() => some(() => true)).toThrow();
        });
    });

    it('returns a validate function', () => {
        const validate = some([]);
        expect(validate).toBeInstanceOf(Function);
    });

    it('defaults to valid when validators is empty', () => {
        const validate = some([]);
        const result = validate();
        expect(result.isValid).toBe(true);
    });

    describe('validates', () => {
        const validate = some([
            required({message: 'Required'}),
            maxLength(4),
            minLength(2)
        ], {validatorProp: 'Validator message'});

        const value = '';
        const result = validate(value);

        it('returning a result object', () => {
            expect(result).toBeInstanceOf(Object);
        });

        it('returning a some array on the result', () => {
            expect(result.some).toBeInstanceOf(Array);
        });

        it('returning results for invalid validators and the first valid validator', () => {
            expect(result.some[0]).toMatchObject({isValid: false, message: 'Required'});
            expect(result.some[1]).toMatchObject({isValid: true, maxLength: 4});
        });

        it('returning a top-level isValid property (true when any result is valid)', () => {
            expect(result.isValid).toBe(true);
        });

        it('producing valid results', () => {
            const validResult = validate('ABC');
            expect(validResult).toMatchObject({
                isValid: true,
                some: [
                    {isValid: true, message: 'Required'}
                ]
            });
        });

        it('putting validator props on the result', () => {
            expect(result).toMatchObject({validatorProp: 'Validator message'});
        });

        it('resolving validator props from a function', () => {
            const getProps = jest.fn();
            const context = {contextProp: 'context'};
            some([], getProps)(null, context);

            expect(getProps).toHaveBeenCalledWith(context);
        });
    });

    describe('with nested rules arrays', () => {
        const validate = some([
            some([
                minLength(2),
                maxLength(4)
            ])
        ]);

        it('returns results in the shape of the rules', () => {
            const result = validate('A');

            expect(result).toMatchObject({
                some: [
                    {
                        isValid: true,
                        some: [
                            {isValid: false, minLength: 2},
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
                    isValid: false
                });
            }

            const validateWithResultProps = some([
                resultPropValidator({first: 'First'}),
                resultPropValidator({second: 'Second'}),
                some([
                    resultPropValidator({third: 'Third'}),
                    resultPropValidator({fourth: 'Fourth'}),
                    some([
                        resultPropValidator({fifth: 'Fifth'})
                    ])
                ])
            ]);

            const result = validateWithResultProps();

            expect(result).toMatchObject({
                isValid: false,
                first: 'First',
                second: 'Second',
                third: 'Third',
                fourth: 'Fourth',
                fifth: 'Fifth'
            });
        });
    });

    it('passes context to the validators', () => {
        const validator = jest.fn();
        const validate = some([validator], {validatorProp: 'Validator message'});

        validate('AB', {contextProp: 'Context message'});

        expect(validator).toHaveBeenCalledWith('AB', expect.objectContaining({
            contextProp: 'Context message'
        }));
    });

    describe('given async validators', () => {
        describe('returns a validateAsync function', () => {
            it('that returns a Promise', () => {
                const validate = some([
                    () => Promise.resolve(true)
                ]);

                const result = validate();
                expect(result.validateAsync()).toBeInstanceOf(Promise);
            });

            it('with exclusively nested results', () => {
                const validateNested = some([
                    some([
                        () => Promise.resolve(true)
                    ])
                ]);

                const nestedResult = validateNested('ABC');

                return expect(nestedResult.validateAsync()).resolves.toMatchObject({
                    isValid: true,
                    some: [
                        {
                            isValid: true,
                            some: [{isValid: true}]
                        }
                    ]
                });
            });
        });

        describe('resolves results', () => {
            it('until a valid result is encountered', () => {
                const validate = some([
                    () => ({isValid: false, first: 'First'}),
                    () => Promise.resolve({isValid: false, second: 'Second'}),
                    () => ({isValid: false, third: 'Third'}),
                    () => Promise.resolve({isValid: true, fourth: 'Fourth'}),
                    () => Promise.resolve({isValid: false, fifth: 'Fifth'})
                ]);

                const result = validate(null);

                return expect(result.validateAsync()).resolves.toMatchObject({
                    first: 'First',
                    second: 'Second',
                    third: 'Third',
                    fourth: 'Fourth'
                });
            });

            it('but does not execute validators after the first valid result', () => {
                const validate = some([
                    () => ({isValid: false, first: 'First'}),
                    () => Promise.resolve({isValid: false, second: 'Second'}),
                    () => ({isValid: false, third: 'Third'}),
                    () => Promise.resolve({isValid: true, fourth: 'Fourth'}),
                    () => Promise.resolve({isValid: false, fifth: 'Fifth'})
                ]);

                const result = validate();

                return expect(result.validateAsync()).resolves.not.toHaveProperty('fifth');
            });

            it('that resolve as true', () => {
                const validate = some([
                    () => Promise.resolve(true)
                ]);

                const result = validate();
                return expect(result.validateAsync()).resolves.toMatchObject({isValid: true});
            });

            it('that resolve as a valid result object', () => {
                const validate = some([
                    () => Promise.resolve({isValid: true})
                ]);

                const result = validate();
                return expect(result.validateAsync()).resolves.toMatchObject({isValid: true});
            });

            it('that resolve as false', () => {
                const validate = some([
                    () => Promise.resolve(false)
                ]);

                const result = validate();
                return expect(result.validateAsync()).resolves.toMatchObject({isValid: false});
            });

            it('that resolve as an invalid result object', () => {
                const validate = some([
                    () => Promise.resolve({isValid: false})
                ]);

                const result = validate();
                return expect(result.validateAsync()).resolves.toMatchObject({isValid: false});
            });

            it('recursively', () => {
                const validate = some([
                    () => Promise.resolve(
                        Promise.resolve(
                            Promise.resolve({
                                isValid: false,
                                recursively: 'Yes!'
                            })
                        )
                    ),
                    some([
                        () => Promise.resolve(
                            Promise.resolve(false)
                        ),
                        some([
                            () => Promise.resolve(
                                Promise.resolve({
                                    isValid: false,
                                    inNestedValidators: 'Yep'
                                })
                            )
                        ])
                    ])
                ]);

                const result = validate();

                return expect(result.validateAsync()).resolves.toMatchObject({
                    isValid: false,
                    recursively: 'Yes!',
                    inNestedValidators: 'Yep'
                });
            });

            it('puts the value on the resolved result', () => {
                const validate = some([
                    () => Promise.resolve(true)
                ]);

                const result = validate('ABC');
                return expect(result.validateAsync()).resolves.toMatchObject({value: 'ABC'});
            });

            it('puts validator props on the resolved result', () => {
                const validate = some([
                    () => Promise.resolve(true)
                ], {validatorProp: 'Validator message'});

                const result = validate('ABC');
                return expect(result.validateAsync()).resolves.toMatchObject({validatorProp: 'Validator message'});
            });

            it('does not put context props on the resolved result', () => {
                const validate = some([
                    () => Promise.resolve(true)
                ]);

                const result = validate('ABC', {message: 'Message'});
                return expect(result.validateAsync()).resolves.not.toHaveProperty('message');
            });
        });

        describe('returns a partial result object', () => {
            const validate = some([
                () => ({isValid: false, first: 'First'}),
                () => ({isValid: false, second: 'Second'}),
                some([
                    () => ({isValid: false, third: 'Third'}),
                    () => ({
                        fourth: 'Not yet resolved',
                        validateAsync: Promise.resolve({isValid: false, fourth: 'Fourth'})
                    }),
                    () => ({isValid: false, fifth: 'Fifth'})
                ]),
                () => ({isValid: false, sixth: 'Sixth'})
            ]);

            const result = validate('ABC');

            it('that is marked as not valid', () => {
                expect(result.isValid).toBe(false);
            });

            it('with sync results in place and Promise results where expected', () => {
                expect(result).toMatchObject({
                    first: 'First',
                    second: 'Second',
                    third: 'Third',
                    fourth: 'Not yet resolved',
                    some: [
                        {first: 'First'},
                        {second: 'Second'},
                        {
                            third: 'Third',
                            fourth: 'Not yet resolved',
                            some: [
                                {third: 'Third'},
                                {validateAsync: expect.any(Function)}
                            ]
                        }
                    ]
                });
            });

            it('with individual validator promises that will finish their results', () => {
                return expect(result.some[2].some[1].validateAsync()).resolves.toMatchObject({
                    isValid: false,
                    fourth: 'Fourth'
                });
            });
        });
    });
});
