# PHPStan

**PHPStan extension** is an extension for the popular static analysis tool [PHPStan](https://phpstan.org/). 

Instead of having to manually install PHPStan and run it on your project everytime you make a change, this extension runs **PHPStan behind the scenes automatically**. 
It outputs the errors and displays them in your file. It also display a statusbar with a summary. This in theory, should result in faster workflows. 

This is **NOT an official extension from PHPStan**, its more of a passion/learning project made by me because I was bored `¯\_(ツ)_/¯`.

## Features

* Runs PHPStan analysis ... screen shots will be added later.

## Why Though?

You might be wondering why use this at all? one can use other extensions that behave like actual language analyzers / lsps. Providing not only errors but also autocompletion and documentation. 

Well, you are probably right, this is a very niche extension and made solely for learning purposes.

Moreover, I found it later that are already [extensions](https://marketplace.visualstudio.com/search?term=phpstan&target=VSCode&category=All%20categories&sortBy=Relevance) that do the same thing and maybe even better. Check them out!
- [SanderRonde Extension](https://marketplace.visualstudio.com/items?itemName=SanderRonde.phpstan-vscode)
- [Swordev Extension](https://marketplace.visualstudio.com/items?itemName=swordev.phpstan) 

## Requirements

* PHP minimum version 7.2.0 is required and need to be avaialble globally to run PHPStan. 
    * Check out [PHP Install](https://www.php.net/manual/en/install.php) for help downloading php. 
    * This document may be out of date. Check the official [PHPStan Documentation](https://phpstan.org/user-guide/getting-started).


## Extension Settings

* `php-stan.binary`: **PHPStan binary approach** that gets executed. Only Phar files are supported for now, later on composer support will be added.

* `php-stan.analysisOn`: Determines the **trigger** for running the analysis, By default its set to `onSave` but it can be changed to `onChange` or `manual`.

* `php-stan.analysisScope`: Determines the **files** that are analysed with each trigger, By default its set to `directory` but it can be changed to `file` or `workspace`.

## Known Issues

This extension is still a **work in progress**, errors may and will occur.
* PHPStan errors will always appear in the **beginning of the line** that contains the error, regardless of where the actual error is. As a result, error messages are not always accurate.

## Release Notes


### V 0.8.7

* Initial release of PHPStanExtension.

## POSSIBLE ENHANCEMENTS?:

- [ ] Composer & Extensions Support.
- [ ] Setting to specify php binary.
- [ ] Maybe add additional commands, clear cache, clear analysis, analyse path, ..
- [ ] Possible and specific configurations for phpStan itself?
- [ ] Add unit tests.

## LICENCE

[GNU GENERAL PUBLIC LICENSE](LICENSE)