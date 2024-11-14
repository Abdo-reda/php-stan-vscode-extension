import { fileExistsAsync } from "../utilities/vscodeUtilities";
import { GithubService } from "./githubService";
import * as vscode from "vscode";

export class PhpStanService {
  private githubService = new GithubService();

  async initPhpStan(path: string) {
	await this.downloadLatestPharAsync(path);
  }

  async downloadLatestPharAsync(path: string) {
    const filePath = `${path}/phpStan.phar`;
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
