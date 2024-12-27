import { isEmptyValue } from './utils/index.js';

export default function compareValidator(validatorProps) {
    return function validateCompare(value, context) {
        let props;

        if (typeof validatorProps === 'function') {
            props = validatorProps(context);
        } else if (typeof validatorProps !== 'object') {
            props = {
                compare: validatorProps
            };
        } else {
            props = validatorProps;
        }

        const {compare} = props;

        if (typeof compare === 'undefined') {
            throw 'Strickland: The `compare` validator requires a `compare` property';
        }

        let isValid = true;

        if (isEmptyValue(value)) {
            // Empty values are always valid except with the required validator

        } else if (value !== compare) {
            isValid = false;
        }

        return {
            ...props,
            isValid,
            compare
        };
    };
}
