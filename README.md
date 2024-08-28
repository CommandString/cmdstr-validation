# [commandstring-validation](https://github.com/commandstring/ts-validation)
A validation library for validating objects

## Installation
```
npm i commandstring-validation
```

## Basic Usage

```js
const USERNAME_VALIDATOR = (new ValidationBuilder())  
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
	        'Your username must not be more than 5 characters!'  
	     )  
	    .addValidator(  
	        (v: string) => (v.match(/^[a-z_1-9]+$/i) === null),  
	        'Your username may only contain letters, underscores, and numbers!'  
	    )
    )

let usernameErrorBag = USERNAME_VALIDATOR.validate({username: 'Command_String'});

usernameErrorBag.hasErrors // false
usernameErrorBag.errors // {}

usernameErrorBag = USERNAME_VALIDATOR.validate({username: '$Co'});
usernameErrorBag.hasErrors // true
usernameErrorBag.errors /*
{
	username: [
	    'Your username may only contain letters, underscores, and numbers!', 
	    'Your username must be more than 5 characters!
	]
}
*/

usernameErrorBag = USERNAME_VALIDATOR.validate({});
usernameErrorBag.hasErrors // true
usernameErrorBag.errors /*
{
	username: [
	    'You must have a username!',
	]
} */
```

*For more complex usage please see the unit tests in `/src/tests/validate.test.ts`*
