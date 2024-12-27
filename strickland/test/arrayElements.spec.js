import { arrayElements, minLength, required } from '../src/strickland.js';
import { jest } from '@jest/globals';

describe('arrayElements', () => {
    it('returns a validate function', () => {
        const validate = arrayElements(() => true);
        expect(validate).toBeInstanceOf(Function);
    });

    describe('validates', () => {
        describe('null values', () => {
            const validate = arrayElements(() => true);
            const result = validate(null);

            it('as valid', () => {
                expect(result.isValid).toBe(true);
            });

            it('with an empty `arrayElements` result prop', () => {
                expect(result.arrayElements).toEqual([]);
            });
        });

        describe('with a validator that always returns true', () => {
            const validate = arrayElements(() => true);
            const result = validate([]);

            it('returns valid results', () => {
                expect(result.isValid).toBe(true);
            });

            it('returns an empty `arrayElements` result prop', () => {
                expect(result.arrayElements).toEqual([]);
            });
        });

        describe('that the value is an array', () => {
            const validate = arrayElements(() => true);
            const result = validate('ABC');

            it('returns an invalid result', () => {
                expect(result.isValid).toBe(false);
            });

            it('returns an empty `arrayElements` result prop', () => {
                expect(result.arrayElements).toEqual([]);
            });
        });

        describe('all elements of the array', () => {
            const validate = arrayElements(required());
            const result = validate([
                0,
                1,
                false,
                true,
                null,
                '',
                'ABC'
            ]);

            expect(result).toMatchObject({
                isValid: false,
                arrayElements: [
                    expect.objectContaining({isValid: true}),
                    expect.objectContaining({isValid: true}),
                    expect.objectContaining({isValid: false}),
                    expect.objectContaining({isValid: true}),
                    expect.objectContaining({isValid: false}),
                    expect.objectContaining({isValid: false}),
                    expect.objectContaining({isValid: true})
                ]
            });
        });

        it('with an array for rules', () => {
            const validate = arrayElements([required(), minLength(1)]);
            const result = validate(['ABC']);

            expect(result).toMatchObject({
                isValid: true,
                arrayElements: [
                    {
                        isValid: true,
                        required: true,
                        minLength: 1,
                        value: 'ABC'
                    }
                ]
            });
        });
    });

    describe('passes context to the validators', () => {
        const validator = jest.fn();

        const validate = arrayElements(validator);
        validate([true], {contextProp: 'Context prop'});

        it('from the validation context', () => {
            expect(validator).toHaveBeenCalledWith(true, expect.objectContaining({
                contextProp: 'Context prop'
            }));
        });
    });

    describe('allows context to be specified for individual elements', () => {
        const validator = jest.fn();
        const validate = arrayElements(validator);

        const context = {
            contextProp: 'Context prop',
            arrayElements: [{element: 'specific context'}]
        };

        validate([true], context);

        it('for top-level props', () => {
            expect(validator).toHaveBeenCalledWith(true, expect.objectContaining({
                contextProp: 'Context prop',
                element: 'specific context'
            }));
        });
    });

    describe('given async validators', () => {
        describe('returns a validateAsync function', () => {
            it('that returns a Promise', () => {
                const validate = arrayElements(() => Promise.resolve(true));
                const result = validate([true]);

                expect(result.validateAsync()).toBeInstanceOf(Promise);
            });
        });

        describe('resolves results', () => {
            it('resolves arrayElements result, without stopping at on invalid results', () => {
                const validate = arrayElements(() => Promise.resolve(false));
                const result = validate([1, 2, 3]);

                return expect(result.validateAsync()).resolves.toMatchObject({
                    arrayElements: [
                        expect.objectContaining({isValid: false, value: 1}),
                        expect.objectContaining({isValid: false, value: 2}),
                        expect.objectContaining({isValid: false, value: 3})
                    ]
                });
            });

            it('resolves arrayElements result, handling when some results are async and others are not', () => {
                const validate = arrayElements((value) => value ?
                    Promise.resolve({asyncResult: true}) :
                    {asyncResult: false}
                );

                const result = validate([true, false]);

                return expect(result.validateAsync()).resolves.toMatchObject({
                    arrayElements: [
                        expect.objectContaining({asyncResult: true}),
                        expect.objectContaining({asyncResult: false})
                    ]
                });
            });

            it('that resolve as true', () => {
                const validate = arrayElements(() => Promise.resolve(true));
                const result = validate([true]);

                return expect(result.validateAsync()).resolves.toMatchObject({
                    isValid: true,
                    arrayElements: [
                        expect.objectContaining({
                            isValid: true,
                            value: true
                        })
                    ]
                });
            });

            it('that resolve as a valid result object', () => {
                const validate = arrayElements(() => Promise.resolve({isValid: true}));
                const result = validate([true]);

                return expect(result.validateAsync()).resolves.toMatchObject({isValid: true});
            });

            it('that resolve as false', () => {
                const validate = arrayElements(() => Promise.resolve(false));
                const result = validate([true]);

                return expect(result.validateAsync()).resolves.toMatchObject({
                    isValid: false,
                    arrayElements: [
                        expect.objectContaining({
                            isValid: false,
                            value: true
                        })
                    ]
                });
            });

            it('that resolve as an invalid result object', () => {
                const validate = arrayElements(() => Promise.resolve({isValid: false}));
                const result = validate([true]);

                return expect(result.validateAsync()).resolves.toMatchObject({isValid: false});
            });

            it('recursively', () => {
                const validate = arrayElements([
                    () => Promise.resolve(
                        Promise.resolve(
                            Promise.resolve({
                                isValid: true,
                                recursively: 'Yes!'
                            })
                        )
                    ),
                    arrayElements([
                        () => Promise.resolve(
                            Promise.resolve(true)
                        ),
                        arrayElements(
                            () => Promise.resolve(
                                Promise.resolve({
                                    isValid: true,
                                    inNestedValidators: 'Yep'
                                })
                            )
                        )
                    ])
                ]);

                const value = [
                    [
                        [
                            true
                        ]
                    ]
                ];

                const result = validate(value);

                return expect(result.validateAsync()).resolves.toMatchObject({
                    isValid: true,
                    arrayElements: [
                        expect.objectContaining({
                            isValid: true,
                            recursively: 'Yes!',
                            arrayElements: [
                                expect.objectContaining({
                                    isValid: true,
                                    arrayElements: [
                                        expect.objectContaining({
                                            isValid: true,
                                            inNestedValidators: 'Yep'
                                        })
                                    ]
                                })
                            ]
                        })
                    ]
                });
            });

            it('puts validator props on the resolved result', () => {
                const validate = arrayElements(
                    () => Promise.resolve(true),
                    {validatorProp: 'Validator message'}
                );

                const result = validate([true]);

                return expect(result.validateAsync()).resolves.toMatchObject({
                    validatorProp: 'Validator message'
                });
            });

            it('does not put context props on the resolved result', () => {
                const validate = arrayElements(() => Promise.resolve(true));
                const result = validate([true], {message: 'Message'});

                return expect(result.validateAsync()).resolves.not.toHaveProperty('message');
            });
        });

        describe('returns a partial result object', () => {
            const validate = arrayElements((value) => {
                if (!value) {
                    return {isValid: true, async: false};
                }

                return () => Promise.resolve({isValid: true, async: true});
            });

            const result = validate([false, true]);

            it('that is marked as not valid', () => {
                expect(result.isValid).toBe(false);
            });

            it('with sync results in place and Promise results where expected', () => {
                expect(result).toMatchObject({
                    arrayElements: [
                        expect.objectContaining({
                            isValid: true,
                            async: false
                        }),
                        expect.objectContaining({
                            validateAsync: expect.any(Function)
                        })
                    ]
                });
            });

            it('with individual validator promises that will finish their results', () => {
                return expect(result.arrayElements[1].validateAsync()).resolves.toMatchObject({
                    isValid: true,
                    async: true,
                    value: true
                });
            });
        });
    });
});
