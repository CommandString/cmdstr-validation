"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationBuilder = exports.ValidationFieldBuilder = void 0;
exports.validate = validate;
function validate(objectToValidate, config) {
    let errorBag = {
        errors: {},
        hasErrors: false
    };
    const pushError = (field, message, bag = null) => {
        var _a, _b;
        var _c, _d;
        bag !== null && bag !== void 0 ? bag : (bag = errorBag);
        (_a = (_c = bag.errors)[field]) !== null && _a !== void 0 ? _a : (_c[field] = []);
        if (!(bag.errors[field] instanceof Array)) {
            (_b = (_d = bag.errors[field]).errors) !== null && _b !== void 0 ? _b : (_d.errors = []);
            if (!(bag.errors[field].errors instanceof Array)) {
                throw new Error(`Errors field name is reserved when using nested validation with top level validation!`);
            }
            bag.errors[field].errors.push(message);
            return;
        }
        bag.errors[field].push(message);
        if (!bag.hasErrors) {
            bag.hasErrors = true;
        }
    };
    for (let [field, fieldConfig] of Object.entries(config.fields)) {
        if (fieldConfig.required && objectToValidate[field] === undefined) {
            if (!fieldConfig.requiredMessage) {
                throw new Error(`${field} is missing required error message!`);
            }
            pushError(field, fieldConfig.requiredMessage);
            if (config.stopAfterFirstFail) {
                break;
            }
            else {
                continue;
            }
        }
        let value = objectToValidate[field];
        if (fieldConfig.type) {
            if (!fieldConfig.type.message) {
                throw new Error(`${field} is missing type error message!`);
            }
            if (fieldConfig.type.isInvalid(value)) {
                pushError(field, fieldConfig.type.message);
                if (fieldConfig.stopAfterFirstFail) {
                    break;
                }
                else {
                    continue;
                }
            }
        }
        if (!fieldConfig.validators && !fieldConfig.nested) {
            throw new Error(`You must provide either validators or a nested validation config for ${field}!`);
        }
        if (fieldConfig.nested) {
            let nestedErrorBag = validate(value, fieldConfig.nested);
            errorBag.errors[field] = nestedErrorBag.errors;
            if (nestedErrorBag.hasErrors && config.stopAfterFirstFail) {
                break;
            }
            else if (nestedErrorBag.hasErrors) {
                errorBag.hasErrors = true;
            }
        }
        if (!fieldConfig.validators) {
            continue;
        }
        for (let validator of fieldConfig.validators) {
            if (!validator.message) {
                throw new Error(`You must supply an error message for ${field}!`);
            }
            if (!validator.isInvalid) {
                throw new Error(`You must supply a check for ${field}!`);
            }
            if (validator.isInvalid(value)) {
                pushError(field, validator.message);
                if (fieldConfig.stopAfterFirstFail) {
                    break;
                }
            }
        }
    }
    return errorBag;
}
class ValidationFieldBuilder {
    constructor(name) {
        this.name = name;
        this.fieldConfig = {};
    }
    addTypeCheck(isInvalid, message) {
        this.fieldConfig.type = { isInvalid, message };
        return this;
    }
    makeRequired(message) {
        this.fieldConfig.required = true;
        this.fieldConfig.requiredMessage = message;
        return this;
    }
    setStopAfterFirstFail(stopAfterFirstFail) {
        this.fieldConfig.stopAfterFirstFail = stopAfterFirstFail;
        return this;
    }
    addValidator(isInvalid, message) {
        var _a;
        var _b;
        (_a = (_b = this.fieldConfig).validators) !== null && _a !== void 0 ? _a : (_b.validators = []);
        this.fieldConfig.validators.push({ isInvalid, message });
        return this;
    }
    addNestedConfig(config) {
        if (config instanceof ValidationBuilder) {
            config = config.getConfig();
        }
        this.fieldConfig.nested = config;
        return this;
    }
    getFieldConfig() {
        return this.fieldConfig;
    }
}
exports.ValidationFieldBuilder = ValidationFieldBuilder;
class ValidationBuilder {
    constructor() {
        this.config = {};
    }
    setStopAfterFirstFail(stopAfterFirstFail) {
        this.config.stopAfterFirstFail = stopAfterFirstFail;
        return this;
    }
    addField(name, build) {
        var _a;
        var _b;
        (_a = (_b = this.config).fields) !== null && _a !== void 0 ? _a : (_b.fields = {});
        this.config.fields[name] = build((new ValidationFieldBuilder(name))).getFieldConfig();
        return this;
    }
    getConfig() {
        return this.config;
    }
    validate(objectToValidate) {
        return validate(objectToValidate, this.config);
    }
}
exports.ValidationBuilder = ValidationBuilder;
