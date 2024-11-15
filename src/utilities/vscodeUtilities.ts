import * as vscode from "vscode";
import { exec } from "child_process";

// export function showRana(title: string, cancellable: boolean = true, timeInSec = 10) {
//   vscode.window.withProgress(
//     {
//       location: vscode.ProgressLocation.Notification,
//       title: title,
//       cancellable: cancellable,
//     },
//     async (progress, token) => {
//       for (let i = 0; i < 10; i++) {
//         setTimeout(() => progress.report({ increment: i * 10 }), 3 * 1000);
//       }
//     }
//   );
// }

export function showRanooon(
  message: string,
  duration: number = 1000,
  cancellable: boolean = true
) {
  vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: message,
      cancellable: cancellable,
    },
    async (progress, token) => {
      const steps = 100;
      const delay = duration / steps;

      for (let i = 0; i <= steps; i++) {
        await new Promise<void>((resolve) => {
          setTimeout(() => {
            progress.report({ increment: 1 });
            resolve();
          }, delay);
        });
      }
    }
  );
}

export async function fileExistsAsync(uri: vscode.Uri): Promise<boolean> {
  try {
    await vscode.workspace.fs.stat(uri);
    return true;
  } catch {
    return false;
  }
}

export function runCommandInBackground(
  command: string,
  workingDirectory: string|undefined = undefined
) {
  exec(command, {cwd: workingDirectory} ,(error, stdout, stderr) => {
    if (error) {
      vscode.window.showErrorMessage(`Error: ${error.message}`);
      return;
    }
    if (stderr) {
      vscode.window.showWarningMessage(`Warning: ${stderr}`);
      return;
    }
    vscode.window.showInformationMessage(`Success: ${stdout}`); //TODO: remove later
  });
}

export function getActiveDirectory(): string | undefined {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    
    if (workspaceFolders && workspaceFolders.length > 0) {
        return workspaceFolders[0].uri.fsPath;
    }
    
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
        return vscode.Uri.joinPath(activeEditor.document.uri, "..").fsPath;
    }
    
    return undefined; // No active workspace or file
}

