import validate from './validate.js';

const initialResult = {
    isValid: false,
    some: []
};

export default function someValidator(validators, validatorProps) {
    if (!validators || !Array.isArray(validators)) {
        throw 'Strickland: some expects an array of validators';
    }

    return function validateSome(value, context) {
        const props = typeof validatorProps === 'function' ?
            validatorProps(context) :
            validatorProps;

        if (!validators || !validators.length) {
            return {
                ...props,
                ...initialResult,
                isValid: true
            };
        }

        function executeValidators(currentResult, validatorsToExecute) {
            if (Array.isArray(validatorsToExecute) && validatorsToExecute.length) {
                validatorsToExecute.some((validator, index) => {
                    const previousResult = currentResult;
                    const nextResult = validate(validator, value, context);

                    currentResult = applyNextResult(currentResult, nextResult);

                    if (nextResult.validateAsync) {
                        const previousAsync = previousResult.validateAsync || (() => Promise.resolve(previousResult));

                        currentResult.validateAsync = function resolveAsync() {
                            return previousAsync().then((asyncResult) =>
                                nextResult.validateAsync().then((resolvedResult) => {
                                    let finalResult = applyNextResult(asyncResult, resolvedResult);

                                    if (!finalResult.isValid) {
                                        const remainingValidators = validatorsToExecute.slice(index + 1);
                                        finalResult = executeValidators(finalResult, remainingValidators);

                                        if (finalResult.validateAsync) {
                                            return finalResult.validateAsync();
                                        }
                                    }

                                    return {
                                        ...props,
                                        ...finalResult
                                    };
                                })
                            );
                        };

                        // Break out of the loop to prevent subsequent validation from occurring
                        return true;
                    }

                    return currentResult.isValid;
                });
            }

            return currentResult;
        }

        const result = executeValidators(initialResult, validators);

        return {
            ...props,
            ...result
        };
    };
}

function applyNextResult(previousResult, nextResult) {
    return {
        ...previousResult,
        ...nextResult,
        isValid: previousResult.isValid || nextResult.isValid,
        some: [
            ...previousResult.some,
            nextResult
        ]
    };
}
