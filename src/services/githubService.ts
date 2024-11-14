import { IGithubLatestRelease } from "../interfaces/latestReleaseInterface";
import * as vscode from 'vscode';

export class GithubService {
	async getPhpStanLatestReleaseAsync(): Promise<IGithubLatestRelease> {
		var res = await fetch('https://api.github.com/repos/phpstan/phpstan/releases/latest');
		var body = await res.json() as IGithubLatestRelease;
		return body;
	}

	async downloadLatestReleaseAsync(): Promise<Blob> {
		var latestRelease = await this.getPhpStanLatestReleaseAsync();
		var pharLink = latestRelease.assets.find(a => a.browser_download_url.includes('phar'))?.browser_download_url;
		if (!pharLink) {
			vscode.window.showWarningMessage(`Couldn't fetch phpStan latest release. Please Rerun download command, or Download it manually and update extension settings`);
		}
		vscode.window.showInformationMessage(`Downloading phpStan ${latestRelease.tag_name} ...`);
		var res = await fetch(pharLink!);
		var file = await res.blob();
		return file;
	}
}