import validate from './validate.js';

const initialResult = {
    isValid: true,
    every: []
};

export default function everyValidator(validators, validatorProps) {
    if (!validators || !Array.isArray(validators)) {
        throw 'Strickland: The `every` validator expects an array of validators';
    }

    return function validateEvery(value, context) {
        const props = typeof validatorProps === 'function' ?
            validatorProps(context) :
            validatorProps;

        function executeValidators(currentResult, validatorsToExecute) {
            if (Array.isArray(validatorsToExecute) && validatorsToExecute.length) {
                validatorsToExecute.every((validator, index) => {
                    const previousResult = currentResult;
                    const nextResult = validate(validator, value, context);

                    currentResult = applyNextResult(currentResult, nextResult);

                    if (nextResult.validateAsync) {
                        const previousAsync = previousResult.validateAsync || (() => Promise.resolve(previousResult));

                        currentResult.validateAsync = function resolveAsync() {
                            return previousAsync().then((resolvedPreviousResult) =>
                                nextResult.validateAsync().then((resolvedNextResult) => {
                                    let finalResult = applyNextResult(resolvedPreviousResult, resolvedNextResult);

                                    if (finalResult.isValid) {
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
                        return false;
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
        isValid: previousResult.isValid && nextResult.isValid,
        every: [
            ...previousResult.every,
            nextResult
        ]
    };
}
