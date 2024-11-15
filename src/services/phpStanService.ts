import { fileExistsAsync, getActiveDirectory, runCommandInBackground } from "../utilities/vscodeUtilities";
import { GithubService } from "./githubService";
import * as vscode from "vscode";

export class PhpStanService {
  private githubService = new GithubService();
  private extensionPath: string = '';

  async initPhpStan(extensionPath: string) {
	this.extensionPath = extensionPath;
	await this.downloadLatestPharAsync(this.extensionPath);
  }

  analyseWorkspace() {
	const activeDirectory = getActiveDirectory();
	if (!activeDirectory) {return;}
	this.analyseFile(activeDirectory);
  }

  analyseFile(path: string) {
	console.log(`PhpStan: ----- analyse ${path}`);
	// runCommandInBackground(`php ${this.phpStanPath} analyse ${path}`);
	runCommandInBackground(`pwd`);
  }

  get phpStanPath() {
	return `${this.extensionPath}/phpstan.phar`;
  }

  async downloadLatestPharAsync(path: string) {
    const filePath = `${path}/phpstan.phar`;
    const fileUri = vscode.Uri.file(filePath);
    var exists = await fileExistsAsync(fileUri);
	if (exists) {
		console.log('PhpStan: Found PHP stan version');
		return;
	}

    var file = await this.githubService.downloadLatestReleaseAsync();
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer); // Convert ArrayBuffer to Uint8Array
    await vscode.workspace.fs.writeFile(fileUri, uint8Array);
    vscode.window.showInformationMessage(`Successfully downloaded phpStan to ${filePath}`);
  }
}


