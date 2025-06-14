import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export class IconGenerator {
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    public async generateIcons(): Promise<void> {
        try {
            // Check for ImageMagick
            try {
                execSync('which convert', { stdio: 'ignore' });
            } catch (error) {
                vscode.window.showErrorMessage(
                    'ImageMagick is required for icon generation. Please install it first:\nbrew install imagemagick'
                );
                return;
            }

            // Get the extension's root path
            const extensionPath = this.context.extensionPath;
            const sourceSvg = path.join(extensionPath, 'icon.svg');
            const outputDir = path.join(extensionPath, 'images');

            // Check if source SVG exists
            if (!fs.existsSync(sourceSvg)) {
                vscode.window.showErrorMessage('Source SVG not found. Please ensure icon.svg exists in the extension root.');
                return;
            }

            // Create output directory if it doesn't exist
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            // Show progress
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Generating VS Blue Icons",
                cancellable: false
            }, async (progress) => {
                progress.report({ message: "Generating SVG icon..." });

                // Generate SVG
                const svgContent = fs.readFileSync(sourceSvg, 'utf8');
                const svgPath = path.join(outputDir, 'icon.svg');
                fs.writeFileSync(svgPath, svgContent);

                // Generate PNGs in different sizes
                const sizes = [16, 32, 48, 128];
                for (const size of sizes) {
                    progress.report({ message: `Generating ${size}x${size} PNG icon...` });
                    const outputPath = path.join(outputDir, `icon-${size}.png`);
                    const command = `convert "${sourceSvg}" -resize ${size}x${size} "${outputPath}"`;
                    execSync(command, { stdio: 'ignore' });
                }
            });

            vscode.window.showInformationMessage('VS Blue icons generated successfully!');
        } catch (error) {
            if (error instanceof Error) {
                vscode.window.showErrorMessage(`Error generating icons: ${error.message}`);
            } else {
                vscode.window.showErrorMessage(`Error generating icons: ${String(error)}`);
            }
        }
    }
}
