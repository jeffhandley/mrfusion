import validate from './validate.js';

const initialResult = {
    isValid: true,
    all: []
};

export default function allValidator(validators, validatorProps) {
    if (!validators || !Array.isArray(validators)) {
        throw 'Strickland: The `all` validator expects an array of validators';
    }

    return function validateAll(value, context) {
        let result = initialResult;

        const props = typeof validatorProps === 'function' ?
            validatorProps(context) :
            validatorProps;

        let hasAsyncResults = false;
        validators.forEach((validator) => {
            const nextResult = validate(validator, value, context);
            hasAsyncResults = hasAsyncResults || nextResult.validateAsync;

            result = applyNextResult(result, nextResult);
        });

        if (hasAsyncResults) {
            result.validateAsync = function resolveAsync() {
                const promises = result.all.map(
                    (eachResult) => Promise.resolve(
                        eachResult.validateAsync ? eachResult.validateAsync() : eachResult
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
        all: [
            ...previousResult.all,
            nextResult
        ]
    };
}
