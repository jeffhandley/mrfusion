import { isEmptyValue } from './utils/index.js';

export default function maxValidator(validatorProps) {
    return function validateMax(value, context) {
        let props;

        if (typeof validatorProps === 'function') {
            props = validatorProps(context);
        } else if (typeof validatorProps === 'number') {
            props = {
                max: validatorProps
            };
        } else {
            props = validatorProps;
        }

        const {max} = props;

        if (typeof max !== 'number') {
            throw 'Strickland: The `max` validator requires a numeric `max` property';
        }

        let isValid = true;

        if (isEmptyValue(value)) {
            // Empty values are always valid except with the required validator

        } else if (typeof value !== 'number') {
            isValid = false;

        } else if (value > max) {
            isValid = false;
        }

        return {
            ...props,
            isValid
        };
    };
}
