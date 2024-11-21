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
  getActiveDocument,
  getConfiguration,
  runCommandInBackground,
  showInfoMessage,
} from "../utilities/vscodeUtilities";
import { GithubService } from "./githubService";
import * as vscode from "vscode";
import { PhpService } from "./phpService";
import * as path from 'path';
import { GlobalStateEnum } from "../constants/stateEnum";
import { LoggingService } from "./loggingService";
import { StatusBarService } from "./statusBarService";

export class PhpStanService {
  private githubService = new GithubService();
  private phpService = new PhpService();
  private storagePath: vscode.Uri = vscode.Uri.file("");
  private diagCollection!: vscode.DiagnosticCollection;
  private phpStanVersion = "";
  private analyseOn = AnalysisOn.ON_SAVE;
  private statusBarService!: StatusBarService; //maybe assign in constructor.

  constructor() {
    this.onAnalysisError = this.onAnalysisError.bind(this);
    this.onAnalysisSuccess = this.onAnalysisSuccess.bind(this);
  }

  async initPhpStanAsync(
    context: vscode.ExtensionContext,
    statusBarService: StatusBarService,
  ): Promise<void> {
    LoggingService.log("Initialising PHP Stan ...");
    this.statusBarService = statusBarService;

    const disposables: vscode.Disposable[] = [];
    this.diagCollection = vscode.languages.createDiagnosticCollection('PHPStanDiagnostics');
    this.storagePath = context.storageUri!; //TODO: will this work in non-workspaces? and also, is this different for each workspace? this is fucked.

    const isValid = this.phpService.checkPhpVersion();
    if (!isValid) return; 

    this.phpStanVersion = context.globalState.get<string>(GlobalStateEnum.PHP_STAN_VERSION) ?? "";
    await this.downloadLatestPharAsync(this.phpStanPath);
    context.globalState.update(GlobalStateEnum.PHP_STAN_VERSION, this.phpStanVersion);
    
    this.statusBarService.initStatusBar(context, this.phpStanVersion);

    const analysisDisposable = this.setupAnalysisListner();
    disposables.push(...analysisDisposable);

    const configurationDisposable = this.onConfigurationChange();
    disposables.push(configurationDisposable);

    context.subscriptions.push(this.diagCollection, ...disposables);

    this.analyseActiveDocument();
  }

  analyseActiveDocument() {
    const activeDocument = getActiveDocument();
    if (!activeDocument) return;
    this.analyseDocument(activeDocument);
  }

  private analysePath(analysisPath: string) {
    const level = getConfiguration<number>(ExtensionConfigurations.LEVEL);
    const dir = path.dirname(analysisPath);
    const base = path.basename(analysisPath);
    LoggingService.log(`Analysing ${dir} ${base}, Level ${level}`);
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

  async downloadLatestPharAsync(filePath: vscode.Uri): Promise<void> {
    const exists = await fileExistsAsync(filePath);
    if (exists && this.phpStanVersion) {
      LoggingService.log(`Found PHPStan version ${this.phpStanVersion}`);
      return;
    }

    const release = await this.githubService.downloadLatestReleaseAsync();
    const arrayBuffer = await release.file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    await vscode.workspace.fs.writeFile(filePath, uint8Array);
    this.phpStanVersion = release.version;
    showInfoMessage(`Successfully downloaded phpStan ${this.phpStanVersion} to ${filePath.fsPath}`);
    LoggingService.log(`Successfully downloaded phpStan ${this.phpStanVersion} to ${filePath.fsPath}`);
  }

  private onAnalysisError(output: string) {
    const errorOutput = JSON.parse(output) as IErrorOutput;
    LoggingService.log('Analysis Output', errorOutput);
    for (const [key, value] of Object.entries(errorOutput.files)) {
      const diangostics = this.buildDiagnosticsFromOutput(value.messages);
      addDiagnosticsToFile(this.diagCollection, key, diangostics);
    }
    this.statusBarService.setErrorState(errorOutput);
  }

  private setupAnalysisListner(): vscode.Disposable[] {
    this.analyseOn = getConfiguration<AnalysisOn>(ExtensionConfigurations.ANALYSIS_ON) ?? AnalysisOn.ON_SAVE;
    const disposables: vscode.Disposable[] = [];
    disposables.push(this.setupOnChangeListener());
    disposables.push(this.setupOnSaveListener());
    return disposables;
  }

  private analyseDocument(document: vscode.TextDocument) {
    this.statusBarService.setLoadingState();
    const analyseScope = getConfiguration<AnalysisScope>(
      ExtensionConfigurations.ANALYSIS_SCOPE
    );

    const documentURI = document.uri;
    const workspace = vscode.workspace.getWorkspaceFolder(documentURI);

    if (analyseScope === AnalysisScope.FILE) {
      LoggingService.log("Analysing File Scope");
      this.analysePath(documentURI.fsPath);
    } else if (analyseScope === AnalysisScope.DIRECTORY || !workspace) {
      LoggingService.log("Analysing Directory Scope");
      this.analysePath(vscode.Uri.joinPath(documentURI, '..').fsPath);
    } else if (analyseScope === AnalysisScope.WORKSPACE && workspace) {
      LoggingService.log("Analysing Workspace Scope");
      this.analysePath(workspace.uri.fsPath);
    }
  }

  private onAnalysisSuccess(output: string) {
    LoggingService.log(`Analysis completed successfully.`);
    this.statusBarService.setSuccessState();
    this.diagCollection.clear();
  }

  private onConfigurationChange(): vscode.Disposable {
    return vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration(ExtensionConfigurations.ANALYSIS_ON)) {
        LoggingService.log("AnalysisOn Configuration Changed.");
        this.analyseOn = getConfiguration<AnalysisOn>(ExtensionConfigurations.ANALYSIS_ON) ?? AnalysisOn.ON_SAVE;
      }
    });
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
        vscode.DiagnosticSeverity.Error,
      );

      diagnostic.source = 'phpstan';

      return diagnostic;
    });

    return diagnostics;
  }

  private setupOnChangeListener(): vscode.Disposable {
    LoggingService.log("Setting up OnChange Listener");
    const disposable = vscode.workspace.onDidChangeTextDocument(
      (event) => {
        if (this.analyseOn !== AnalysisOn.ON_CHANGE) return;
        LoggingService.log(`file changed ${event.document.fileName}`);
        this.analyseDocument(event.document);
      }
    );
    return disposable;
  }

  private setupOnSaveListener(): vscode.Disposable {
    LoggingService.log("Setting up OnSave Listener");
    const disposable = vscode.workspace.onDidSaveTextDocument(
      (document) => {
        if (this.analyseOn !== AnalysisOn.ON_SAVE) return;
        LoggingService.log(`file saved ${document.fileName}`);
        this.analyseDocument(document);
      }
    );
    return disposable;
  }
}
