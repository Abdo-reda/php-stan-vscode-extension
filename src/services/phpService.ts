import { runCommandSync, showInfoMessage, showWarningMessage } from "../utilities/vscodeUtilities";
import { LoggingService } from "./loggingService";

export class PhpService {
  private MIN_PHP_VERSION = "7.2.0";

  checkPhpVersion(): boolean {
    const phpVersion = this.getPhpVersion();
    const phpBinary = this.getPhpBinary();
    LoggingService.log(`PHP Version ${phpVersion}, Found at ${phpBinary}`);
    const isValid = this.comparePhpVersion();
    return isValid;
  }

  private getPhpVersion(): string {
    LoggingService.log("Getting PHP Version ...");
    try {
      const output = runCommandSync("php -r \"echo PHP_VERSION;\"");
      return output;
    } catch (error) {
      return '-';
    }
  }

  private getPhpBinary(): string {
    LoggingService.log("Getting PHP Binary ...");
    try {
      const output = runCommandSync("php -r \"echo PHP_BINARY;\"");
      return output;
    } catch (error) {
      return 'unknown';
    }
  }

  private comparePhpVersion(): boolean {
    LoggingService.log("Checking PHP Version ...");
    try {
      runCommandSync(`php -r \"exit(version_compare(PHP_VERSION, '${this.MIN_PHP_VERSION}', '>=') ? 0 : 1);\"`);
      this.onPhpVersionSuccess();
      return true;
    } catch (error) {
      this.onPhpVersionError();
      return false;
    }
  }

  private onPhpVersionError() {
    LoggingService.warn("PHP Version Error.");
    showWarningMessage(`Minimum PHP Version not found. Please install PHP ${this.MIN_PHP_VERSION} or higher`);
  }

  private onPhpVersionSuccess(): boolean {
    LoggingService.log("Php Version Success !");
    return true;
  }
}
