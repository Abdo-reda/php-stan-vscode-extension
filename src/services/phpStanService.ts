import { ExtensionConfigurations } from "../constants/configurationEnum";
import replaceTokens from "../constants/languageTokensMap";
import { IErrorMessage, IErrorOutput } from "../interfaces/errorOutputInterface";
import { addDiagnosticsToFile, fileExistsAsync, getActiveDirectory, getConfiguration, runCommandInBackground } from "../utilities/vscodeUtilities";
import { GithubService } from "./githubService";
import * as vscode from "vscode";

export class PhpStanService {
  private githubService = new GithubService();
  private storagePath: vscode.Uri = vscode.Uri.file("");
  private diagCollection!: vscode.DiagnosticCollection;

  constructor() {
    this.onAnalysisError = this.onAnalysisError.bind(this);
    this.onAnalysisSuccess = this.onAnalysisSuccess.bind(this);
  }

  async initPhpStan(storagePath: vscode.Uri, diagCollection: vscode.DiagnosticCollection ) {
    this.storagePath = storagePath;
    this.diagCollection = diagCollection;
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
      `php ${this.phpStanPath.fsPath} analyse src -l ${level} --no-progress --error-format=json`, 
      path, 
      this.onAnalysisError, 
      this.onAnalysisSuccess
    );
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
    const errorOutput = JSON.parse(output) as IErrorOutput;
    // console.log('----- on Analysis Error -----', errorOutput); 
    for (const [key, value] of Object.entries(errorOutput.files)) {
      const diangostics = this.buildDiagnosticsFromOutput(value.messages);
      addDiagnosticsToFile(
        this.diagCollection, 
        key, 
        diangostics
      );
    }
  }

  private onAnalysisSuccess(output: string) {
    vscode.window.showInformationMessage(`Analysis completed successfully ${output}`);
  }

  private buildDiagnosticsFromOutput(messages: IErrorMessage[]): vscode.Diagnostic[] {
    const diagnostics = messages.map((m) => {
      const range = new vscode.Range(
        m.line-1,
        0,
        m.line-1,
        10,
        // document.lineAt(line).range.end.character
      ); 
  
      const diagnostic = new vscode.Diagnostic(
        range,
        replaceTokens(m.message), //TODO: I think this is a bug and needs only be done for the last error.
        vscode.DiagnosticSeverity.Error
      );
  
      return diagnostic;
    });
  
    return diagnostics;
  }
}
