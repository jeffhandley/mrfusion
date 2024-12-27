import { isEmptyValue } from './utils/index.js';

export default function minValidator(validatorProps) {
    return function validateMin(value, context) {
        let props;

        if (typeof validatorProps === 'function') {
            props = validatorProps(context);
        } else if (typeof validatorProps === 'number') {
            props = {
                min: validatorProps
            };
        } else {
            props = validatorProps;
        }

        const {min} = props;

        if (typeof min !== 'number') {
            throw 'Strickland: The `min` validator requires a numeric `min` property';
        }

        let isValid = true;

        if (isEmptyValue(value)) {
            // Empty values are always valid except with the required validator

        } else if (typeof value !== 'number') {
            isValid = false;

        } else if (value < min) {
            isValid = false;
        }

        return {
            ...props,
            isValid
        };
    };
}
