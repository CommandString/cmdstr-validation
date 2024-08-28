import {
    ValidationConfig,
    validate,
    ValidationBuilder,
    ValidationErrorBag,
    ValidationErrors
} from "../index";

const VALIDATION_CONFIG: ValidationConfig = {
    fields: {
        username: {
            type: {
                isInvalid: (v: any) => typeof v !== 'string',
                message: 'Invalid username provided!'
            },
            required: true,
            requiredMessage: 'You must have a username!',
            validators: [
                {
                    isInvalid: (v: string) => (v.length > 50),
                    message: 'Your username cannot exceed 50 characters!'
                },
                {
                    isInvalid: (v: string) => (v.length < 5),
                    message: 'Your username must be more than 5 characters!'
                },
                {
                    isInvalid: (v: string) => (v.match(/^[a-z_1-9]+$/i) === null),
                    message: 'Your username may only contain letters, underscores, and numbers!'
                }
            ]
        },
        avatar: {
            required: true,
            requiredMessage: 'You must have an avatar!',
            type: {
                isInvalid: (v: any) => typeof v !== 'object',
                message: 'Invalid avatar provided!'
            },
            stopAfterFirstFail: true,
            validators: [
                {
                    isInvalid: (v: {size: number}) => (v.size > 50),
                    message: 'Your avatar cannot exceed 50MB!'
                },
            ]
        },
        settings: {
            type: {
                isInvalid: (v: any) => typeof v !== 'object',
                message: 'Invalid settings provided!'
            },
            nested: {
                fields: {
                    color: {
                        required: true,
                        requiredMessage: 'Color setting is missing!',
                        validators: [
                            {
                                isInvalid: (v: string) => !['red', 'blue', 'green'].includes(v),
                                message: 'Color must be red, blue or green!'
                            }
                        ]
                    }
                }
            }
        }
    }
};

const VALIDATION_BUILDER_CONFIG = new ValidationBuilder()
    .addField('username', (builder) => builder
        .makeRequired('You must have a username!')
        .addTypeCheck(
            (v: any) => typeof v !== 'string',
            'Invalid username provided!'
        )
        .addValidator(
            (v: string) => v.length > 50,
            'Your username cannot exceed 50 characters!'
        )
        .addValidator(
            (v: string) => v.length < 5,
            'Your username must be more than 5 characters!'
        )
        .addValidator(
            (v: string) => (v.match(/^[a-z_1-9]+$/i) === null),
            'Your username may only contain letters, underscores, and numbers!'
        )
    )
    .addField('avatar', (builder) => builder
        .addTypeCheck(
            (v: any) => typeof v !== 'object',
            'Invalid avatar provided!'
        )
        .addValidator(
            (v: {size: number}) => v.size > 50,
            'Your avatar cannot exceed 50MB!'
        )
    )
    .addField('settings', (builder) => builder
        .addNestedConfig((new ValidationBuilder())
            .addField('color', (builder) => builder
                .makeRequired('Color setting is missing!')
                .addTypeCheck(
                    (v: any) => typeof v !== 'string',
                    'Invalid color provided!'
                )
                .addValidator(
                    (v: string) => !['red', 'blue', 'green'].includes(v),
                    'Color must be red, blue or green!'
                )
            )
        )
    );

const VALID_OBJECT = {
    username: 'Command_String',
    avatar: {
        size: 45,
    },
    settings: {
        color: 'red'
    }
};

test('valid object', () => {
    let errorBag = validate(VALID_OBJECT, VALIDATION_CONFIG);

    expect(errorBag.hasErrors).toBe(false);

    errorBag = VALIDATION_BUILDER_CONFIG.validate(VALID_OBJECT);

    expect(errorBag.hasErrors).toBe(false);
});

test('missing property', () => {
    const MISSING_PROPERTY_OBJECT = {
        avatar: {
            size: 45,
        },
        settings: {
            color: 'red'
        }
    };

    let errorBag = validate(MISSING_PROPERTY_OBJECT, VALIDATION_CONFIG);

    expect(errorBag.hasErrors).toBe(true);
    expect(errorBag.errors.username).toBeDefined();
    expect(errorBag.errors.username.length).toBe(1);
    expect((errorBag.errors.username as string[])[0]).toBe('You must have a username!');

    errorBag = VALIDATION_BUILDER_CONFIG.validate(MISSING_PROPERTY_OBJECT);

    expect(errorBag.hasErrors).toBe(true);
    expect(errorBag.errors.username).toBeDefined();
    expect(errorBag.errors.username.length).toBe(1);
    expect((errorBag.errors.username as string[])[0]).toBe('You must have a username!')
});

test('invalid property', () => {
    const INVALID_PROPERTY_OBJECT = {
        username: '$Command_Stringdsfoijsdfiojsdfijdsfjiosdfoijdfsijosd',
        avatar: {
            size: 45,
        },
        settings: {
            color: 'red'
        }
    };

    const expects = (errorBag: ValidationErrorBag) => {
        expect(errorBag.hasErrors).toBe(true);
        expect(errorBag.errors.username).toBeDefined();
        expect(errorBag.errors.username.length).toBe(2);
        expect((errorBag.errors.username as string[])[0]).toBe('Your username cannot exceed 50 characters!');
        expect((errorBag.errors.username as string[])[1]).toBe('Your username may only contain letters, underscores, and numbers!');
    };

    let errorBag = validate(INVALID_PROPERTY_OBJECT, VALIDATION_CONFIG);

    expects(errorBag);

    errorBag = VALIDATION_BUILDER_CONFIG.validate(INVALID_PROPERTY_OBJECT);

    expects(errorBag);
});

test('invalid type', () => {
    const INVALID_TYPE_OBJECT = {
        username: {},
        avatar: {
            size: 45,
        },
        settings: {
            color: 'red'
        }
    };

    const expects = (errorBag: ValidationErrorBag) => {
        expect(errorBag.hasErrors).toBe(true);
        expect(errorBag.errors.username).toBeDefined();
        expect(errorBag.errors.username.length).toBe(1);
        expect((errorBag.errors.username as string[])[0]).toBe('Invalid username provided!');
    }

    let errorBag = validate(INVALID_TYPE_OBJECT, VALIDATION_CONFIG);
    expects(errorBag);

    errorBag = VALIDATION_BUILDER_CONFIG.validate(INVALID_TYPE_OBJECT);
    expects(errorBag);
});

test('invalid nested property', () => {
    const INVALID_PROPERTY_OBJECT = {
        username: 'Command_String',
        avatar: {
            size: 45,
        },
        settings: {
            color: 'orange'
        }
    };

    const expects = (errorBag: ValidationErrorBag) => {
        expect(errorBag.hasErrors).toBe(true);
        expect(errorBag.errors.settings).toBeDefined();
        expect((errorBag.errors.settings as ValidationErrors).color?.length).toBe(1);
        expect(((errorBag.errors.settings as ValidationErrors).color as string[])[0]).toBe('Color must be red, blue or green!');
    };

    let errorBag = validate(INVALID_PROPERTY_OBJECT, VALIDATION_CONFIG);
    expects(errorBag);

    errorBag = VALIDATION_BUILDER_CONFIG.validate(INVALID_PROPERTY_OBJECT);
    expects(errorBag);
});

test('nested validation with top level validation', () => {
    const VALIDATION_OBJECT = {
        settings: {
            color: 'orange',
            theme: 'invalid'
        }
    }

    const VALIDATION_CONFIG: ValidationConfig = {
        fields: {
            settings: {
                type: {
                    isInvalid: (v: any) => typeof v !== 'object',
                    message: 'Invalid settings provided!'
                },
                nested: {
                    fields: {
                        color: {
                            validators: [
                                {
                                    isInvalid: (v: string) => !['red', 'blue', 'green'].includes(v),
                                    message: 'Color must be red, blue or green!'
                                }
                            ]
                        },
                        theme: {
                            validators: [
                                {
                                    isInvalid: (v: string) => !['light', 'dark'].includes(v),
                                    message: 'Theme must be light or dark!'
                                }
                            ]
                        }
                    }
                },
                validators: [
                    {
                        isInvalid: (v: object) => Object.keys(v).length !== 3,
                        message: 'Missing settings!'
                    }
                ]
            }
        }
    };

    const VALIDATION_BUILDER_CONFIG = new ValidationBuilder()
        .addField('settings', (builder) => builder
            .addTypeCheck(
                (v: any) => typeof v !== 'object',
                'Invalid settings provided!'
            )
            .addNestedConfig((new ValidationBuilder())
                .addField('color', (builder) => builder
                    .addValidator(
                        (v: string) => !['red', 'blue', 'green'].includes(v),
                        'Color must be red, blue or green!'
                    )
                )
                .addField('theme', (builder) => builder
                    .addValidator(
                        (v: string) => !['light', 'dark'].includes(v),
                        'Theme must be light or dark!'
                    )
                )
            )
            .addValidator(
        (v: object) => Object.keys(v).length !== 3,
        'Missing settings!'
            )
        );

    const expects = (errorBag: ValidationErrorBag) => {
        expect(errorBag.hasErrors).toBe(true);

        expect(errorBag.errors.settings).toBeDefined();
        expect((errorBag.errors.settings as ValidationErrors).color).toBeDefined();
        expect((errorBag.errors.settings as ValidationErrors).theme).toBeDefined();
        expect((errorBag.errors.settings as ValidationErrors).color?.length).toBe(1);
        expect((errorBag.errors.settings as ValidationErrors).theme?.length).toBe(1);
        expect(((errorBag.errors.settings as ValidationErrors).color as string[])[0]).toBe('Color must be red, blue or green!');
        expect(((errorBag.errors.settings as ValidationErrors).theme as string[])[0]).toBe('Theme must be light or dark!');
        expect((errorBag.errors.settings as ValidationErrors).errors.length).toBe(1);
        expect(((errorBag.errors.settings as ValidationErrors).errors as string[])[0]).toBe('Missing settings!');
    }

    let errorBag = validate(VALIDATION_OBJECT, VALIDATION_CONFIG);

    expects(errorBag);
});
