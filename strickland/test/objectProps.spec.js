import { jest } from '@jest/globals';
import { length, minLength, objectProps, required } from '../src/strickland.js';

describe('objectProps', () => {
    describe('throws', () => {
        it('with undefined rules', () => {
            expect(() => objectProps()).toThrow();
        });

        it('with null rules', () => {
            expect(() => objectProps(null)).toThrow();
        });

        it('with numeric rules', () => {
            expect(() => objectProps(1)).toThrow();
        });

        it('with string rules', () => {
            expect(() => objectProps('string')).toThrow();
        });

        it('with an array for rules', () => {
            expect(() => objectProps([{}])).toThrow();
        });

        it('with a function for rules', () => {
            expect(() => objectProps(required())).toThrow();
        });
    });

    it('returns a validate function', () => {
        const validate = objectProps({});
        expect(validate).toBeInstanceOf(Function);
    });

    describe('validates', () => {
        const personProps = {
            first: required({message: 'First: required'}),
            last: [
                required({message: 'Last: required'}),
                minLength({minLength: 2, message: 'Last: minLength'})
            ]
        };

        const validate = objectProps(personProps, {validatorProp: 'Validator message'});
        const person = {
            first: '',
            last: 'A'
        };

        const result = validate(person);

        it('returning a result object', () => {
            expect(result).toBeInstanceOf(Object);
        });

        it('returning results for all props', () => {
            expect(result).toMatchObject({
                objectProps: {
                    first: {isValid: false},
                    last: {isValid: false}
                }
            });
        });

        it('returning a top-level isValid property', () => {
            expect(result.isValid).toBeDefined();
        });

        it('producing invalid results', () => {
            expect(result.isValid).toBe(false);
        });

        it('producing valid results', () => {
            const validPerson = {
                first: 'A',
                last: 'AB'
            };

            const validResult = validate(validPerson);
            expect(validResult).toMatchObject({
                isValid: true,
                objectProps: {
                    first: {isValid: true},
                    last: {isValid: true}
                }
            });
        });

        it('putting validator props on the result', () => {
            expect(result).toMatchObject({validatorProp: 'Validator message'});
        });

        it('resolving validator props from a function', () => {
            const getProps = jest.fn();
            const context = {contextProp: 'context'};
            objectProps({}, getProps)(null, context);

            expect(getProps).toHaveBeenCalledWith(context);
        });
    });

    describe('with empty rules', () => {
        const validate = objectProps({});
        const result = validate({});

        it('returns valid results', () => {
            expect(result.isValid).toBe(true);
        });

        it('returns empty objectProps', () => {
            expect(result.objectProps).toEqual({});
        });
    });

    describe('with nested rules objects', () => {
        const validate = objectProps({
            name: required(),
            homeAddress: {
                street: required(),
                city: required(),
                state: [required(), length(2, 2)]
            },
            workAddress: {
                street: {
                    number: required(),
                    name: required()
                },
                city: required(),
                state: [required(), length(2, 2)]
            }
        });

        it('returns objectProps in the shape of the rules', () => {
            const value = {
                name: 'Name',
                homeAddress: {
                    street: '9303 Lyon Dr.',
                    city: 'Hill Valley',
                    state: 'CA'
                },
                workAddress: {
                    street: {
                        number: 456,
                        name: 'Front St.'
                    },
                    city: 'City',
                    state: 'ST'
                }
            };

            const result = validate(value);

            expect(result.objectProps).toMatchObject({
                name: {isValid: true},
                homeAddress: {
                    isValid: true,
                    objectProps: {
                        street: {isValid: true},
                        city: {isValid: true},
                        state: {isValid: true}
                    }
                },
                workAddress: {
                    isValid: true,
                    objectProps: {
                        street: {
                            isValid: true,
                            objectProps: {
                                number: {isValid: true},
                                name: {isValid: true}
                            }
                        },
                        city: {isValid: true},
                        state: {isValid: true}
                    }
                }
            });
        });

        it('returns valid results', () => {
            const value = {
                name: 'Name',
                homeAddress: {
                    street: '9303 Lyon Dr.',
                    city: 'Hill Valley',
                    state: 'CA'
                },
                workAddress: {
                    street: {
                        number: 456,
                        name: 'Front St.'
                    },
                    city: 'City',
                    state: 'ST'
                }
            };

            const result = validate(value);

            expect(result).toMatchObject({
                isValid: true,
                objectProps: {
                    homeAddress: {isValid: true},
                    workAddress: {
                        isValid: true,
                        objectProps: {
                            street: {isValid: true}
                        }
                    }
                }
            });
        });

        it('returns invalid results (validating all properties)', () => {
            const value = {
                name: '',
                homeAddress: {
                    street: '9303 Lyon Dr.',
                    city: 'Hill Valley',
                    state: ''
                },
                workAddress: {
                    street: {
                        number: '',
                        name: ''
                    },
                    city: '',
                    state: 'ST'
                }
            };

            const result = validate(value);

            expect(result).toMatchObject({
                isValid: false,
                objectProps: {
                    homeAddress: {
                        isValid: false
                    },
                    workAddress: {
                        isValid: false,
                        objectProps: {
                            street: {
                                isValid: false,
                                objectProps: {
                                    name: {isValid: false}
                                }
                            }
                        }
                    }
                }
            });
        });
    });

    describe('when properties are missing from the value', () => {
        const validate = objectProps({
            name: required(),
            homeAddress: {
                street: required(),
                city: required(),
                state: [required(), length(2, 2)]
            },
            workAddress: {
                street: {
                    number: required(),
                    name: required()
                },
                city: required(),
                state: [required(), length(2, 2)]
            }
        });

        it('validates missing scalar values', () => {
            const value = {
                homeAddress: {},
                workAddress: {
                    street: {}
                }
            };

            const result = validate(value);

            expect(result).toMatchObject({
                isValid: false,
                objectProps: {
                    name: {isValid: false},
                    homeAddress: {
                        isValid: false,
                        objectProps: {
                            street: {isValid: false},
                            city: {isValid: false},
                            state: {isValid: false}
                        }
                    },
                    workAddress: {
                        isValid: false,
                        objectProps: {
                            street: {
                                isValid: false,
                                objectProps: {
                                    number: {isValid: false},
                                    name: {isValid: false}
                                }
                            },
                            city: {isValid: false},
                            state: {isValid: false}
                        }
                    }
                }
            });
        });

        it('sets missing top-level object properties to valid', () => {
            const value = {
                workAddress: {
                    street: {}
                }
            };

            const result = validate(value);
            expect(result.objectProps.homeAddress.isValid).toBe(true);
        });

        it('sets missing nested object properties to valid', () => {
            const value = {
                workAddress: {}
            };

            const result = validate(value);

            expect(result.objectProps.workAddress.objectProps.street.isValid).toBe(true);
        });

        it('does not create objectProps for missing nested object properties', () => {
            const value = {};
            const result = validate(value);

            expect(result.objectProps).not.toHaveProperty('workAddress.objectProps.street.results');
        });
    });

    describe('passes context to the validators', () => {
        const validator = jest.fn();

        const validate = objectProps({
            first: validator
        }, {validatorProp: 'Validator prop'});

        const value = {
            first: 'A'
        };

        validate(value, {contextProp: 'Context prop'});

        it('from the validation context', () => {
            expect(validator).toHaveBeenCalledWith(value.first, expect.objectContaining({
                contextProp: 'Context prop'
            }));
        });
    });

    describe('allows context to be specified for individual props', () => {
        const name = jest.fn();
        const homeCity = jest.fn();

        const validate = objectProps({
            name,
            address: {
                home: {
                    city: homeCity
                }
            }
        });

        const value = {
            name: 'Stanford Strickland',
            address: {
                home: {
                    city: 'Hill Valley'
                }
            }
        };

        const context = {
            message: 'top-level',
            topLevelMessage: 'top-level message',
            objectProps: {
                name: {
                    message: 'name',
                    nameMessage: 'name message'
                },
                address: {
                    message: 'address',
                    addressMessage: 'address message',
                    objectProps: {
                        home: {
                            message: 'home',
                            homeMessage: 'home message',
                            objectProps: {
                                city: {
                                    message: 'home city',
                                    homeCityMessage: 'home city message'
                                }
                            }
                        }
                    }
                }
            }
        };

        validate(value, context);

        it('for top-level props', () => {
            expect(name).toHaveBeenCalledWith(value.name, expect.objectContaining({
                topLevelMessage: 'top-level message',
                nameMessage: 'name message',
                message: 'name'
            }));
        });

        it('for nested props', () => {
            expect(homeCity).toHaveBeenCalledWith(value.address.home.city, expect.objectContaining({
                topLevelMessage: 'top-level message',
                addressMessage: 'address message',
                homeMessage: 'home message',
                homeCityMessage: 'home city message',
                message: 'home city'
            }));
        });

        it('without passing objectProps context to the top-level props', () => {
            expect(name).not.toHaveBeenCalledWith(expect.objectContaining({
                objectProps: expect.anything()
            }));
        });

        it('without passing objectProps context to the nested props', () => {
            expect(homeCity).not.toHaveBeenCalledWith(expect.objectContaining({
                objectProps: expect.anything()
            }));
        });
    });

    describe('given async validators', () => {
        describe('returns a validateAsync function', () => {
            it('that returns a Promise', () => {
                const validate = objectProps({
                    firstProp: () => Promise.resolve(true)
                });

                const value = {
                    firstProp: null
                };

                const result = validate(value);
                expect(result.validateAsync()).toBeInstanceOf(Promise);
            });

            it('with exclusively nested results', () => {
                const validateNested = objectProps({
                    firstProp: objectProps({
                        secondProp: () => Promise.resolve(true)
                    })
                });

                const value = {
                    firstProp: {
                        secondProp: null
                    }
                };

                const nestedResult = validateNested(value);

                return expect(nestedResult.validateAsync()).resolves.toMatchObject({
                    isValid: true,
                    objectProps: {
                        firstProp: {
                            isValid: true,
                            objectProps: {
                                secondProp: {isValid: true}
                            }
                        }
                    }
                });
            });
        });

        describe('resolves results', () => {
            it('resolves objectProps result, even when some are invalid', () => {
                const validate = objectProps({
                    firstProp: () => ({isValid: false, first: 'First'}),
                    secondProp: () => Promise.resolve({isValid: false, second: 'Second'}),
                    thirdProp: () => ({isValid: false, third: 'Third'}),
                    fourthProp: () => Promise.resolve({isValid: false, fourth: 'Fourth'}),
                    fifthProp: () => Promise.resolve({isValid: true, fifth: 'Fifth'})
                });

                const value = {
                    firstProp: null,
                    secondProp: null,
                    thirdProp: null,
                    fourthProp: null,
                    fifthProp: null
                };

                const result = validate(value);

                return expect(result.validateAsync()).resolves.toMatchObject({
                    objectProps: {
                        firstProp: {isValid: false, first: 'First'},
                        secondProp: {isValid: false, second: 'Second'},
                        thirdProp: {isValid: false, third: 'Third'},
                        fourthProp: {isValid: false, fourth: 'Fourth'},
                        fifthProp: {isValid: true, fifth: 'Fifth'}
                    }
                });
            });

            it('that resolve as true', () => {
                const validate = objectProps({
                    firstProp: () => Promise.resolve(true)
                });

                const value = {
                    firstProp: null
                };

                const result = validate(value);
                return expect(result.validateAsync()).resolves.toMatchObject({isValid: true});
            });

            it('that resolve as a valid result object', () => {
                const validate = objectProps({
                    firstProp: () => Promise.resolve({isValid: true})
                });

                const value = {
                    firstProp: null
                };

                const result = validate(value);
                return expect(result.validateAsync()).resolves.toMatchObject({isValid: true});
            });

            it('that resolve as false', () => {
                const validate = objectProps({
                    firstProp: () => Promise.resolve(false)
                });

                const value = {
                    firstProp: null
                };

                const result = validate(value);
                return expect(result.validateAsync()).resolves.toMatchObject({isValid: false});
            });

            it('that resolve as an invalid result object', () => {
                const validate = objectProps({
                    firstProp: () => Promise.resolve({isValid: false})
                });

                const value = {
                    firstProp: null
                };

                const result = validate(value);
                return expect(result.validateAsync()).resolves.toMatchObject({isValid: false});
            });

            it('recursively', () => {
                const validate = objectProps({
                    firstProp: () => Promise.resolve(
                        Promise.resolve(
                            Promise.resolve({
                                isValid: true,
                                recursively: 'Yes!'
                            })
                        )
                    ),
                    secondProp: objectProps({
                        thirdProp: () => Promise.resolve(
                            Promise.resolve(true)
                        ),
                        fourthProp: objectProps({
                            fifthProp: () => Promise.resolve(
                                Promise.resolve({
                                    isValid: true,
                                    inNestedValidators: 'Yep'
                                })
                            )
                        })
                    })
                });

                const value = {
                    firstProp: null,
                    secondProp: {
                        thirdProp: null,
                        fourthProp: {
                            fifthProp: null
                        }
                    }
                };

                const result = validate(value);

                return expect(result.validateAsync()).resolves.toMatchObject({
                    isValid: true,
                    objectProps: {
                        firstProp: {recursively: 'Yes!'},
                        secondProp: {
                            objectProps: {
                                fourthProp: {
                                    objectProps: {
                                        fifthProp: {inNestedValidators: 'Yep'}
                                    }
                                }
                            }
                        }
                    }
                });
            });

            it('puts validator props on the resolved result', () => {
                const validate = objectProps({
                    firstProp: () => Promise.resolve(true)
                }, {validatorProp: 'Validator message'});

                const value = {
                    firstProp: null
                };

                const result = validate(value);

                return expect(result.validateAsync()).resolves.toMatchObject({
                    validatorProp: 'Validator message'
                });
            });

            it('does not put context props on the resolved result', () => {
                const validate = objectProps({
                    firstProp: () => Promise.resolve(true)
                });

                const value = {
                    firstProp: null
                };

                const result = validate(value, {message: 'Message'});

                return expect(result.validateAsync()).resolves.not.toHaveProperty('message');
            });
        });

        describe('returns a partial result object', () => {
            const validate = objectProps({
                firstProp: () => ({isValid: true, first: 'First'}),
                secondProp: () => Promise.resolve({isValid: true, second: 'Second'}),
                nestedProp: objectProps({
                    thirdProp: () => ({isValid: true, third: 'Third'}),
                    fourthProp: () => Promise.resolve({isValid: true, fourth: 'Fourth'}),
                    fifthProp: () => ({isValid: true, fifth: 'Fifth'})
                }),
                sixthProp: () => ({isValid: true, sixth: 'Sixth'})
            });

            const value = {
                firstProp: null,
                secondProp: null,
                nestedProp: {
                    thirdProp: null,
                    fourthProp: null,
                    fifthProp: null
                },
                sixthProp: null
            };

            const result = validate(value);

            it('that is marked as not valid', () => {
                expect(result.isValid).toBe(false);
            });

            it('with sync results in place and Promise results where expected', () => {
                expect(result).toMatchObject({
                    objectProps: {
                        firstProp: {first: 'First'},
                        secondProp: {validateAsync: expect.any(Function)},
                        nestedProp: {
                            objectProps: {
                                thirdProp: {third: 'Third'},
                                fourthProp: {validateAsync: expect.any(Function)},
                                fifthProp: {fifth: 'Fifth'}
                            }
                        },
                        sixthProp: {sixth: 'Sixth'}
                    }
                });
            });

            it('with individual validator promises that will finish their results', () => {
                return expect(result.objectProps.nestedProp.objectProps.fourthProp.validateAsync()).resolves.toMatchObject({
                    isValid: true,
                    fourth: 'Fourth'
                });
            });
        });
    });
});
