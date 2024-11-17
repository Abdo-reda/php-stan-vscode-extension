import * as vscode from "vscode";

export class StatusBarService {
    private _statusBar: vscode.StatusBarItem;

    constructor(context: vscode.ExtensionContext) {
        this._statusBar = this.createStatusBar();
        this.pushToSubscription(context);
    }

    private createStatusBar(): vscode.StatusBarItem {
        const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
        statusBarItem.show();
        return statusBarItem;
    }

    public pushToSubscription(context: vscode.ExtensionContext): void {
        context.subscriptions.push(this._statusBar);
    }

    public setVersion(version: string): void {
        this._statusBar.text = `$(php-stan) ${version}`;
    }

    public setError(): void {
        // this._statusBar.color = new vscode.ThemeColor("errorForeground");
        // this._statusBar.text = `$(error) PHPStan`;
    }
    // $(sync~spin)
    // $(sync~loading)
    // $(sync~gear)

    public setToolTip(tooltip: string): void {
        this._statusBar.tooltip = tooltip;
    }
}
