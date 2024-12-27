import { jest } from '@jest/globals';
import validate, {
    validateAsync,
    required,
    length,
    every,
    minLength,
    arrayElements
} from '../../src/strickland';

describe('docs', () => {
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
                    };
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
                    length(2, 20),
                    usernameIsAvailable
                ],
                address: [
                    every([required(), minLength(1)], {message: 'At least 1 address is required'}),
                    arrayElements([
                        required({message: 'Address is required'}),
                        {
                            street: [required(), length(2, 40)],
                            city: [required(), length(2, 40)],
                            state: [required(), length(2, 2)]
                        },
                        validateCity
                    ])
                ]
            };

            const person = {
                name: 'Marty McFly',
                username: 'marty',
                address: [
                    {
                        street: '9303 Lyon Dr.',
                        city: 'Hill Valley',
                        state: 'WA'
                    }
                ]
            };

            return validateAsync(validatePerson, person).then((result) => {
                expect(result).toMatchObject({
                    isValid: false,
                    objectProps: {
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
                            arrayElements: [
                                {
                                    isValid: false,
                                    message: 'Hill Valley is in California',
                                    objectProps: {
                                        street: {isValid: true},
                                        city: {isValid: true},
                                        state: {isValid: true}
                                    }
                                }
                            ]
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

            const userValidator = {
                name: [
                    required(),
                    length(2, 20)
                ],
                username: [
                    required(),
                    length(2, 20),
                    usernameIsAvailableTwoStage
                ]
            };

            const user = {
                name: 'Marty McFly',
                username: 'marty'
            };

            const result = validate(userValidator, user);

            it('first stage', () => {
                expect(result).toMatchObject({
                    isValid: false,
                    objectProps: {
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
                        objectProps: {
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

                    const usernameValidator = [
                        required(),
                        length(2, 20),
                        usernameIsAvailableTwoStage
                    ];

                    let username = 'marty';
                    let usernameResult = validate(usernameValidator, username);

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

                it('automatic race condition handling', () => {
                    expect.assertions(2);

                    const usernameValidator = [
                        required(),
                        length({minLength: 2, maxLength: 20}),
                        usernameIsAvailableTwoStage
                    ];

                    let username = 'marty';
                    let usernameResult = validate(usernameValidator, username);

                    username = 'mcfly';

                    const accepted = jest.fn();
                    const rejected = jest.fn();

                    if (usernameResult.validateAsync) {
                        return usernameResult.validateAsync(() => username)
                            .then((asyncResult) => {
                                usernameResult = asyncResult;
                                accepted();
                            })
                            .catch((rejectedResult) => {
                                // the asyncResult result will be rejected
                                // because the value has changed
                                rejected(rejectedResult);
                            })
                            .then(() => {
                                expect(accepted).not.toHaveBeenCalled();
                                expect(rejected).toHaveBeenCalledWith(expect.objectContaining({
                                    value: 'marty',
                                    isValid: false
                                }));
                            });
                    }
                });

                it('automatic race condition handling in validateAsync', () => {
                    expect.assertions(2);

                    const usernameValidator = [
                        required(),
                        length({minLength: 2, maxLength: 20}),
                        usernameIsAvailableTwoStage
                    ];

                    let username = 'marty';

                    const accepted = jest.fn();
                    const rejected = jest.fn();

                    const promise = validateAsync(usernameValidator, () => username)
                        .then((asyncResult) => {
                            // async validation completed
                            accepted(asyncResult);
                        })
                        .catch((rejectedResult) => {
                            // async validation rejected
                            rejected(rejectedResult);
                        });

                    username = 'mcfly';

                    return promise.then(() => {
                        expect(accepted).not.toHaveBeenCalled();
                        expect(rejected).toHaveBeenCalledWith(expect.objectContaining({
                            value: 'marty'
                        }));
                    });
                });
            });
        });
    });
});
