"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.IconGenerator = void 0;
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const vscode = __importStar(require("vscode"));
class IconGenerator {
    constructor(context) {
        this.context = context;
    }
    async generateIcons() {
        try {
            // Check for ImageMagick
            try {
                (0, child_process_1.execSync)('which convert', { stdio: 'ignore' });
            }
            catch (error) {
                vscode.window.showErrorMessage('ImageMagick is required for icon generation. Please install it first:\nbrew install imagemagick');
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
                    (0, child_process_1.execSync)(command, { stdio: 'ignore' });
                }
            });
            vscode.window.showInformationMessage('VS Blue icons generated successfully!');
        }
        catch (error) {
            if (error instanceof Error) {
                vscode.window.showErrorMessage(`Error generating icons: ${error.message}`);
            }
            else {
                vscode.window.showErrorMessage(`Error generating icons: ${String(error)}`);
            }
        }
    }
}
exports.IconGenerator = IconGenerator;
//# sourceMappingURL=iconGenerator.js.map