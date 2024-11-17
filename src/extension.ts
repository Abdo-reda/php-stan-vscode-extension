import * as vscode from 'vscode';
import { PhpStanService } from './services/phpStanService';
import { showRanooon } from './utilities/vscodeUtilities';

const phpStanService = new PhpStanService();

//TODO:
	//- check php version and dependency
	//- pick diagnostic approach (on save? on change?)
	//- pick diagnostic files/directory (entire workspace? entire direcotry? active file?)
	//- Add StatusBar functionality. a check on the buttom x when error, check when no error, loading when analysing.
		//+ tooltip info
	//- Finanlly, publish the extension.

export function activate(context: vscode.ExtensionContext) {

	const diagnosticCollection = vscode.languages.createDiagnosticCollection('temp');
	context.subscriptions.push(diagnosticCollection);

	phpStanService.initPhpStan(context.storageUri!, diagnosticCollection);

	// const statusBar = createStatusBar();
	// context.subscriptions.push(statusBar);
	// showRanooon('testing message .....s.s.s.');


	console.log('PHPStan: Congratulations, your extension "php-stan" is now active!');

	const disposable = vscode.commands.registerCommand('php-stan.turtle', () => {
		vscode.window.showInformationMessage('Hello RANA');
	});

	const timeCommand = vscode.commands.registerCommand('php-stan.analyseRanaFile', () => {
		phpStanService.analyseWorkspace();
	});

	context.subscriptions.push(disposable, timeCommand);
}


export function deactivate() {}
