import { jest } from '@jest/globals';
import validate, {
    required,
    range,
    length,
    form
} from '../../src/strickland';

describe('docs', () => {
    describe('form validation', () => {
        const personValidator = form({
            firstName: [
                required(),
                length(2, 20)
            ],
            lastName: [
                required(),
                length(2, 20)
            ],
            birthYear: range(1900, 2018)
        });

        // Initialize the person with only a firstName
        let person = {
            firstName: 'Stanford'
        };

        // Validate the firstName field
        let result = validate(personValidator, person, {
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
                result = validate(personValidator, person, {
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
                result = validate(personValidator, person, {
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

            it('validates the entire form', () => {
                result = validate(personValidator, person, result);

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

            describe('async form validation', () => {
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

                const userValidator = form({
                    username: usernameIsAvailable,
                    domain: () => () => ({
                        isValid: true,
                        domainValidated: true
                    })
                });

                const user = {
                    username: 'mcfly',
                    domain: 'strickland.io'
                };

                const formResult = validate(userValidator, user);

                it('includes a validateAsync function', () => {
                    expect(formResult.validateAsync).toBeInstanceOf(Function);
                });

                it('calls the function to get the current form values', () => {
                    const getUser = jest.fn().mockReturnValue(user);

                    return formResult.validateAsync(getUser).then(() => {
                        expect(getUser).toHaveBeenCalled();
                    });
                });

                it('field-level async validation', () => {
                    const asyncContext = {
                        form: {
                            fields: ['username']
                        }
                    };

                    return formResult.validateAsync(user, asyncContext).then((asyncResult) => {
                        expect(asyncResult).toMatchObject({
                            form: {
                                isComplete: false,
                                validationResults: {
                                    username: {
                                        isValid: true,
                                        value: 'mcfly'
                                    },
                                    domain: {
                                        isValid: false,
                                        value: 'strickland.io',
                                        validateAsync: expect.any(Function)
                                    }
                                }
                            }
                        });
                    });
                });
            });

            describe('validateFields', () => {
                let validationResult;

                it('first field', () => {
                    // Validate the firstName field
                    validationResult = personValidator.validateFields(person, ['firstName']);

                    expect(validationResult).toMatchObject({
                        form: {
                            validationResults: {
                                firstName: {isValid: true}
                            }
                        }
                    });
                });

                it('additional fields', () => {
                    validationResult = personValidator.validateFields(person, ['lastName'], validationResult);

                    expect(validationResult).toMatchObject({
                        form: {
                            validationResults: {
                                firstName: {isValid: true},
                                lastName: {isValid: true}
                            }
                        }
                    });
                });
            });

            it('emptyResults', () => {
                let validationResult = personValidator.emptyResults();

                expect(validationResult).toEqual({
                    form: {
                        validationResults: {},
                        validationErrors: [],
                        isComplete: false
                    }
                });
            });

            describe('updateFieldResults', () => {
                // Validate the firstName field
                let stanfordStrickland = {
                    firstName: 'Stanford',
                    lastName: 'Strickland',
                    birthYear: 1925
                };

                let stanfordResult = validate(personValidator, stanfordStrickland);

                let firstNameResult = {
                    isValid: false,
                    value: 'Stanford',
                    message: 'The service does not allow a first name of "Stanford"'
                };

                it('updates field results', () => {
                    stanfordResult = personValidator.updateFieldResults(
                        stanfordResult,
                        {firstName: firstNameResult}
                    );

                    expect(stanfordResult).toMatchObject({
                        form: {
                            validationResults: {
                                firstName: {
                                    isValid: false,
                                    value: 'Stanford',
                                    message: 'The service does not allow a first name of "Stanford"'
                                },
                                lastName: {
                                    isValid: true
                                },
                                birthYear: {
                                    isValid: true
                                }
                            },
                            validationErrors: [
                                {
                                    fieldName: 'firstName',
                                    isValid: false,
                                    value: 'Stanford',
                                    message: 'The service does not allow a first name of "Stanford"'
                                }
                            ],
                            isComplete: true
                        }
                    });
                });

                it('removes field results', () => {
                    stanfordResult = personValidator.updateFieldResults(
                        stanfordResult,
                        {firstName: null}
                    );

                    expect(stanfordResult.form.validationResults).not.toHaveProperty('firstName');
                });
            });
        });
    });
});
