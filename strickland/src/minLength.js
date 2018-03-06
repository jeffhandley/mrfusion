import {getValidatorProps} from './utils';

export default function minLength(...params) {
    return function validateMinLength(value, context) {
        let isValid = true;
        let length = value ? value.length : 0;

        const props = getValidatorProps(
            ['minLength'],
            params,
            value,
            context,
            {length}
        );

        if (typeof props.minLength !== 'number') {
            throw 'minLength must be a number';
        }

        if (!value) {
            // Empty values are always valid except with the required validator

        } else if (length < props.minLength) {
            isValid = false;
        }

        return {
            ...props,
            length,
            isValid
        };
    }
}