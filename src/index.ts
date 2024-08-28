export type Validator = {
    /**
     * Return true if the value is invalid to have
     * the message appended to the error bag
     */
    isInvalid: (v: any) => boolean
    message: string
};

export type ValidationFieldConfig = {
    /**
     * Supply this to verify the variable type before running the validators
     */
    type?: Validator;
    /**
     * Whether the property is required (default: false)
     */
    required?: boolean;
    /**
     * The error message to add to the error bag if the value is missing (default: Field is required!)
     */
    requiredMessage?: string;
    /**
     * An array of validators used for validating the value
     * associated error message to the error bag
     */
    validators?: Validator[];
    /**
     * For validation nested properties in an object
     */
    nested?: ValidationConfig;
    /**
     * Whether to stop running checks after the first failure
     */
    stopAfterFirstFail?: boolean;
};

export type ValidationConfig = {
    /**
     * Whether to stop validating fields after the first one fails
     */
    stopAfterFirstFail?: boolean,
    /**
     * The validation configuration for each property in the object
     */
    fields: {
        [key: string]: ValidationFieldConfig
    }
}

export type ValidationErrors = {[key: string]: string[]|ValidationErrors};

export type ValidationErrorBag = {
    errors: ValidationErrors,
    hasErrors: boolean
}

export function validate(objectToValidate: {[key: string]: any}, config: ValidationConfig): ValidationErrorBag {
    let errorBag: ValidationErrorBag = {
        errors: {},
        hasErrors: false
    }

    const pushError = (field: string, message: string, bag: ValidationErrorBag|null = null) => {
        bag ??= errorBag;
        bag.errors[field] ??= [];

        if (!(bag.errors[field] instanceof Array)) {
            bag.errors[field].errors ??= [];

            if (!(bag.errors[field].errors instanceof Array)) {
                throw new Error(`Errors field name is reserved when using nested validation with top level validation!`);
            }

            bag.errors[field].errors.push(message);

            return;
        }

        bag.errors[field].push(message)

        if (!bag.hasErrors) {
            bag.hasErrors = true;
        }
    }

    for (let [field, fieldConfig] of Object.entries(config.fields)) {
        if (fieldConfig.required && objectToValidate[field] === undefined) {
            if (!fieldConfig.requiredMessage) {
                throw new Error(`${field} is missing required error message!`)
            }

            pushError(field, fieldConfig.requiredMessage);

            if (config.stopAfterFirstFail) {
                break;
            } else {
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
                } else {
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
            } else if (nestedErrorBag.hasErrors) {
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

export class ValidationFieldBuilder {
    private fieldConfig = {} as ValidationFieldConfig;

    constructor(
        public readonly name: string
    ) {

    }

    addTypeCheck(isInvalid: (v: any) => boolean, message: string) {
        this.fieldConfig.type = { isInvalid, message }

        return this;
    }

    makeRequired(message: string) {
        this.fieldConfig.required = true;
        this.fieldConfig.requiredMessage = message;

        return this;
    }

    setStopAfterFirstFail(stopAfterFirstFail: boolean) {
        this.fieldConfig.stopAfterFirstFail = stopAfterFirstFail;

        return this;
    }

    addValidator(isInvalid: (v: any) => boolean, message: string) {
        this.fieldConfig.validators ??= [];
        this.fieldConfig.validators.push({ isInvalid, message });

        return this;
    }

    addNestedConfig(config: ValidationConfig|ValidationBuilder) {
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

export class ValidationBuilder {
    private config: ValidationConfig = {} as ValidationConfig;

    setStopAfterFirstFail(stopAfterFirstFail: boolean) {
        this.config.stopAfterFirstFail = stopAfterFirstFail;

        return this;
    }

    addField(name: string, build: (builder: ValidationFieldBuilder) => ValidationFieldBuilder) {
        this.config.fields ??= {};
        this.config.fields[name] = build((new ValidationFieldBuilder(name))).getFieldConfig()

        return this;
    }

    getConfig() {
        return this.config;
    }

    validate(objectToValidate: {[key: string]: any}): ValidationErrorBag {
        return validate(objectToValidate, this.config);
    }
}
