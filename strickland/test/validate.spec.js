import { jest } from '@jest/globals';
import validate, { minLength, required, validateAsync } from '../src/strickland.js';

describe('validate', () => {
    describe('throws', () => {
        it('with an undefined rules function', () => {
            expect(() => validate()).toThrow();
        });

        it('with a null rules function', () => {
            expect(() => validate(null)).toThrow();
        });

        it('with a numeric rules function', () => {
            expect(() => validate(1)).toThrow();
        });

        it('with a string rules function', () => {
            expect(() => validate('string')).toThrow();
        });

        it('with a result containing a validateAsync prop that is true', () => {
            expect(() => validate(() => ({validateAsync: true}))).toThrow();
        });

        it('with a result containing a validateAsync prop that is false', () => {
            expect(() => validate(() => ({validateAsync: false}))).toThrow();
        });

        it('with a result containing a validateAsync prop that is an object', () => {
            expect(() => validate(() => ({validateAsync: {isValid: false}}))).toThrow();
        });
    });

    describe('with rules function', () => {
        it('returns the validated value on the result', () => {
            const rules = () => true;
            const result = validate(rules, 'validated value');

            expect(result.value).toBe('validated value');
        });

        describe('returning true', () => {
            const rules = () => true;
            const result = validate(rules, 'value');

            it('returns an object with isValid set to true', () => {
                expect(result.isValid).toBe(true);
            });
        });

        describe('returning false', () => {
            const rules = () => false;
            const result = validate(rules, 'value');

            it('returns an object with isValid set to false', () => {
                expect(result.isValid).toBe(false);
            });
        });

        describe('returning an object', () => {
            it('returns an object with the rule result properties', () => {
                const ruleResult = {
                    message: 'That is not valid',
                    customProp: 'This is a custom property'
                };

                const rules = () => ruleResult;
                const result = validate(rules, 'value');

                const resultProps = {
                    message: result.message,
                    customProp: result.customProp
                };

                expect(resultProps).toEqual(ruleResult);
            });

            it('returns an object with isValid = false if the object does not specify isValid', () => {
                const ruleResult = {
                    message: 'That is not valid'
                };

                const rules = () => ruleResult;
                const result = validate(rules, 'value');

                expect(result.isValid).toBe(false);
            });

            describe('with isValid set to true', () => {
                const ruleResult = {
                    message: 'That is not valid',
                    isValid: true
                };

                const rules = () => ruleResult;
                const result = validate(rules, 'value');

                it('returns an object with an isValid prop set to true', () => {
                    expect(result.isValid).toBe(true);
                });
            });

            it('returns an object with isValid = true if the object has isValid set to a truthy value other than true', () => {
                const ruleResult = {
                    message: 'That is not valid',
                    isValid: 'Yep'
                };

                const rules = () => ruleResult;
                const result = validate(rules, 'value');

                expect(result.isValid).toBe(true);
            });

            it('returns invalid result if the object is marked as not valid', () => {
                const ruleResult = {
                    message: 'That is not valid',
                    isValid: false
                };

                const rules = () => ruleResult;
                const result = validate(rules, 'value');

                expect(result.isValid).toBe(false);
            });

            it('returns an invalid result if the object has isValid set to a falsy value other than false', () => {
                const ruleResult = {
                    message: 'That is not valid',
                    isValid: 0
                };

                const rules = () => ruleResult;
                const result = validate(rules, 'value');

                expect(result.isValid).toBe(false);
            });
        });

        it('passes context through', () => {
            const rules = jest.fn();
            validate(rules, null, {contextProp: 'Context'});

            expect(rules).toHaveBeenCalledWith(null, expect.objectContaining({contextProp: 'Context'}));
        });

        it('adds the value to an existing context', () => {
            const rules = jest.fn();
            validate(rules, 5, {contextProp: 'Context'});

            expect(rules).toHaveBeenCalledWith(5, expect.objectContaining({
                contextProp: 'Context',
                value: 5
            }));
        });

        it('creates a context with the value', () => {
            const rules = jest.fn();
            validate(rules, 5);

            expect(rules).toHaveBeenCalledWith(5, expect.objectContaining({
                value: 5
            }));
        });
    });

    describe('with rules array', () => {
        describe('with all rules returning valid results', () => {
            let secondCalled = false;

            const rules = [
                () => ({
                    isValid: true,
                    first: true
                }),
                () => {
                    secondCalled = true;

                    return {
                        isValid: true,
                        second: true
                    };
                }
            ];

            const result = validate(rules, 'value');

            it('returns a valid result', () => {
                expect(result.isValid).toBe(true);
            });

            it('includes props from the first validator', () => {
                expect(result.first).toBe(true);
            });

            it('includes props from the second validator', () => {
                expect(result.second).toBe(true);
            });

            it('calls the second validator', () => {
                expect(secondCalled).toBe(true);
            });
        });

        describe('with the first rule returning an invalid result', () => {
            let secondCalled = false;

            const rules = [
                () => ({
                    isValid: false,
                    first: true
                }),
                () => {
                    secondCalled = true;

                    return {
                        isValid: true,
                        second: false
                    };
                }
            ];

            const result = validate(rules, 'value');

            it('returns an invalid result', () => {
                expect(result.isValid).toBe(false);
            });

            it('includes props from the first validator on the result', () => {
                expect(result.first).toBe(true);
            });

            it('does not include props from the second validator', () => {
                expect(result.second).toBeUndefined();
            });

            it('does not call the second validator', () => {
                expect(secondCalled).toBe(false);
            });
        });
    });

    describe('with rules object', () => {
        describe('where each property defines rules', () => {
            const rules = {
                firstName: required(),
                lastName: [required(), minLength(2)]
            };

            const value = {
                firstName: 'First',
                lastName: 'Last'
            };

            const result = validate(rules, value);

            it('returns objectProps on the result', () => {
                expect(result.objectProps).not.toBeUndefined();
            });

            it('returns objectProps in the shape of the rules', () => {
                const keys = Object.keys(result.objectProps);
                expect(keys).toEqual(['firstName', 'lastName']);
            });

            it('returns objectProps being the results of the rules', () => {
                expect(result.objectProps).toMatchObject({
                    firstName: {
                        isValid: true,
                        value: 'First'
                    },
                    lastName: {
                        isValid: true,
                        value: 'Last',
                        minLength: 2
                    }
                });
            });

            it('returns valid results', () => {
                const validResult = validate(rules, value);
                expect(validResult.isValid).toBe(true);
            });

            it('returns invalid results', () => {
                const invalidValue = {
                    firstName: 'First',
                    lastName: 'L'
                };

                const invalidResult = validate(rules, invalidValue);
                expect(invalidResult.isValid).toBe(false);
            });
        });
    });

    describe('with hybrid object validators', () => {
        function validateWorkAddress(address) {
            const message = 'Work address must be on a St.';
            let isValidWorkAddress = true;

            if (address.street.name.indexOf(' St.') === -1) {
                isValidWorkAddress = false;
            }

            return {
                isValid: isValidWorkAddress,
                message
            };
        }

        const rules = {
            name: required({message: 'Name is required'}),
            workAddress: [
                // the pattern illustrated here is to first
                // ensure the address object is supplied
                // and then to validate its fields
                // and lastly perform object-level validation
                required({message: 'Work address is required'}),
                {
                    street: [
                        required({message: 'Street is required'}),
                        {
                            number: required({message: 'Street number is required'}),
                            name: required({message: 'Street name is required'})
                        }
                    ],
                    city: required({message: 'City is required'}),
                    state: required({message: 'State is required'})
                },
                validateWorkAddress
            ]
        };

        it('validates top-level object properties', () => {
            const value = {
                name: 'Name',
                workAddress: null
            };

            const result = validate(rules, value);

            expect(result).toMatchObject({
                isValid: false,
                objectProps: {
                    name: {isValid: true},
                    workAddress: {
                        isValid: false,
                        message: 'Work address is required'
                    }
                }
            });
        });

        it('validates nested object properties', () => {
            const value = {
                name: 'Name',
                workAddress: {
                    street: null,
                    city: '',
                    state: ''
                }
            };

            const result = validate(rules, value);

            expect(result).toMatchObject({
                objectProps: {
                    workAddress: {
                        objectProps: {
                            street: {
                                isValid: false,
                                message: 'Street is required'
                            },
                            city: {
                                isValid: false,
                                message: 'City is required'
                            },
                            state: {
                                isValid: false,
                                message: 'State is required'
                            }
                        }
                    }
                }
            });
        });

        it('validates custom validators for objects', () => {
            const value = {
                name: 'Name',
                workAddress: {
                    street: {
                        number: 123,
                        name: 'Hollywood Blvd.'
                    },
                    city: 'City',
                    state: 'ST'
                }
            };

            const result = validate(rules, value);

            expect(result).toMatchObject({
                objectProps: {
                    workAddress: {
                        isValid: false,
                        message: 'Work address must be on a St.'
                    }
                }
            });
        });
    });

    describe('with validation context', () => {
        it('passes those props into a validator function', () => {
            const validator = jest.fn();
            validate(validator, null, {contextProp: 'Context prop'});

            expect(validator).toHaveBeenCalledWith(null, expect.objectContaining({
                contextProp: 'Context prop'
            }));
        });

        it('passes those props into each validator in an array', () => {
            const validator = jest.fn();
            validate([validator], null, {contextProp: 'Context prop'});

            expect(validator).toHaveBeenCalledWith(null, expect.objectContaining({
                contextProp: 'Context prop'
            }));
        });

        it('passes those props into each validator on an object', () => {
            const validator = jest.fn();
            validate({first: validator}, {first: null}, {contextProp: 'Context prop'});

            expect(validator).toHaveBeenCalledWith(null, expect.objectContaining({
                contextProp: 'Context prop'
            }));
        });

        it('does not include context props on the result', () => {
            const validator = jest.fn();
            const result = validate({first: validator}, null, {contextProp: 'Context prop'});

            expect(result).not.toHaveProperty('contextProp');
        });
    });

    describe('given async validators', () => {
        describe('when the result is a Promise', () => {
            describe('resolving to true', () => {
                const result = validate(() => Promise.resolve(true));

                it('returns a result object with a validateAsync function', () => {
                    expect(result).toMatchObject({
                        isValid: false,
                        validateAsync: expect.any(Function)
                    });
                });

                it('the validateAsync function returns a Promise', () => {
                    expect(result.validateAsync()).toBeInstanceOf(Promise);
                });

                it('the async result is a valid result', () => {
                    return expect(result.validateAsync()).resolves.toMatchObject({
                        isValid: true
                    });
                });
            });

            describe('resolving to false', () => {
                const result = validate(() => Promise.resolve(false));

                it('returns a result object with a validateAsync function', () => {
                    expect(result).toMatchObject({
                        isValid: false,
                        validateAsync: expect.any(Function)
                    });
                });

                it('the validateAsync function returns a Promise', () => {
                    expect(result.validateAsync()).toBeInstanceOf(Promise);
                });

                it('the async result is an invalid result', () => {
                    return expect(result.validateAsync()).resolves.toMatchObject({
                        isValid: false
                    });
                });
            });

            describe('resolving to a result object', () => {
                const result = validate(() => Promise.resolve({isValid: true, message: 'async validation'}));

                it('returns a result object with a validateAsync function', () => {
                    expect(result).toMatchObject({
                        isValid: false,
                        validateAsync: expect.any(Function)
                    });
                });

                it('the validateAsync function returns a Promise', () => {
                    expect(result.validateAsync()).toBeInstanceOf(Promise);
                });

                it('the async result is an invalid result', () => {
                    return expect(result.validateAsync()).resolves.toMatchObject({
                        isValid: true,
                        message: 'async validation'
                    });
                });
            });
        });

        describe('when the result is a function', () => {
            describe('returning true', () => {
                const result = validate(() => () => true);

                it('returns a result object with a validateAsync function', () => {
                    expect(result).toMatchObject({
                        isValid: false,
                        validateAsync: expect.any(Function)
                    });
                });

                it('the validateAsync function returns a Promise', () => {
                    expect(result.validateAsync()).toBeInstanceOf(Promise);
                });

                it('the async result is a valid result', () => {
                    return expect(result.validateAsync()).resolves.toMatchObject({
                        isValid: true
                    });
                });
            });

            describe('returning false', () => {
                const result = validate(() => () => false);

                it('returns a result object with a validateAsync function', () => {
                    expect(result).toMatchObject({
                        isValid: false,
                        validateAsync: expect.any(Function)
                    });
                });

                it('the validateAsync function returns a Promise', () => {
                    expect(result.validateAsync()).toBeInstanceOf(Promise);
                });

                it('the async result is an invalid result', () => {
                    return expect(result.validateAsync()).resolves.toMatchObject({
                        isValid: false
                    });
                });
            });

            describe('returning a result object', () => {
                const result = validate(() => () => ({isValid: true, message: 'async validation'}));

                it('returns a result object with a validateAsync function', () => {
                    expect(result).toMatchObject({
                        isValid: false,
                        validateAsync: expect.any(Function)
                    });
                });

                it('the validateAsync function returns a Promise', () => {
                    expect(result.validateAsync()).toBeInstanceOf(Promise);
                });

                it('the async result is an invalid result', () => {
                    return expect(result.validateAsync()).resolves.toMatchObject({
                        isValid: true,
                        message: 'async validation'
                    });
                });
            });

            describe('returning a Promise', () => {
                describe('resolving to true', () => {
                    const result = validate(() => () => Promise.resolve(true));

                    it('returns a result object with a validateAsync function', () => {
                        expect(result).toMatchObject({
                            isValid: false,
                            validateAsync: expect.any(Function)
                        });
                    });

                    it('the validateAsync function returns a Promise', () => {
                        expect(result.validateAsync()).toBeInstanceOf(Promise);
                    });

                    it('the async result is a valid result', () => {
                        return expect(result.validateAsync()).resolves.toMatchObject({
                            isValid: true
                        });
                    });
                });

                describe('resolving to false', () => {
                    const result = validate(() => () => Promise.resolve(false));

                    it('returns a result object with a validateAsync function', () => {
                        expect(result).toMatchObject({
                            isValid: false,
                            validateAsync: expect.any(Function)
                        });
                    });

                    it('the validateAsync function returns a Promise', () => {
                        expect(result.validateAsync()).toBeInstanceOf(Promise);
                    });

                    it('the async result is an invalid result', () => {
                        return expect(result.validateAsync()).resolves.toMatchObject({
                            isValid: false
                        });
                    });
                });

                describe('resolving to a result object', () => {
                    const result = validate(() => () => Promise.resolve({isValid: true, message: 'async validation'}));

                    it('returns a result object with a validateAsync function', () => {
                        expect(result).toMatchObject({
                            isValid: false,
                            validateAsync: expect.any(Function)
                        });
                    });

                    it('the validateAsync function returns a Promise', () => {
                        expect(result.validateAsync()).toBeInstanceOf(Promise);
                    });

                    it('the async result is an invalid result', () => {
                        return expect(result.validateAsync()).resolves.toMatchObject({
                            isValid: true,
                            message: 'async validation'
                        });
                    });
                });
            });
        });

        describe('validateAsync resolves results automatically', () => {
            it('that are not async', () => {
                const result = validateAsync(() => true);
                return expect(result).resolves.toMatchObject({isValid: true});
            });

            it('that resolve as true', () => {
                const result = validateAsync(() => Promise.resolve(true));
                return expect(result).resolves.toMatchObject({isValid: true});
            });

            it('that resolve as a valid result object', () => {
                const result = validateAsync(() => Promise.resolve({isValid: true}));
                return expect(result).resolves.toMatchObject({isValid: true});
            });

            it('that resolve as false', () => {
                const result = validateAsync(() => Promise.resolve(false));
                return expect(result).resolves.toMatchObject({isValid: false});
            });

            it('that resolve as an invalid result object', () => {
                const result = validateAsync(() => Promise.resolve({isValid: false}));
                return expect(result).resolves.toMatchObject({isValid: false});
            });

            it('recursively', () => {
                const result = validateAsync(() =>
                    Promise.resolve(
                        Promise.resolve(
                            Promise.resolve({
                                isValid: true,
                                recursively: 'Yes!'
                            })
                        )
                    )
                );

                return expect(result).resolves.toMatchObject({isValid: true, recursively: 'Yes!'});
            });

            it('puts the value on the resolved result', () => {
                const result = validateAsync(() => Promise.resolve(true), 'ABC');
                return expect(result).resolves.toMatchObject({value: 'ABC'});
            });

            it('does not put context props on the resolved result', () => {
                const result = validateAsync(() => Promise.resolve(true), 'ABC', {message: 'Message'});
                return expect(result).resolves.not.toHaveProperty('message');
            });

            it('consuming the value from a value function', () => {
                const result = validateAsync(
                    () => Promise.resolve(true),
                    () => 'ABC'
                );

                return expect(result).resolves.toMatchObject({
                    value: 'ABC'
                });
            });

            it('fetches the value 3 times (before sync validation, before async validation, after async validation)', () => {
                const getValue = jest.fn().mockReturnValue('ABC');

                return validateAsync(() => Promise.resolve(true), getValue)
                    .then(() => expect(getValue).toHaveBeenCalledTimes(3));
            });

            it('rejecting the result if the value changes before async validation', () => {
                const getValue = jest.fn()
                    .mockReturnValueOnce('ABC')
                    .mockReturnValue('DEF');

                const result = validateAsync(
                    () => Promise.resolve(true),
                    getValue
                );

                return expect(result).rejects.toMatchObject({
                    value: 'ABC',
                    validateAsync: expect.any(Function)
                });
            });

            it('rejecting the result if the value changes during async validation', () => {
                const getValue = jest.fn()
                    .mockReturnValueOnce('ABC')
                    .mockReturnValueOnce('ABC')
                    .mockReturnValue('DEF');

                const result = validateAsync(
                    () => Promise.resolve(true),
                    getValue
                );

                return expect(result).rejects.toMatchObject({
                    value: 'ABC'
                });
            });
        });

        describe('validate can return a partial result object', () => {
            const validator = () => Promise.resolve({
                isValid: true,
                message: 'Resolved the promise'
            });

            const result = validate(validator);

            it('that is not a Promise', () => {
                expect(result).not.toBeInstanceOf(Promise);
            });

            it('that is marked as not valid', () => {
                expect(result.isValid).toBe(false);
            });

            it('where the partial result can include other props', () => {
                function partialWithProps() {
                    return {
                        validateAsync: Promise.resolve(true),
                        message: 'Validating...'
                    };
                }

                const partialResult = validate(partialWithProps);
                expect(partialResult.message).toBe('Validating...');
            });

            it('where the partial result can be valid', () => {
                function partialIsValid() {
                    return {
                        isValid: true,
                        validateAsync: Promise.resolve(false)
                    };
                }

                const partialResult = validate(partialIsValid);
                expect(partialResult.isValid).toBe(true);
            });
        });
    });
});
