import validate from '../../src/strickland.js';

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
});
