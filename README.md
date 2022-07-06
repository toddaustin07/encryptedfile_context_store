# Encrypted file context store for nodeJS
A context store plug-in for SmartThings SmartApps that uses encrypted files to protect sensitive data.

This is a modification of the file_context_store module from [this SmartThings repository](https://github.com/SmartThingsCommunity/file-context-store-nodejs).

The exisitng file_context_store module from the Smartthings repository provides a simple local-file storage solution for SmartApp context stores where a more elaborate database storage solution isn't needed.  It was implemented as a simple text file that contains the json string of the SmartApp context.  The downside of this implementation is that any sensitive data that is part of the SmartApp configuration is stored 'in the clear'.  For example, if the SmartApp configuration includes asking the user for a password, that clear text password value becomes part of the context configuration data and would be store locally in the fully-visable json file.

To overcome this security concern, this modification of the file_context_store encrypts the context json before it is written to file, and decrypts the data when read from the file.

The use of the methods and their parameters is no different from the standard file_context_store module with one exception:
When instantiating the context store, a **secret key** must be passed as the first parameter. An optional directory name can be provided as the second parameter.  

File names will have the '.data' extension rather than '.json'.

## Secret Key
A secret key paramater must be provided when the context store is instantiated:
```
var store = new context_store('some_secret_key');
```
- They key is used to to uniquely encrypt the context json
- It must be a string value of any length
- It is up to the developer to determine what key to use and to ensure that it is persistantly available across invocations of the nodeJS SmartApp.
- The sensitivity level of the context data will determine how the secret key should be created and managed:
  - The simplest (but less secure) approach would be to use the .installedAppId value from the SmartApp context as the secret key
  - A more secure approach would be to require console input of the key at invocation of the nodeJS SmartApp.
  - Because the key must be available across invocations of the nodeJS SmartApp, it may be tempting to save it in persistant storage, however this wouldn't be secure; the key itself if stored, would need to be encrypted, which would require another key....and on and on!
  
## How Secure?
The data is encrypted with the aes-192-cbc algorithm and uses a 24-byte salt derived from the provided secret key.  So the data file itself is fairly secure from malicious network attacks.  How the secret key itself is generated and managed is more likely to be the weak link.
