import maxLengthValidator from './maxLength.js';
import minLengthValidator from './minLength.js';
import validate from './validate.js';

export default function lengthValidator(validatorProps, maxLengthProp) {
    return function validateLength(value, context) {
        let length = value ? value.length : 0;
        let props;

        if (typeof validatorProps === 'function') {
            props = validatorProps({...context, length});
        } else if (typeof validatorProps === 'number' && typeof maxLengthProp === 'number') {
            props = {
                minLength: validatorProps,
                maxLength: maxLengthProp
            };
        } else {
            props = validatorProps;
        }

        const {minLength, maxLength} = props;

        const result = validate([
            minLengthValidator({minLength}),
            maxLengthValidator({maxLength})
        ], value, context);

        return {
            ...props,
            ...result,
            length
        };
    };
}
