import { isEmptyValue } from './utils/index.js';
import validate from './validate.js';

const initialResult = {
    isValid: true,
    arrayElements: []
};

export default function arrayElementsValidator(validator, validatorProps) {
    return function validateArray(valueArray, context) {
        const props = typeof validatorProps === 'function' ?
            validatorProps(context) :
            validatorProps;

        let hasAsyncResults = false;
        let result = initialResult;

        if (isEmptyValue(valueArray)) {
            // Empty values are always valid except with the required validator
        } else if (!Array.isArray(valueArray)) {
            result = {
                ...result,
                isValid: false
            };
        } else {
            result = valueArray.map((value, key) => {
                const childContext = {
                    ...context,
                    ...((context && context.arrayElements && context.arrayElements[key]) || ({}))
                };

                const validatorResult = validate(validator, value, childContext);
                hasAsyncResults = hasAsyncResults || validatorResult.validateAsync;

                return validatorResult;
            }).reduce(applyNextResult, initialResult);

            if (hasAsyncResults) {
                result.validateAsync = function resolveAsync() {
                    const promises = result.arrayElements.map(
                        (value, key) => Promise.resolve(
                            result.arrayElements[key].validateAsync ?
                                result.arrayElements[key].validateAsync() :
                                result.arrayElements[key]
                        )
                    );

                    return Promise.all(promises).then((results) => {
                        const resolvedResult = results.reduce(applyNextResult, initialResult);

                        return {
                            ...props,
                            ...resolvedResult
                        };
                    });
                };
            }
        }

        return {
            ...props,
            ...result
        };
    };
}

function applyNextResult(previousResult, nextResult) {
    return {
        isValid: previousResult.isValid && nextResult.isValid,
        arrayElements: [
            ...previousResult.arrayElements,
            nextResult
        ]
    };
}
