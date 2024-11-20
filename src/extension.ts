import * as vscode from 'vscode';
import { PhpStanService } from './services/phpStanService';
import { showRanooon } from './utilities/vscodeUtilities';
import { StatusBarService } from './services/statusBarService';
import { LoggingService } from './services/loggingService';

const phpStanService = new PhpStanService();

//TODO:
	//- fix activation logic to run
	//- maybe add logging service with output channel so I can debug in the future. 
	//- Test the storageURI in non-workspaces.
	//- When diagnostic approach change, need to refresh.
	//- Add StatusBar functionality. a check on the buttom x when error, check when no error, loading when analysing.
		//+ tooltip info
	//- Finanlly, publish the extension.
	//- enhance icon.

export async function activate(context: vscode.ExtensionContext) {

	
	const statusBarService = new StatusBarService(context);
	await phpStanService.initPhpStanAsync(context);

	const analyseDisposable = vscode.commands.registerCommand('php-stan.analyse', () => {
		phpStanService.analyseActiveDocument();
	});
	
	context.subscriptions.push(analyseDisposable);

	LoggingService.log('PHPStan is now active!');
}


export function deactivate() {}
