import * as vscode from 'vscode';
import { PhpStanService } from './services/phpStanService';
import { showRanooon } from './utilities/vscodeUtilities';

const phpStanService = new PhpStanService();

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	phpStanService.initPhpStan(context.extensionPath);

	// showRanooon('testing message .....s.s.s.');

	console.log('PhpStan: Congratulations, your extension "php-stan" is now active!');

	const disposable = vscode.commands.registerCommand('php-stan.turtle', () => {
		vscode.window.showInformationMessage('Hello RANA');
	});

	const timeCommand = vscode.commands.registerCommand('php-stan.tellTime', () => {
		vscode.window.showWarningMessage(`${Date.now().toLocaleString()}`);
	});

	context.subscriptions.push(disposable, timeCommand);
}



// This method is called when your extension is deactivated
export function deactivate() {}
