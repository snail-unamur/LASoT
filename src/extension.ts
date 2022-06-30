// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { commands } from 'vscode';
import { MutationTestingProvider } from "./explorer/mutationTestingProvider";
import { Goal } from "./explorer/mutationTestingProvider";
import { multiStepInput } from './multiStepInput';
import { Settings } from "./settings";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	let NEXT_TERM_ID = 1;

	let pomPath = Settings.getPomPath();
	if(pomPath === undefined){
		vscode.window.showErrorMessage("pom.xml not found.  Install maven plugin.")
	}

	let mavenExecutablePath = Settings.getMavenExecutablePath();
	if(mavenExecutablePath === undefined){
		vscode.window.showErrorMessage("Configure maven.executable.path in settings.json file.");
	}
	else{
		mavenExecutablePath = mavenExecutablePath.concat('.cmd');
	}

    vscode.commands.registerCommand('executeGoal', (node: Goal) => {
        const terminal = vscode.window.createTerminal(`Ext Terminal #${NEXT_TERM_ID++}`);
        terminal.show();
        terminal.sendText(`& "${mavenExecutablePath}" ${node.command?.command} -f "${pomPath}"`);
	});
	
	vscode.window.registerTreeDataProvider(
		'mutationTesting',
		new MutationTestingProvider()
	);

	context.subscriptions.push(commands.registerCommand('lasot.wizard', async () => {
		multiStepInput(context).catch(console.error);
	}));
}

// this method is called when your extension is deactivated
export function deactivate() {}
