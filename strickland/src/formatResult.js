import validate from './validate.js';

export default function formatResult(formatter, validator) {
    if (typeof formatter !== 'function') {
        throw 'Strickland: `formatResult` expects a formatter function as the first argument';
    }

    return function validateWithFormatter(value, context) {
        const result = validate(validator, value, context);

        if (result.validateAsync) {
            const previousAsync = result.validateAsync;
            result.validateAsync = () => previousAsync().then(formatter);
        }

        return formatter(result, {
            value,
            context
        });
    };
}
