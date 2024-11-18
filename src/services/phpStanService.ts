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
import { GlobalStateEnum } from "../constants/stateEnum";

export class PhpStanService {
  private githubService = new GithubService();
  private phpService = new PhpService();
  private storagePath: vscode.Uri = vscode.Uri.file("");
  private diagCollection!: vscode.DiagnosticCollection;
  private phpStanVersion = "";
  private context!: vscode.ExtensionContext;

  constructor() {
    this.onAnalysisError = this.onAnalysisError.bind(this);
    this.onAnalysisSuccess = this.onAnalysisSuccess.bind(this);
  }

  async initPhpStanAsync(
    context: vscode.ExtensionContext,
  ): Promise<vscode.Disposable[]> {
    console.log("PHPStan: Initialising PHP Stan");
    const disposables: vscode.Disposable[] = [];
    this.diagCollection = vscode.languages.createDiagnosticCollection('PHPStanDiagnostics');
    this.storagePath = context.storageUri!; //TODO: will this work in non-workspaces? and also, is this different for each workspace? this is fucked.
    this.context = context;

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
    const exists = await fileExistsAsync(filePath);
    this.phpStanVersion = this.context.globalState.get<string>(GlobalStateEnum.PHP_STAN_VERSION) ?? "";
    if (exists && this.phpStanVersion) {
      console.log(`PHPStan: Found PHPStan version ${this.phpStanVersion}`);
      return;
    }

    const release = await this.githubService.downloadLatestReleaseAsync();
    const arrayBuffer = await release.file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    await vscode.workspace.fs.writeFile(filePath, uint8Array);
    this.phpStanVersion = release.version;
    this.context.globalState.update(GlobalStateEnum.PHP_STAN_VERSION, this.phpStanVersion);
    showInfoMessage(`Successfully downloaded phpStan ${this.phpStanVersion} to ${filePath.fsPath}`);
    console.log(`PHPStan: Successfully downloaded phpStan ${this.phpStanVersion} to ${filePath.fsPath}`);
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
