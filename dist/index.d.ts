export type Validator = {
    /**
     * Return true if the value is invalid to have
     * the message appended to the error bag
     */
    isInvalid: (v: any) => boolean;
    message: string;
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
    stopAfterFirstFail?: boolean;
    /**
     * The validation configuration for each property in the object
     */
    fields: {
        [key: string]: ValidationFieldConfig;
    };
};
export type ValidationErrors = {
    [key: string]: string[] | ValidationErrors;
};
export type ValidationErrorBag = {
    errors: ValidationErrors;
    hasErrors: boolean;
};
export declare function validate(objectToValidate: {
    [key: string]: any;
}, config: ValidationConfig): ValidationErrorBag;
export declare class ValidationFieldBuilder {
    readonly name: string;
    private fieldConfig;
    constructor(name: string);
    addTypeCheck(isInvalid: (v: any) => boolean, message: string): this;
    makeRequired(message: string): this;
    setStopAfterFirstFail(stopAfterFirstFail: boolean): this;
    addValidator(isInvalid: (v: any) => boolean, message: string): this;
    addNestedConfig(config: ValidationConfig | ValidationBuilder): this;
    getFieldConfig(): ValidationFieldConfig;
}
export declare class ValidationBuilder {
    private config;
    setStopAfterFirstFail(stopAfterFirstFail: boolean): this;
    addField(name: string, build: (builder: ValidationFieldBuilder) => ValidationFieldBuilder): this;
    getConfig(): ValidationConfig;
    validate(objectToValidate: {
        [key: string]: any;
    }): ValidationErrorBag;
}
