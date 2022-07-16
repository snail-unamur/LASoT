// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { commands } from 'vscode';
import { Decorator } from './decorator/decorator';
import { Goal, MutationTestingProvider } from "./explorer/mutationTestingProvider";
import { DescartesState } from './descartesState';
import { ReneriState } from './reneriState';
import { LASoTMultiStepInput } from './quickpicks/lasotMultiStepInput';
import { Settings } from "./settings";

let myStatusBarItem: vscode.StatusBarItem;
let oldSurvivorsCount: number = 0;
let descartesState: DescartesState = new DescartesState();
let reneriState: ReneriState = new ReneriState();

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
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

	await descartesState.initialize();
	await reneriState.initialize();

    vscode.commands.registerCommand('executeGoal', (node?: Goal, goal?:string, exit?:boolean, hidden?:boolean, preserveFocus?:boolean) : vscode.Terminal => {
		let goalString: string = '';
		if(node && node.command?.command){
			goalString = node.command?.command;
		}
		else if(goal){
			goalString = goal;
		}

		let exitString:string="";
		if(exit){
			exitString = ";exit";
		}

		const terminal = vscode.window.createTerminal(`Ext Terminal #${NEXT_TERM_ID++}`);
		if(!hidden){
			terminal.show(preserveFocus);
		}
		terminal.sendText(`& "${mavenExecutablePath}" ${goalString} -f "${pomPath}" ${exitString}`);
		return terminal;
	});
	
    vscode.commands.registerCommand('lasot.highlightsHints', async () => {
		oldSurvivorsCount = reneriState.getNumberOfSurvivors();
		await descartesState.readDescartes();
		await reneriState.readReneri();
		decorator.active = true;
		decorator.triggerUpdateDecorations();
		updateStatusBarItem();
		const n = reneriState.getNumberOfSurvivors();
		if(n === 0) {
			vscode.window.showInformationMessage(`Yeah, no more survivors! Congratulations!`);
		}else if(n > 0) {
			if(n < oldSurvivorsCount) {
				vscode.window.showInformationMessage(`This is better! There are still ${n} survivors... Keep going!`);
			} 
			else {
				vscode.window.showInformationMessage(`Oups, There are more survivors than the last time!`);
			}
		}
	});

	// --- TreeView
	vscode.window.registerTreeDataProvider(
		'mutationTesting',
		new MutationTestingProvider()
	);

	// --- Decorator
	const decorator: Decorator = new Decorator(descartesState,reneriState);

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

	// --- MultistepInput
    const lasotMultiStepInput: LASoTMultiStepInput = new LASoTMultiStepInput();

	context.subscriptions.push(commands.registerCommand('lasot.wizard', async () => {
		lasotMultiStepInput.collectInputs();
		//multiStepInput(context).catch(console.error);
	}));

	// --- Status bar
	const myCommandId = 'lasot.showSurvivorsCount';
	context.subscriptions.push(vscode.commands.registerCommand(myCommandId, () => {
		let text: string = 'Pseudo tested methods found on ';
		for(const survivor of reneriState.testsObservation.survivors){
			text += survivor.mutation.class.toString() + ':' + survivor.mutation.method.toString() + ',';
		}
		vscode.window.showInformationMessage(text);
	}));

	myStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	myStatusBarItem.command = myCommandId;
	context.subscriptions.push(myStatusBarItem);

	updateStatusBarItem();
}

// this method is called when your extension is deactivated
export function deactivate() {}

function updateStatusBarItem(): void {
	const n = reneriState.getNumberOfSurvivors();
	if (n > 0) {
		myStatusBarItem.text = `$(bug) ${n} survivor(s)`;
		myStatusBarItem.show();
	} else {
		myStatusBarItem.hide();
	}
}


