import * as vscode from "vscode";
import { IErrorOutput } from "../interfaces/errorOutputInterface";
import path from "path";

export class StatusBarService {
    private statusBar: vscode.StatusBarItem;
    private phpStanVersion: string = '-';
    private defaultColor: vscode.ThemeColor;
    private errorColor: vscode.ThemeColor;
    private successColor: vscode.ThemeColor;

    constructor() {
        this.statusBar = this.createStatusBar();
        this.defaultColor = new vscode.ThemeColor('statusBarItem.foreground');
        this.errorColor = new vscode.ThemeColor('errorForeground');
        this.successColor = new vscode.ThemeColor('notebookStatusSuccessIcon.foreground');
    }

    public initStatusBar(context: vscode.ExtensionContext, phpStanVersion: string): void 
    {
        this.phpStanVersion = phpStanVersion;
        context.subscriptions.push(this.statusBar);
        this.setDefaultState();
        this.setDefaultCommand();
        this.statusBar.show();
    }
    
    private setDefaultCommand(): void 
    {
        this.statusBar.command = 'php-stan._showOutput';
    }

    private setErrorCommand(): void
    {
        this.statusBar.command = "workbench.action.problems.focus"; 
    }

    private createStatusBar(): vscode.StatusBarItem {
        const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
        return statusBarItem;
    }

    public setSuccessState(): void {
        this.setDefaultCommand();
        this.setSuccessToolTip();
        this.statusBar.color = this.successColor;
        this.statusBar.text = `$(php-stan-success) ${this.phpStanVersion}`;
    }
    
    public setDefaultState(): void {
        this.setDefaultCommand();
        this.setDefaultToolTip();
        this.statusBar.color = this.defaultColor;
        this.statusBar.text = `$(php-stan) ${this.phpStanVersion}`;
    }
    
    public setLoadingState(): void {
        this.setDefaultCommand();
        this.setLoadingToolTip();
        this.statusBar.color = this.defaultColor;
        this.statusBar.text = `$(loading~spin) ${this.phpStanVersion}`;
    }
    
    public setErrorState(errors: IErrorOutput): void {
        this.setErrorCommand();
        this.setErrorToolTip(errors);
        this.statusBar.color = this.errorColor;
        this.statusBar.text = `$(php-stan-error) ${this.phpStanVersion}`;
    }

    private setDefaultToolTip(): void {
        this.statusBar.tooltip = ''; //Using **PHP ${version}**
    }

    private setLoadingToolTip(): void {
        this.statusBar.tooltip = 'phpstan analysing ...';
    }

    private setSuccessToolTip(): void {
        this.statusBar.tooltip = 'No errors were found.';
    }

    private setErrorToolTip(errors: IErrorOutput): void {
        const totalErrors = errors.totals.file_errors;
        const markdown = new vscode.MarkdownString();
        markdown.isTrusted = true; 
        markdown.appendMarkdown(`**${totalErrors} error(s) found.**\n\n`);

        for (const [key, value] of Object.entries(errors.files)) {
            const fileName = path.basename(key);
            const fileUri = vscode.Uri.file(key);
            markdown.appendMarkdown(
                `- [${fileName}, ${value.errors} errors.](${fileUri})\n\n`
            );
        }

        this.statusBar.tooltip = markdown;
    }
}
