
import { getVSCodeDownloadUrl } from '@vscode/test-electron/out/util';
import { QuickPickItem, window, Disposable, CancellationToken, QuickInputButton, QuickInput, ExtensionContext, QuickInputButtons, Uri, TextDocument, workspace, Position, Range } from 'vscode';
import * as xml2js from 'xml2js';
import { Settings } from '../settings';
import * as vscode from 'vscode';
import { DescartesState } from '../descartesState';
import { ReneriState } from '../reneriState';
import { updateStatusBarItem } from '../extension';
import { Utils } from '../utils/utils';

const resourceDescartesOperators: QuickPickItem[] = ['void', 'null', 'empty', 'new', 'optional','argument','this','constant']
.map(label => ({ label }));
const resourceDescartesOperatorsConstant: string[] = ["true", "false","0","1","(short)0","(short)1","(byte)0","(byte)1","0L","1L","0.0","1.0","0.0f","1.0f","'\\40'","'A'","\"\"","\"A\""];
const resourceDescartesGoal: QuickPickItem[] = [
	{ label: 'mutationCoverage', description: 'Will run mutationCoverage goal from Descartes plugin', detail: 'Descartes evaluates the capability of your test suite to detect bugs using extreme mutation testing.' }
];

const resourceReneriObserveMethodsGoal: QuickPickItem[] = [
	{ label: 'observeMethods', description: 'Will run observeMethods goal from Reneri plugin.', detail: 'Observes the execution of the original method and each transformed variant of the method.' }
];
const resourceReneriObserveTestsGoal: QuickPickItem[] = [
	{ label: 'observeTests', description: 'Will run observeTests goal from Reneri plugin.', detail: 'Observes the execution of each test case for the original methods and the transformed variants.' }
];
const resourceReneriHintsGoal: QuickPickItem[] = [
	{ label: 'hints', description: 'Will run hints goal from Reneri plugin', detail: 'Generates improvement hints according to the results obtained with the execution of the two previous goals.' }
];
const resourceLASoT: QuickPickItem[] = [
	{ label: 'LASoT', description: 'Will highlight methods and tests in your project based on Reneri hints.', detail: 'Brings Descartes and Reneri reported informations into the code.  Methods and tests signaled are decorated.' }
];

export class LASoTMultiStepInput {

	private descartesState: DescartesState;
	private reneriState: ReneriState;

	constructor(descartesState:DescartesState,reneriState:ReneriState){
		this.descartesState = descartesState;
		this.reneriState = reneriState;
	}
    
	multiStepInput:MultiStepInput = new MultiStepInput();
	state = {} as Partial<State>;

	public async collectInputs() {
		switch(this.state.step){
			/*case 1: {
				await this.multiStepInput.run(() => this.runDescartesMutationCoverage(this.multiStepInput));
			break;
			}*/
			case 1: {
				await this.multiStepInput.run(() => this.runReneriObserveMethodsGoal(this.multiStepInput));
				break;
			}
			case 2: {
				await this.multiStepInput.run(() => this.runReneriObserveTestsGoal(this.multiStepInput));
				break;
			}
			case 3: {
				await this.multiStepInput.run(() => this.runReneriHintsGoal(this.multiStepInput));
				break;
			}
			case 4: {
				await this.multiStepInput.run(() => this.showHints(this.multiStepInput));
				break;
			}
			default: {
				await this.multiStepInput.run(() => this.runDescartesMutationCoverage(this.multiStepInput));
			}
		}
		
		return this.state as State;
	}

	public async pickDescartesOperators(input: MultiStepInput) {
		const pick = await input.showQuickPick({
			title: 'Setup The Environment',
			step: 1,
			totalSteps: 6,
			placeholder: 'Select the desired mutation operators for descartes engine',
			items: resourceDescartesOperators,
            canSelectMany: true,
			activeItem: typeof this.state.resourceGroup !== 'string' ? this.state.resourceGroup : undefined,
			shouldResume: this.shouldResume,
			selectedItems: resourceDescartesOperators
		});
		this.state.resourceGroup = pick;
		this.state.step = 1;
		return (input: MultiStepInput) => this.runDescartesMutationCoverage(input);
	}
    
    public async runDescartesMutationCoverage(input: MultiStepInput) {
		const pick = await input.showQuickPick({
			title: 'Descartes',
			step: 1,
			totalSteps: 5,
			placeholder: 'Run Descartes mutationCoverage goal',
			items: resourceDescartesGoal,
            canSelectMany: false,
			activeItem: typeof this.state.resourceGroup !== 'string' ? this.state.resourceGroup : undefined,
			shouldResume: this.shouldResume
		});
		this.state.resourceGroup = pick;
		this.state.step = 1;
		
		let terminal: unknown;
		await vscode.commands.executeCommand('executeGoal', null, Settings.DESCARTES_MUTATION_COVERAGE,true,false,true).then(t => {
			terminal = t;
		});

		/*if(input.current){
			input.current.title = `Running Descartes mutationCoverage...`;
		}*/

		await vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			cancellable: true,
			title: 'Executing mutationCoverage goal'
		}, async (progress) => {
		
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

			await Utils.delay(2000);
			
			await this.descartesState.initialize();
			await this.descartesState.copyReportFilesToTargetFolder();
			updateStatusBarItem();
		});

		return (input: MultiStepInput) => this.runReneriObserveMethodsGoal(input);
	}

    public async runReneriObserveMethodsGoal(input: MultiStepInput) {
		const pick = await input.showQuickPick({
			title: 'Reneri',
			step: 2,
			totalSteps: 5,
			placeholder: 'Run Reneri observeMethods goal',
			items: resourceReneriObserveMethodsGoal,
            canSelectMany: false,
			activeItem: typeof this.state.resourceGroup !== 'string' ? this.state.resourceGroup : undefined,
			shouldResume: this.shouldResume
		});
		this.state.resourceGroup = pick;
		this.state.step = 2;
		
		let terminal: unknown;
		await vscode.commands.executeCommand('executeGoal', null, Settings.RENERI_OBSERVE_METHODS,true,false,true).then(t => {
			terminal = t;
		});

		await vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			cancellable: false,
			title: 'Executing Reneri observeMethods goal..'
		}, async (progress) => {
		
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
		});

		return (input: MultiStepInput) => this.runReneriObserveTestsGoal(input);
	}

    public async runReneriObserveTestsGoal(input: MultiStepInput) {
		const pick = await input.showQuickPick({
			title: 'Reneri',
			step: 3,
			totalSteps: 5,
			placeholder: 'Run Reneri observeTests goal',
			items: resourceReneriObserveTestsGoal,
            canSelectMany: false,
			activeItem: typeof this.state.resourceGroup !== 'string' ? this.state.resourceGroup : undefined,
			shouldResume: this.shouldResume
		});
		this.state.resourceGroup = pick;
		this.state.step = 3;
		
		let terminal: unknown;
		vscode.commands.executeCommand('executeGoal', null, Settings.RENERI_OBSERVE_TESTS,true,false,true).then(t => {
			terminal = t;
		});

		
		await vscode.window.withProgress({
			location: vscode.ProgressLocation.Window,
			cancellable: false,
			title: 'Executing Reneri observeTests goal'
		}, async (progress) => {
		
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
		});

		return (input: MultiStepInput) => this.runReneriHintsGoal(input);
	}
	
    public async runReneriHintsGoal(input: MultiStepInput) {
		const pick = await input.showQuickPick({
			title: 'Reneri',
			step: 4,
			totalSteps: 5,
			placeholder: 'Run Reneri hints goal',
			items: resourceReneriHintsGoal,
            canSelectMany: false,
			activeItem: typeof this.state.resourceGroup !== 'string' ? this.state.resourceGroup : undefined,
			shouldResume: this.shouldResume
		});
		this.state.resourceGroup = pick;
		this.state.step = 4;
		
		let terminal: unknown;
		vscode.commands.executeCommand('executeGoal', null, Settings.RENERI_HINTS,true,false,true).then(t => {
			terminal = t;
		});

		await vscode.window.withProgress({
			location: vscode.ProgressLocation.Window,
			cancellable: false,
			title: 'Executing Reneri hints goal'
		}, async (progress) => {
		
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
		});

		return (input: MultiStepInput) => this.showHints(input);
	}
	
    public async showHints(input: MultiStepInput) {
		const pick = await input.showQuickPick({
			title: 'LASoT',
			step: 5,
			totalSteps: 5,
			placeholder: 'Show Hints',
			items: resourceLASoT,
            canSelectMany: false,
			activeItem: typeof this.state.resourceGroup !== 'string' ? this.state.resourceGroup : undefined,
			shouldResume: this.shouldResume
		});
		this.state.resourceGroup = pick;
		this.state.step = 5;
		
		vscode.commands.executeCommand('lasot.highlightsHints');

		return /*(input: MultiStepInput) => inputName(input, state)*/;
	}

	public shouldResume() {
		// Could show a notification with the option to resume.
		return new Promise<boolean>((resolve, reject) => {
			// noop
			return true;
		});
	}

	private async awaitGoalExecution(terminal:vscode.Terminal) : Promise<void> {
		return vscode.window.withProgress({
			location: vscode.ProgressLocation.Window,
			cancellable: false,
			title: 'Executing mutationCoverage goal'
		}, async (progress) => {
			
			progress.report({  increment: 0 });
		
			await new Promise((resolve, reject) => {
				const disposeToken = vscode.window.onDidCloseTerminal(async (closedTerminal) => {
					if (closedTerminal === terminal) {
						  disposeToken.dispose();
						  if ((terminal).exitStatus !== undefined) {
							resolve((terminal).exitStatus);
						  } else {
							reject("Terminal exited with undefined status");
						  }
					}
				});
			});
		
			progress.report({ increment: 100 });
		});
	}
}

interface State {
	title: string;
	step: number;
	totalSteps: number;
	resourceGroup: QuickPickItem | string;
	name: string;
	runtime: QuickPickItem;
}


/*export async function multiStepInput(context: ExtensionContext) {


    
    
	const state = await collectInputs();
}*/

class InputFlowAction {
	static back = new InputFlowAction();
	static cancel = new InputFlowAction();
	static resume = new InputFlowAction();
}

type InputStep = (input: MultiStepInput) => Thenable<InputStep | void>;

interface QuickPickParameters<T extends QuickPickItem> {
	title: string;
	step: number;
	totalSteps: number;
	items: T[];
    canSelectMany: boolean;
	activeItem?: T;
	placeholder: string;
	buttons?: QuickInputButton[];
	shouldResume: () => Thenable<boolean>;
	selectedItems?: T[];
}

interface InputBoxParameters {
	title: string;
	step: number;
	totalSteps: number;
	value: string;
	prompt: string;
	validate: (value: string) => Promise<string | undefined>;
	buttons?: QuickInputButton[];
	shouldResume: () => Thenable<boolean>;
}

class MultiStepInput {

	async run(start: InputStep) {
		return this.stepThrough(start);
	}

	public current?: QuickInput;
	private steps: InputStep[] = [];
    private descartesOperators: string[] = [];

	async stepThrough(start: InputStep) {
		let step: InputStep | void = start;
		while (step) {
			this.steps.push(step);
			if (this.current) {
				this.current.enabled = false;
				this.current.busy = true;
			}
			try {
				step = await step(this);
			} catch (err) {
				if (err === InputFlowAction.back) {
					this.steps.pop();
					step = this.steps.pop();
				} else if (err === InputFlowAction.resume) {
					step = this.steps.pop();
				} else if (err === InputFlowAction.cancel) {
					step = undefined;
				} else {
					throw err;
				}
			}
		}
		if (this.current) {
			this.current.dispose();
		}
	}

	async showQuickPick<T extends QuickPickItem, P extends QuickPickParameters<T>>({ title, step, totalSteps, items, canSelectMany = false, activeItem, placeholder, buttons, shouldResume, selectedItems }: P) {
		const disposables: Disposable[] = [];
		try {
			return await new Promise<T | (P extends { buttons: (infer I)[] } ? I : never)>((resolve, reject) => {
				const input = window.createQuickPick<T>();
				input.title = title;
				input.step = step;
				input.totalSteps = totalSteps;
				input.placeholder = placeholder;
				input.items = items;
                input.canSelectMany = canSelectMany;
				if(selectedItems && selectedItems.length > 0){
					input.selectedItems = selectedItems;
				}
				if (activeItem) {
					input.activeItems = [activeItem];
				}
				input.buttons = [
					...(this.steps.length > 1 ? [QuickInputButtons.Back] : []),
					...(buttons || [])
				];
				disposables.push(
                    input.onDidAccept(async () => {
                        if(input.canSelectMany){
                            input.enabled = false;
                            input.busy = true;
							if(input.step === 1){
								await configOperators(input.selectedItems);
							}
                            resolve(items[0]);
                            input.enabled = true;
                            input.busy = false;
                        }
                    }),
					input.onDidTriggerButton(item => {
						if (item === QuickInputButtons.Back) {
							reject(InputFlowAction.back);
						} else {
							resolve(<any>item);
						}
					}),
					input.onDidChangeSelection(items => {
                        if(!canSelectMany){
                            resolve(items[0]);
                        }
                    }),
					input.onDidHide(() => {
						(async () => {
							reject(shouldResume && await shouldResume() ? InputFlowAction.resume : InputFlowAction.cancel);
						})()
							.catch(reject);
					})
				);
				if (this.current) {
					this.current.dispose();
				}
				this.current = input;
				this.current.show();
			});
		} finally {
			disposables.forEach(d => d.dispose());
		}
	}

	async showInputBox<P extends InputBoxParameters>({ title, step, totalSteps, value, prompt, validate, buttons, shouldResume }: P) {
		const disposables: Disposable[] = [];
		try {
			return await new Promise<string | (P extends { buttons: (infer I)[] } ? I : never)>((resolve, reject) => {
				const input = window.createInputBox();
				input.title = title;
				input.step = step;
				input.totalSteps = totalSteps;
				input.value = value || '';
				input.prompt = prompt;
				input.buttons = [
					...(this.steps.length > 1 ? [QuickInputButtons.Back] : []),
					...(buttons || [])
				];
				let validating = validate('');
				disposables.push(
					input.onDidTriggerButton(item => {
						if (item === QuickInputButtons.Back) {
							reject(InputFlowAction.back);
						} else {
							resolve(<any>item);
						}
					}),
					input.onDidAccept(async () => {
						const value = input.value;
						input.enabled = false;
						input.busy = true;
						if (!(await validate(value))) {
							resolve(value);
						}
						input.enabled = true;
						input.busy = false;
					}),
					input.onDidChangeValue(async text => {
						const current = validate(text);
						validating = current;
						const validationMessage = await current;
						if (current === validating) {
							input.validationMessage = validationMessage;
						}
					}),
					input.onDidHide(() => {
						(async () => {
							reject(shouldResume && await shouldResume() ? InputFlowAction.resume : InputFlowAction.cancel);
						})()
							.catch(reject);
					})
				);
				if (this.current) {
					this.current.dispose();
				}
				this.current = input;
				this.current.show();
			});
		} finally {
			disposables.forEach(d => d.dispose());
		}
	}
}

async function configOperators(selectedItems: readonly QuickPickItem[]) {
	workspace.openTextDocument(Uri.file(Settings.getPomPath() as string)).then((a: TextDocument) => {
		window.showTextDocument(a, 1, true).then(e => {
			e.edit(async edit => {

			//parse pom.xml to replace mutators config
			const parser = new xml2js.Parser(/* options */);
			let res:string='';
			
			//remove pom.xml content
			/*let lineCount = e.document.lineCount;
			let lastChar = e.document.lineAt(lineCount-1).range.end.character;		
			edit.delete(new Range(new Position(0,0),new Position(lineCount-1,lastChar)));
*/
			parser.parseString(e.document.getText(), function(error,result) {
				let plugins = result.project.build[0].plugins[0].plugin;
				for(const plugin of plugins){
					if(plugin.artifactId[0] === 'pitest-maven'){
						let configuration = plugin.configuration[0];
						
						//remove mutator element
						if(configuration['mutators']){
							delete configuration.mutators[0];
						} 
						if(selectedItems.length > 0 && selectedItems.length !== 8){
							let mutators = [{mutator:[]}];
							let m:string[] = [];
							for(let i = 0; i < selectedItems.length; i++){
								if(selectedItems[i].label === 'constant'){
									for(let j = 0; j < resourceDescartesOperatorsConstant.length; j++){
										m[i+j] = resourceDescartesOperatorsConstant[j];
									}
									i += resourceDescartesOperatorsConstant.length-1;
								}
								else{
									m[i] = selectedItems[i].label;
								}
							}
							mutators[0].mutator = m as never;
							configuration['mutators'] = mutators;
						}
					}
				}
				//build xml string from new result object
				const builder = new xml2js.Builder();
				res = builder.buildObject(result);
			});
		
			//insert complete new pom content in pom.xml
			let lineCount = e.document.lineCount;
			let lastChar = e.document.lineAt(lineCount-1).range.end.character;
			edit.replace(new Range(new Position(0,0), new Position(lineCount,lastChar)),res);
			});
		});
	}, (error: any) => {
		console.error(error);
		debugger;
	});
}
