# PHPStan

**PHPStan extension** is an extension for the popular static analysis tool [PHPStan](https://phpstan.org/). 

Instead of having to manually install PHPStan and run it on your project everytime you make a change, this extension runs **PHPStan behind the scenes automatically**. 
It outputs the errors and displays them in your file. This in theory, should result in a faster workflows. 

This is **NOT an official extension from PHPStan**, its more of a passion/learning project made by me because I was bored `¯\_(ツ)_/¯`.

## Features

* Runs PHPStan analysis ... screen shots will be added later.


## Requirements

* PHP minimum version 7.2.0 is required to run PHPStan. 
    * Check out [PHP Install](https://www.php.net/manual/en/install.php) for help downloading php. 
    * This document may be out of date. Check the official [PHPStan Documentation](https://phpstan.org/user-guide/getting-started).

## Extension Settings

* `php-stan.binary`: **PHPStan binary** that gets executed. Only Phar files are supported for now, later on composer support will be added.

* `php-stan.analysisOn`: Determines the **trigger** for running the analysis, By default its set to `onSave` but it can be changed to `onChange` or `manual`.

* `php-stan.analysisScope`: Determines the **files** that are analysed with each trigger, By default its set to `directory` but it can be changed to `file` or `workspace`.

## Known Issues

This extension is still a **work in progress**, errors may and will occur.
* PHPStan errors will always appear in the **beginning of the line** that contains the error, regardless of where the actual error is. As a result, error messages are not always accurate.

## Release Notes


### V 0.8.7

* Initial release of PHPStanExtension.
