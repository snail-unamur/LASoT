// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { commands } from 'vscode';
import { Decorator } from './decorator/decorator';
import { Goal, LASoTExplorerProvider } from "./explorer/lasotExplorerProvider";
import { DescartesState } from './descartesState';
import { ReneriState } from './reneriState';
import { LASoTMultiStepInput } from './quickpicks/lasotMultiStepInput';
import { Settings } from "./settings";
import { Utils } from './utils/utils';

let statusBarItem: vscode.StatusBarItem;
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

	let mavenExecutablePath = await Settings.getMavenWrapper();
	if(mavenExecutablePath === undefined){
		/*
		let mavenExecutablePath = Settings.getMavenExecutablePath();
		if(mavenExecutablePath === undefined){
			vscode.window.showErrorMessage("Configure maven.executable.path in settings.json file.");
		}
		else{
			mavenExecutablePath = mavenExecutablePath.concat('.cmd');
		}*/
		mavenExecutablePath = "mvn";
	} else if(Settings.isWindows()){
		mavenExecutablePath = `start ${mavenExecutablePath}`;
	} else {
		mavenExecutablePath = `. ${mavenExecutablePath}`;
	}

	await descartesState.initialize();
	await reneriState.initialize();

    vscode.commands.registerCommand('executeGoal', async (node?: Goal, goal?:string, exit?:boolean, hidden?:boolean, preserveFocus?:boolean, title?:string) : Promise<vscode.Terminal> => {
		let goalString: string = '';
		if(node && node.command?.command){
			goalString = node.command?.command;
		}
		else if(goal){
			goalString = goal;
		}

		let exitString:string="";
		if(exit || (node && node.exit)){
			exitString = ";exit";
		}
		
		const terminal = vscode.window.createTerminal(`Ext Terminal #${NEXT_TERM_ID++}`);
		
		vscode.window.withProgress({
			location: vscode.ProgressLocation.Window,
			title: `Executing ${(node?node.command?.title:title)} goal`,
			cancellable: false
		}, async (progress, token) => {
			token.onCancellationRequested(() => {
				console.log("User canceled the long running operation");
			});

			progress.report({ increment: 0 });
			
			if(node && node.command?.title === "observeMethods" || goal === "eu.stamp-project:reneri:observeMethods"){
				progress.report({ increment: 10 });
				await descartesState.initialize();
				await descartesState.copyReportFilesToTargetFolder();
			}
			
			await Utils.delay(2000);

			if(!hidden){
				terminal.show(preserveFocus);
			}
			let cmd = `${mavenExecutablePath} ${goalString} -f "${pomPath}" ${exitString}`;
			console.debug(`Executing in terminal: ${cmd}`);
			terminal.sendText(cmd);
	
			progress.report({ increment: 20 });

			if((node && node.exit) || exit){
				await new Promise((resolve, reject) => {
					const disposeToken = vscode.window.onDidCloseTerminal(async (closedTerminal) => {
						if (closedTerminal === terminal) {
							  disposeToken.dispose();
							  if ((terminal as vscode.Terminal).exitStatus !== undefined) {
								resolve((terminal as vscode.Terminal).exitStatus);
							  } else {
								reject("Terminal exited with undefined status");
							  }
						}
					});
				});
				
				progress.report({ increment: 50 });
	
			}

			progress.report({ increment: 80 });
			
			const p = new Promise<void>(resolve => {
				setTimeout(() => {
					resolve();
				}, 2000);
			});
			
			progress.report({ increment: 100 });

			return p;
		});

		return terminal;
	});
	
    vscode.commands.registerCommand('lasot.highlightsHints', async () => {
		await descartesState.initialize();
		await reneriState.initialize();
		updateStatusBarItem();
		newScoreNotification();
		decorator.activate();
		decorator.triggerUpdateDecorations();
	});

    vscode.commands.registerCommand('lasot.DeactivateHighlights', async () => {
		decorator.deactivate();
	});

	// --- TreeView
	vscode.window.registerTreeDataProvider(
		'lasotExplorer',
		new LASoTExplorerProvider()
	);

	vscode.commands.registerCommand('lasotExplorer.refresh', async () => {
    	await descartesState.initialize();
		await reneriState.initialize();
		updateStatusBarItem();
		newScoreNotification();
	});

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
    const lasotMultiStepInput: LASoTMultiStepInput = new LASoTMultiStepInput(descartesState,reneriState);

	context.subscriptions.push(commands.registerCommand('lasot.wizard', async () => {
		lasotMultiStepInput.collectInputs();
		//multiStepInput(context).catch(console.error);
	}));

	vscode.commands.registerCommand('executeMultiStepGoal', async (node?: Goal, goal?:string, exit?:boolean, hidden?:boolean, preserveFocus?:boolean) : Promise<vscode.Terminal> => {

		let exitString:string="";
		if(exit || (node && node.exit)){
			exitString = ";exit";
		}
		
		const terminal = vscode.window.createTerminal(`Ext Terminal #${NEXT_TERM_ID++}`);
		
		if(!hidden){
			terminal.show(preserveFocus);
		}

		let cmd = `${mavenExecutablePath} ${goal} -f "${pomPath}" ${exitString}`;
		console.debug(`Executing in terminal: ${cmd}`);
		terminal.sendText(cmd);

		return terminal;
	});

	// --- Status bar

	// Create
	statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	context.subscriptions.push(statusBarItem);
	
	
	const statusBarCommandId = 'lasot.showSurvivorsCount';
	statusBarItem.command = statusBarCommandId;

	// Bind Notification to statusBarCommand
	context.subscriptions.push(vscode.commands.registerCommand(statusBarCommandId, () => {
		const survivorCount = descartesState.getSurvivors().length;
		let text: string = 'Mutation score : ' + descartesState.getMutationScore().toFixed(2) +'% of mutations survived.\n';
		text += `Survived mutations (${survivorCount}) : \n`;
		for(const survivor of descartesState.getSurvivors()){
			text += '- Mutator : ' 
				+ survivor.mutator.toString() + ' on Method : ' 
				+ survivor.file.replace('java','') + survivor.method.name.toString() + '\n';
		}
		vscode.window.showInformationMessage(text, { modal:true });
	}));

	updateStatusBarItem();
}

// this method is called when your extension is deactivated
export function deactivate() {}

export function updateStatusBarItem(): void {
	const score = descartesState.getMutationScore().toFixed(2);
	statusBarItem.text = `$(bug) ${score}%`;
	statusBarItem.show();
}

function newScoreNotification(): void {
	const score = descartesState.getMutationScore();
	const oldScore = descartesState.getOldMutationScore();
	if(score > oldScore){
		vscode.window.showInformationMessage(`${score.toFixed(2)}% of mutations survived. This score is greater than the old one.  Keep on going! You'll do better next time.`);
	}
	else if(score === descartesState.getOldMutationScore()){
		vscode.window.showInformationMessage(`${score.toFixed(2)}% of mutations survived. This score is the same than the old one.`);
	}
	else{
		vscode.window.showInformationMessage(`${score.toFixed(2)}% of mutations survived. Congratulation ! This score is smaller than the old one.  Keep up the good work!`);
	}
}

