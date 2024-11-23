import * as vscode from 'vscode';
import { PhpStanService } from './services/phpStanService';
import { StatusBarService } from './services/statusBarService';
import { LoggingService } from './services/loggingService';

const statusBarService = new StatusBarService();
const phpStanService = new PhpStanService();

//TODO:
	//- Fix Status bar icons //could still be improved.
	//- Finanlly, publish the extension
		//- Update readme (add screenshots)
	//- Add composer support and extensions support.

export async function activate(context: vscode.ExtensionContext) {
	await phpStanService.initPhpStanAsync(context, statusBarService);

	const analyseDisposable = vscode.commands.registerCommand('php-stan.analyse', () => {
		phpStanService.analyseActiveDocument();
	});

	const showOutputDisposable = vscode.commands.registerCommand('php-stan._showOutput', () => {
		LoggingService.show();
	});
	
	context.subscriptions.push(analyseDisposable);
	context.subscriptions.push(showOutputDisposable);

	LoggingService.log('PHPStan is now active!');
}


export function deactivate() {}
