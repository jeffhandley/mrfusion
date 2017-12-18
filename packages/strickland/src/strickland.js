export function isValid(result) {
    if (result === true) {
        return true;
    }

    if (typeof result === 'object') {
        return isValidObjectResult(result);
    }

    return false;
}

function isValidObjectResult(result) {
    if (typeof result.results === 'object') {
        const props = Object.keys(result.results);

        for (let i = 0; i < props.length; i++) {
            if(!isValid(result.results[props[i]])) {
                return false;
            }
        }

        return true;
    }

    return !!result.isValid;
}

export default function validate(rules, value) {
    let result = true;

    if (typeof rules === 'function') {
        result = rules(value);
    } else if (Array.isArray(rules)) {
        result = validateRulesArray(rules, value);
    } else if (typeof rules === 'object' && rules) {
        result = validateRulesObject(rules, value);
    } else {
        throw 'unrecognized validation rules: ' + (typeof rules)
    }

    result = convertResult(result, value);

    return result;
}

function validateRulesArray(rules, value) {
    let result = true;

    for (let i = 0; i < rules.length; i++) {
        result = {
            ...result,
            ...validate(rules[i], value)
        };

        if (!isValid(result)) {
            break;
        }
    }

    return result;
}

function validateRulesObject(rules, value) {
    if (typeof value === 'object' && value) {
        const props = Object.keys(rules);
        let results = {};
        let isValid = true;

        for (let i = 0; i < props.length; i++) {
            results = {
                ...results,
                [props[i]]: validate(rules[props[i]], value[props[i]])
            };
        }

        // Wrap the results in an object to be nested in the outer result
        return {results};
    }

    return true;
}

function convertResult(result, value) {
    if (typeof result === 'boolean') {
        return convertBooleanResult(result);
    }

    if (typeof result === 'string') {
        return convertStringResult(result);
    }

    if (typeof result === 'object') {
        return convertObjectResult(result, value);
    }
}

function convertBooleanResult(result) {
    return {
        isValid: !!result
    };
}

function convertStringResult(result) {
    // If the string is empty, then there is no error message
    // and therefore the result is valid
    return {
        message: result,
        isValid: !result
    };
}

function convertObjectResult(result, value) {
    return {
        ...result,
        isValid: isValid(result),
        value
    };
}
