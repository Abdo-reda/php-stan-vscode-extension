import * as vscode from 'vscode';
import { PhpStanService } from './services/phpStanService';
import { showRanooon } from './utilities/vscodeUtilities';

const phpStanService = new PhpStanService();

export function activate(context: vscode.ExtensionContext) {

	phpStanService.initPhpStan(context.storageUri!);

	// showRanooon('testing message .....s.s.s.');

	console.log('PhpStan: Congratulations, your extension "php-stan" is now active!');

	const disposable = vscode.commands.registerCommand('php-stan.turtle', () => {
		vscode.window.showInformationMessage('Hello RANA');
	});

	const timeCommand = vscode.commands.registerCommand('php-stan.analyseRanaFile', () => {
		phpStanService.analyseWorkspace();
	});

	context.subscriptions.push(disposable, timeCommand);
}


export function deactivate() {}
