import every from './every.js';
import objectProps from './objectProps.js';

export default function validate(validator, value, context) {
    let result = true;

    if (Array.isArray(validator)) {
        validator = every(validator);
    } else if (typeof validator === 'object' && validator) {
        validator = objectProps(validator);
    }

    if (typeof validator !== 'function') {
        throw 'Strickland: The validator passed to validate must be a function, an array (to use every), or an object (to use objectProps). Validator type: ' + typeof(validator);
    }

    const validationContext = {
        ...context,
        value
    };

    result = validator(value, validationContext);
    return prepareResult(value, result);
}

export function validateAsync(validator, value, context) {
    const syncValue = typeof value === 'function' ?
        value() :
        value;

    const result = validate(validator, syncValue, context);

    if (typeof result.validateAsync === 'function') {
        return result.validateAsync(value, context);
    }

    return Promise.resolve(result);
}

function prepareResult(value, result) {
    let preparedResult = result;

    if (!preparedResult) {
        preparedResult = {isValid: false};

    } else if (typeof preparedResult === 'boolean') {
        preparedResult = {isValid: preparedResult};

    } else if (typeof preparedResult === 'function' || preparedResult instanceof Promise) {
        preparedResult = {
            isValid: false,
            validateAsync: preparedResult
        };
    }

    preparedResult = {
        ...preparedResult,
        isValid: !!preparedResult.isValid,
        value
    };

    return wrapValidateAsync(value, preparedResult);
}

function wrapValidateAsync(value, result) {
    if (result.validateAsync instanceof Promise) {
        const promise = result.validateAsync;
        result.validateAsync = () => promise;
    }

    if (typeof result.validateAsync === 'function') {
        const resultValidateAsync = result.validateAsync;

        return {
            ...result,
            validateAsync(asyncValue, asyncContext) {
                if (typeof asyncValue === 'function') {
                    const valueBeforeAsync = asyncValue();

                    if (valueBeforeAsync !== value) {
                        return Promise.reject(result);
                    }
                }

                return Promise.resolve(resultValidateAsync(value, asyncContext))
                    .then(prepareResult.bind(null, value))
                    .then((asyncResult) => {
                        if (typeof asyncValue === 'function') {
                            const valueAfterAsync = asyncValue();

                            // If the value changed during async validation
                            // then reject the async result
                            if (valueAfterAsync !== value) {
                                throw asyncResult;
                            }
                        }

                        return asyncResult;
                    });
            }
        };
    } else if (typeof result.validateAsync !== 'undefined') {
        throw 'Strickland: validateAsync must be either a Promise or a function';
    }

    return result;
}
