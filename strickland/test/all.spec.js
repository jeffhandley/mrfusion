import { all, maxLength, minLength, required } from '../src/strickland.js';
import { jest } from '@jest/globals';

describe('all', () => {
    describe('throws', () => {
        it('when no validators are specified', () => {
            expect(() => all()).toThrow();
        });

        it('when validators is a function', () => {
            expect(() => all(() => true)).toThrow();
        });
    });

    it('returns a validate function', () => {
        const validate = all([]);
        expect(validate).toBeInstanceOf(Function);
    });

    it('defaults to valid when validators is empty', () => {
        const validate = all([]);
        const result = validate();
        expect(result.isValid).toBe(true);
    });

    describe('validates', () => {
        const validate = all([
            required({message: 'Required'}),
            minLength(2),
            maxLength(4)
        ], {validatorProp: 'Validator message'});

        const value = 'A';
        const result = validate(value);

        it('returning a result object', () => {
            expect(result).toBeInstanceOf(Object);
        });

        it('returning an all array on the result', () => {
            expect(result.all).toBeInstanceOf(Array);
        });

        it('returning results for all validators (including after invalid results)', () => {
            expect(result).toMatchObject({
                all: [
                    {isValid: true, message: 'Required'},
                    {isValid: false, minLength: 2},
                    {isValid: true, maxLength: 4}
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
                all: [
                    {isValid: true, message: 'Required'},
                    {isValid: true, minLength: 2},
                    {isValid: true, maxLength: 4}
                ]
            });
        });

        it('putting validator props on the result', () => {
            expect(result).toMatchObject({validatorProp: 'Validator message'});
        });

        it('resolving validator props from a function', () => {
            const getProps = jest.fn();
            const context = {contextProp: 'context'};
            all([], getProps)(null, context);

            expect(getProps).toHaveBeenCalledWith(context);
        });
    });

    describe('with nested rules arrays', () => {
        const validate = all([
            required({message: 'Required'}),
            all([
                minLength(2),
                maxLength(4)
            ])
        ]);

        it('returns results in the shape of the rules', () => {
            const result = validate('ABC');

            expect(result).toMatchObject({
                all: [
                    {isValid: true, message: 'Required'},
                    {
                        isValid: true,
                        all: [
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

            const validateWithResultProps = all([
                resultPropValidator({first: 'First'}),
                resultPropValidator({second: 'Second'}),
                all([
                    resultPropValidator({third: 'Third'}),
                    resultPropValidator({fourth: 'Fourth'}),
                    all([
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

    it('passes context to the validators', () => {
        const validator = jest.fn();
        const validate = all([validator], {validatorProp: 'Validator message'});

        validate('AB', {contextProp: 'Context message'});

        expect(validator).toHaveBeenCalledWith('AB', expect.objectContaining({
            contextProp: 'Context message'
        }));
    });

    describe('given async validators', () => {
        describe('returns a validateAsync function', () => {
            it('that returns a Promise', () => {
                const validate = all([
                    () => Promise.resolve(true)
                ]);

                const result = validate();
                expect(result.validateAsync()).toBeInstanceOf(Promise);
            });

            it('with exclusively nested results', () => {
                const validateNested = all([
                    all([
                        () => Promise.resolve(true)
                    ])
                ]);

                const nestedResult = validateNested('ABC');

                return expect(nestedResult.validateAsync()).resolves.toMatchObject({
                    isValid: true,
                    all: [
                        {
                            isValid: true,
                            all: [{isValid: true}]
                        }
                    ]
                });
            });
        });

        describe('resolves results', () => {
            it('resolves all result, even when some are invalid', () => {
                const validate = all([
                    () => ({isValid: false, first: 'First'}),
                    () => Promise.resolve({isValid: false, second: 'Second'}),
                    () => ({isValid: false, third: 'Third'}),
                    () => Promise.resolve({isValid: false, fourth: 'Fourth'}),
                    () => Promise.resolve({isValid: true, fifth: 'Fifth'})
                ]);

                const result = validate();

                return expect(result.validateAsync()).resolves.toMatchObject({
                    first: 'First',
                    second: 'Second',
                    third: 'Third',
                    fourth: 'Fourth',
                    fifth: 'Fifth'
                });
            });

            it('that resolve as true', () => {
                const validate = all([
                    () => Promise.resolve(true)
                ]);

                const result = validate();
                return expect(result.validateAsync()).resolves.toMatchObject({isValid: true});
            });

            it('that resolve as a valid result object', () => {
                const validate = all([
                    () => Promise.resolve({isValid: true})
                ]);

                const result = validate();
                return expect(result.validateAsync()).resolves.toMatchObject({isValid: true});
            });

            it('that resolve as false', () => {
                const validate = all([
                    () => Promise.resolve(false)
                ]);

                const result = validate();
                return expect(result.validateAsync()).resolves.toMatchObject({isValid: false});
            });

            it('that resolve as an invalid result object', () => {
                const validate = all([
                    () => Promise.resolve({isValid: false})
                ]);

                const result = validate();
                return expect(result.validateAsync()).resolves.toMatchObject({isValid: false});
            });

            it('recursively', () => {
                const validate = all([
                    () => Promise.resolve(
                        Promise.resolve(
                            Promise.resolve({
                                isValid: true,
                                recursively: 'Yes!'
                            })
                        )
                    ),
                    all([
                        () => Promise.resolve(
                            Promise.resolve(true)
                        ),
                        all([
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

                return expect(result.validateAsync()).resolves.toMatchObject({
                    isValid: true,
                    recursively: 'Yes!',
                    inNestedValidators: 'Yep'
                });
            });

            it('puts the value on the resolved result', () => {
                const validate = all([
                    () => Promise.resolve(true)
                ]);

                const result = validate('ABC');
                return expect(result.validateAsync()).resolves.toMatchObject({value: 'ABC'});
            });

            it('puts validator props on the resolved result', () => {
                const validate = all([
                    () => Promise.resolve(true)
                ], {validatorProp: 'Validator message'});

                const result = validate('ABC');
                return expect(result.validateAsync()).resolves.toMatchObject({validatorProp: 'Validator message'});
            });

            it('does not put context props on the resolved result', () => {
                const validate = all([
                    () => Promise.resolve(true)
                ]);

                const result = validate('ABC', {message: 'Message'});
                return expect(result.validateAsync()).resolves.not.toHaveProperty('message');
            });
        });

        describe('returns a partial result object', () => {
            const validate = all([
                () => ({isValid: true, first: 'First'}),
                () => Promise.resolve({isValid: true, second: 'Second'}),
                all([
                    () => ({isValid: true, third: 'Third'}),
                    () => Promise.resolve({isValid: true, fourth: 'Fourth'}),
                    () => ({isValid: true, fifth: 'Fifth'})
                ]),
                () => ({isValid: true, sixth: 'Sixth'})
            ]);

            const result = validate('ABC');

            it('that is marked as not valid', () => {
                expect(result.isValid).toBe(false);
            });

            it('with sync results in place and async results where expected', () => {
                expect(result).toMatchObject({
                    first: 'First',
                    third: 'Third',
                    fifth: 'Fifth',
                    sixth: 'Sixth',
                    all: [
                        {first: 'First'},
                        {validateAsync: expect.any(Function)},
                        {
                            third: 'Third',
                            fifth: 'Fifth',
                            all: [
                                {third: 'Third'},
                                {validateAsync: expect.any(Function)},
                                {fifth: 'Fifth'}
                            ]
                        },
                        {sixth: 'Sixth'}
                    ]
                });
            });

            it('with individual validator promises that will finish their results', () => {
                return expect(result.all[2].all[1].validateAsync()).resolves.toMatchObject({
                    isValid: true,
                    fourth: 'Fourth'
                });
            });
        });
    });
});
