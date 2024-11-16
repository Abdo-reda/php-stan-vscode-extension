import * as vscode from 'vscode';
import { PhpStanService } from './services/phpStanService';
import { showRanooon } from './utilities/vscodeUtilities';

const phpStanService = new PhpStanService();

//TODO:
	//- check php version and dependency
	//- update configuration, update markdown and so on ..
	//- pick diagnostic approach (on save? on change?)
	//- pick diagnostic files/directory (entire direcotry? active file?)
	//- Add a check on the buttom x when error, check when no error, loading when analysing.

export function activate(context: vscode.ExtensionContext) {

	const diagnosticCollection = vscode.languages.createDiagnosticCollection('temp');
	phpStanService.initPhpStan(context.storageUri!, diagnosticCollection);

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
