import * as vscode from 'vscode';
import { PhpStanService } from './services/phpStanService';
import { StatusBarService } from './services/statusBarService';
import { LoggingService } from './services/loggingService';

const statusBarService = new StatusBarService();
const phpStanService = new PhpStanService();

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
