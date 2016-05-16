import expect from 'expect';
import deepFreeze from 'deep-freeze';
import { minFieldValue } from '../src';

describe('minFieldValue', () => {
    describe('message', () => {
        it('defaults to "${field} no less than ${min}"', () => {
            const validate = minFieldValue('number', 2);
            const result = validate({ number: 2 });
            expect(result.message).toBe('number no less than 2');
        });

        it('can be overridden through props', () => {
            const validate = minFieldValue('number', 2, { message: 'Overridden' });
            const result = validate({ number: 2 });
            expect(result.message).toBe('Overridden');
        });
    });

    describe('props', () => {
        it('flow through', () => {
            const validate = minFieldValue('number', 2, { errorLevel: 10 });
            const result = validate({ number: 2 });
            expect(result.errorLevel).toBe(10);
        });

        it('guards against null', () => {
            const validate = minFieldValue('field', 2, null);
            const result = validate({ field: 2 });
            expect(result.message).toExist();
        });

        describe('do not get mutated', () => {
            const props = { errorLevel: 10 };
            deepFreeze(props);

            it('during creation', () => {
                minFieldValue('field', 2, props);
            });

            it('during validation', () => {
                const validate = minFieldValue('field', 2, props);
                validate(2);
            });
        });
    });

    describe('ignores values', () => {
        describe('ignoring falsy values by default', () => {
            const validate = minFieldValue('field', 1);
            let notDefined;

            [ notDefined, null, false, 0, '' ]
            .forEach((test) => {
                describe(JSON.stringify(test), () => {
                    describe('as the value', () => {
                        const result = validate(test);

                        it('setting isValid to true', () => {
                            expect(result.isValid).toBe(true);
                        });

                        it('setting isIgnored to true', () => {
                            expect(result.isIgnored).toBe(true);
                        });
                    });

                    describe('as the field value', () => {
                        const result = validate({ field: test });

                        it('setting isValid to true', () => {
                            expect(result.isValid).toBe(true);
                        });

                        it('setting isIgnored to true', () => {
                            expect(result.isIgnored).toBe(true);
                        });
                    });
                });
            });
        });

        describe('using a custom isIgnored prop', () => {
            [
                { isIgnored: true, name: 'as true' },
                { isIgnored: (value) => (value.field === 1), name: 'as a function returning true' }
            ]
            .forEach((test) => {
                describe(test.name, () => {
                    const validate = minFieldValue('field', 4, { isIgnored: test.isIgnored });
                    const result = validate({ field: 1 });

                    it('setting isValid to true', () => {
                        expect(result.isValid).toBe(true);
                    });

                    it('setting isIgnored to true', () => {
                        expect(result.isIgnored).toBe(true);
                    });
                });
            });
        });
    });

    describe('validates field values', () => {
        describe('for numbers', () => {
            [
                { min: 2, value: 1, isValid: false },
                { min: 2, value: 2, isValid: true },
                { min: 2, value: 3, isValid: true }
            ].forEach((test) => {
                it(JSON.stringify(test), () => {
                    const validate = minFieldValue('number', test.min);
                    const result = validate({ number: test.value });
                    expect(result.isValid).toBe(test.isValid);
                });
            });
        });

        describe('for strings', () => {
            [
                { min: 'b', value: 'a', isValid: false },
                { min: 'b', value: 'b', isValid: true },
                { min: 'b', value: 'c', isValid: true }
            ].forEach((test) => {
                it(JSON.stringify(test), () => {
                    const validate = minFieldValue('string', test.min);
                    const result = validate({ string: test.value });
                    expect(result.isValid).toBe(test.isValid);
                });
            });
        });

        describe('for dates', () => {
            [
                { min: new Date(2016, 4, 13), value: new Date(2016, 4, 12), isValid: false },
                { min: new Date(2016, 4, 13), value: new Date(2016, 4, 13), isValid: true },
                { min: new Date(2016, 4, 13), value: new Date(2016, 4, 14), isValid: true }
            ].forEach((test) => {
                it(JSON.stringify(test), () => {
                    const validate = minFieldValue('date', test.min);
                    const result = validate({ date: test.value });
                    expect(result.isValid).toBe(test.isValid);
                });
            });
        });
    });
});
