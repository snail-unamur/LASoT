// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { commands } from 'vscode';
import { Decorator } from './decorator/decorator';
import { Goal, MutationTestingProvider } from "./explorer/mutationTestingProvider";
import { multiStepInput } from './quickpicks/multiStepInput';
import { ReneriSerialized } from './reneriSerialized';
import { Settings } from "./settings";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	let NEXT_TERM_ID = 1;

	let pomPath = Settings.getPomPath();
	if(pomPath === undefined){
		vscode.window.showErrorMessage("pom.xml not found.  Install maven plugin.");
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
	
	const reneriSerialized: ReneriSerialized = new ReneriSerialized();

    vscode.commands.registerCommand('lasot.highlightsHints', async () => {
		await reneriSerialized.ReadReneri();
		decorator.active = true;
		decorator.triggerUpdateDecorations();
	});

	vscode.window.registerTreeDataProvider(
		'mutationTesting',
		new MutationTestingProvider()
	);


	// --- Decorator
	const decorator: Decorator = new Decorator(reneriSerialized);

	vscode.window.onDidChangeActiveTextEditor(editor => {
		decorator.activeEditor = editor;
		if (editor) {
			decorator.triggerUpdateDecorations();
		}
	}, null, context.subscriptions);

	vscode.workspace.onDidChangeTextDocument(event => {
		if (decorator.activeEditor && event.document === decorator.activeEditor.document) {
			decorator.triggerUpdateDecorations(true);
		}
	}, null, context.subscriptions);

	// --- TreeView
	context.subscriptions.push(commands.registerCommand('lasot.wizard', async () => {
		multiStepInput(context).catch(console.error);
	}));
}

// this method is called when your extension is deactivated
export function deactivate() {}


