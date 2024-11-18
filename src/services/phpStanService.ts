import {
  AnalysisOn,
  AnalysisScope,
  ExtensionConfigurations,
} from "../constants/configurationEnum";
import replaceTokens from "../constants/languageTokensMap";
import {
  IErrorMessage,
  IErrorOutput,
} from "../interfaces/errorOutputInterface";
import {
  addDiagnosticsToFile,
  fileExistsAsync,
  getActiveDirectory,
  getConfiguration,
  runCommandInBackground,
  showInfoMessage,
} from "../utilities/vscodeUtilities";
import { GithubService } from "./githubService";
import * as vscode from "vscode";
import { PhpService } from "./phpService";
import * as path from 'path';

export class PhpStanService {
  private githubService = new GithubService();
  private phpService = new PhpService();
  private storagePath: vscode.Uri = vscode.Uri.file("");
  private diagCollection!: vscode.DiagnosticCollection;

  constructor() {
    this.onAnalysisError = this.onAnalysisError.bind(this);
    this.onAnalysisSuccess = this.onAnalysisSuccess.bind(this);
  }

  async initPhpStanAsync(
    storagePath: vscode.Uri,
  ): Promise<vscode.Disposable[]> {
    console.log("PHPStan: Initialising PHP Stan");
    const disposables: vscode.Disposable[] = [];
    this.diagCollection = vscode.languages.createDiagnosticCollection('PHPStanDiagnostics');;
    this.storagePath = storagePath;

    const isValid = this.phpService.checkPhpVersion();
    if (!isValid) { return disposables; }

    await this.downloadLatestPharAsync(this.phpStanPath);

    const analysisDisposable = this.setupAnalysisListner();
    if (analysisDisposable) {disposables.push(analysisDisposable);}

    return disposables;
  }

  analyseWorkspace() {
    const activeDirectory = getActiveDirectory();
    if (!activeDirectory) {
      return;
    }
    this.analysePath(activeDirectory);
  }

  private analysePath(analysisPath: string) {
    const level = getConfiguration<number>(ExtensionConfigurations.LEVEL);
    const dir = path.dirname(analysisPath);
    const base = path.basename(analysisPath);
    console.log(`PHPStan: Analysing ${dir} ${base}, Level ${level}`);
    runCommandInBackground(
      `php ${this.phpStanPath.fsPath} analyse ${base} -l ${level} --no-progress --error-format=json`,
      this.onAnalysisError,
      this.onAnalysisSuccess,
      dir
    );
  }

  get phpStanPath() {
    return vscode.Uri.joinPath(this.storagePath, "phpstan.phar");
  }

  async downloadLatestPharAsync(filePath: vscode.Uri) {
    var exists = await fileExistsAsync(filePath);
    if (exists) {
      console.log("PHPStan: Found PHP stan version");
      return;
    }

    var file = await this.githubService.downloadLatestReleaseAsync();
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    await vscode.workspace.fs.writeFile(filePath, uint8Array);
    showInfoMessage(`Successfully downloaded phpStan to ${filePath.fsPath}`);
  }

  private onAnalysisError(output: string) {
    const errorOutput = JSON.parse(output) as IErrorOutput;
    for (const [key, value] of Object.entries(errorOutput.files)) {
      const diangostics = this.buildDiagnosticsFromOutput(value.messages);
      addDiagnosticsToFile(this.diagCollection, key, diangostics);
    }
  }

  private setupAnalysisListner(): vscode.Disposable|null {
    const analyseOn = getConfiguration<AnalysisOn>(
      ExtensionConfigurations.ANALYSIS_ON
    );

    if (analyseOn === AnalysisOn.ON_CHANGE) {
      return this.setupOnChangeListener();
    } else if (analyseOn === AnalysisOn.ON_SAVE) {
      return this.setupOnSaveListener();
    }
    return null;
  }

  private onAnalysis(document: vscode.TextDocument) {
    const analyseOn = getConfiguration<AnalysisScope>(
      ExtensionConfigurations.ANALYSIS_SCOPE
    );

    const documentURI = document.uri;
    const workspace = vscode.workspace.getWorkspaceFolder(documentURI);

    if (analyseOn === AnalysisScope.FILE) {
      console.log("PHPStan: Analysing File Scope");
      this.analysePath(documentURI.fsPath);
    } else if (analyseOn === AnalysisScope.DIRECTORY || !workspace) {
      console.log("PHPStan: Analysing Directory Scope");
      this.analysePath(vscode.Uri.joinPath(documentURI, '..').fsPath);
    } else if (analyseOn === AnalysisScope.WORKSPACE && workspace) {
      console.log("PHPStan: Analysing Workspace Scope");
      this.analysePath(workspace.uri.fsPath);
    }
  }

  private onAnalysisSuccess(output: string) {
    showInfoMessage(`Analysis completed successfully ${output}`);
  }

  private buildDiagnosticsFromOutput(
    messages: IErrorMessage[]
  ): vscode.Diagnostic[] {
    const diagnostics = messages.map((m) => {
      const range = new vscode.Range(m.line - 1, 0, m.line - 1, 10);
      //TODO: document.lineAt(line).range.end.character

      const diagnostic = new vscode.Diagnostic(
        range,
        replaceTokens(m.message), //TODO: I think this is a bug and needs only be done for the last error.
        vscode.DiagnosticSeverity.Error
      );

      return diagnostic;
    });

    return diagnostics;
  }

  private setupOnChangeListener(): vscode.Disposable {
    console.log("PHPStan: Setting up OnChange Listener");
    const changeDisposable = vscode.workspace.onDidChangeTextDocument(
      (event) => {
        console.log(`PHPStan: file changed ${event.document.fileName}`);
        this.onAnalysis(event.document);
      }
    );
    return changeDisposable;
  }

  private setupOnSaveListener(): vscode.Disposable {
    console.log("PHPStan: Setting up OnSave Listener");
    const saveDisposable = vscode.workspace.onDidSaveTextDocument(
      (document) => {
        console.log(`PHPStan: file saved ${document.fileName}`);
        this.onAnalysis(document);
      }
    );
    return saveDisposable;
  }
}
