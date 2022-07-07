# Encrypted file context store for nodeJS
A context store plug-in for SmartThings SmartApps that uses encrypted files to protect sensitive data.

This is a modification of the file_context_store module from [this SmartThings repository](https://github.com/SmartThingsCommunity/file-context-store-nodejs).

The exisitng file_context_store module from the Smartthings repository provides a simple local-file storage solution for SmartApp context stores where a more elaborate database storage solution isn't needed.  It was implemented as a simple text file that contains the json string of the SmartApp context.  The downside of this implementation is that any sensitive data that is part of the SmartApp configuration is stored 'in the clear'.  For example, if the SmartApp configuration includes asking the user for a password, that clear text password value becomes part of the context configuration data and would be store locally in the fully-visable json file.

To overcome this security concern, this modification of the file_context_store encrypts the context json before it is written to file, and decrypts the data when read from the file.

The use of the methods and their parameters is no different from the standard file_context_store module with one exception:
When instantiating the context store, a **secret key** must be passed as the first parameter. An optional directory name can be provided as the second parameter.  

File names will have the '.data' extension rather than '.json'.

## Caveats
Decryption of the context store is only possible during the current execution of the nodeJS application.  If the app is stopped and restarted, the encrypted file cannot be decrypted, since the derived salt is lost.

## Secret Key
A secret key paramater must be provided when the context store is instantiated:
```
var store = new context_store('some_secret_key');
```
- They key is used to to uniquely encrypt the context json
- It must be a string value of any length
- It is up to the developer to determine what key to use
- The sensitivity level of the context data will determine how the secret key should be created and managed:
  - The simplest (but less secure) approach would be to use the .installedAppId value from the SmartApp context as the secret key
  - A more secure approach would be to require console input of the key at invocation of the nodeJS SmartApp (see below).
  
### Console Input of Secret Key
Here is example js code for secure secret key input from console:
```
var readline = require('readline');

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.stdoutMuted = true;

rl.question('Key: ', function(secretkey) {
  
  < DO STUFF >
  
});

rl._writeToOutput = function _writeToOutput(stringToWrite) {
  if (rl.stdoutMuted)
    rl.output.write("*");
  else
    rl.output.write(stringToWrite);
};
```
  
## How Secure?
The data is encrypted with the aes-192-cbc algorithm and uses a 24-byte salt derived from the provided secret key, so the data file itself is fairly secure from malicious network attacks.  How the secret key itself is generated and managed is more likely to be the weak link.
