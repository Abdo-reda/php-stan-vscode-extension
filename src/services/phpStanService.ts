import { ExtensionConfigurations } from "../constants/configurationEnum";
import { fileExistsAsync, getActiveDirectory, getConfiguration, runCommandInBackground } from "../utilities/vscodeUtilities";
import { GithubService } from "./githubService";
import * as vscode from "vscode";

export class PhpStanService {
  private githubService = new GithubService();
  private storagePath: vscode.Uri = vscode.Uri.file("");

  async initPhpStan(storagePath: vscode.Uri) {
    this.storagePath = storagePath;
    await this.downloadLatestPharAsync(this.phpStanPath);
  }

  analyseWorkspace() {
    const activeDirectory = getActiveDirectory();
    if (!activeDirectory) {
      return;
    }
    this.analyseFile(activeDirectory);
  }

  private analyseFile(path: string) {
    const level = getConfiguration<number>(ExtensionConfigurations.LEVEL);
    console.log(`PhpStan: Analysing ${path}, Level ${level}`);
    runCommandInBackground(
      `php ${this.phpStanPath.fsPath} analyse src -l ${level} --no-progress --no-ansi`, 
      path, 
      this.onAnalysisError, 
      this.onAnalysisSuccess
    );
    // runCommandInBackground(
    //   `cd`, 
    //   path, 
    //   this.onAnalysisError, 
    //   this.onAnalysisSuccess
    // );
  }

  get phpStanPath() {
    return vscode.Uri.joinPath(this.storagePath, "phpstan.phar");
  }

  async downloadLatestPharAsync(filePath: vscode.Uri) {
    var exists = await fileExistsAsync(filePath);
    if (exists) {
      console.log("PhpStan: Found PHP stan version");
      return;
    }

    var file = await this.githubService.downloadLatestReleaseAsync();
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer); // Convert ArrayBuffer to Uint8Array
    await vscode.workspace.fs.writeFile(filePath, uint8Array);
    vscode.window.showInformationMessage(`Successfully downloaded phpStan to ${filePath.fsPath}`);
  }

  private onAnalysisError(output: string) {
    console.log('----- on Analysis Error -----'); 
    // vscode.window.showErrorMessage(`Analysis failed: ${output}`);
  }

  private onAnalysisSuccess(output: string) {
    vscode.window.showInformationMessage(`Analysis completed successfully ${output}`);
  }
}
