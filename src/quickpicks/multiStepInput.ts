
import { getVSCodeDownloadUrl } from '@vscode/test-electron/out/util';
import { QuickPickItem, window, Disposable, CancellationToken, QuickInputButton, QuickInput, ExtensionContext, QuickInputButtons, Uri, TextDocument, workspace, Position, Range } from 'vscode';
import * as xml2js from 'xml2js';
import { Settings } from '../settings';
import { Utils } from '../utils/utils';

export async function multiStepInput(context: ExtensionContext) {

    const resourceDescartesOperators: QuickPickItem[] = ['void', 'null', 'empty', 'new', 'optional','argument','this']
    .map(label => ({ label }));
    const resourceDescartesGoal: QuickPickItem[] = [
		{ label: 'mutationCoverage', description: 'Will run mutationCoverage', detail: '.........' }
	];
    
	const resourceReneriObserveMethodsGoal: QuickPickItem[] = [
		{ label: 'observeMethods', description: 'Will run observeMethods goal.', detail: 'ldfsjsdklfk,d' }
	];
	const resourceReneriObserveTestsGoal: QuickPickItem[] = [
		{ label: 'observeTests', description: 'Will run observeTests goal.', detail: 'sjqdskjqdsqdn' }
	];
	const resourceReneriHintsGoal: QuickPickItem[] = [
		{ label: 'hints', description: 'Will run hints goal.', detail: '' }
	];
	const resourceLASoT: QuickPickItem[] = [
		{ label: 'LASoT', description: 'Will highlight reneri hints.', detail: '' }
	];
    
    
    interface State {
		title: string;
		step: number;
		totalSteps: number;
		resourceGroup: QuickPickItem | string;
		name: string;
		runtime: QuickPickItem;
	}

	async function collectInputs() {
		const state = {} as Partial<State>;
		await MultiStepInput.run(input => pickDescartesOperators(input, state));
		return state as State;
	}

    async function pickDescartesOperators(input: MultiStepInput, state: Partial<State>) {
		const pick = await input.showQuickPick({
			title: 'Setup The Environment',
			step: 1,
			totalSteps: 5,
			placeholder: 'Select the desired mutation operators for descartes engine',
			items: resourceDescartesOperators,
            canSelectMany: true,
			activeItem: typeof state.resourceGroup !== 'string' ? state.resourceGroup : undefined,
			shouldResume: shouldResume
		});
		state.resourceGroup = pick;
		return (input: MultiStepInput) => runDescartesMutationCoverage(input, state);
	}
    
    async function runDescartesMutationCoverage(input: MultiStepInput, state: Partial<State>) {
		const pick = await input.showQuickPick({
			title: 'Descartes',
			step: 2,
			totalSteps: 5,
			placeholder: 'Run Descartes mutationCoverage goal',
			items: resourceDescartesGoal,
            canSelectMany: false,
			activeItem: typeof state.resourceGroup !== 'string' ? state.resourceGroup : undefined,
			shouldResume: shouldResume
		});
		state.resourceGroup = pick;
		Utils.runGoal(Settings.DESCARTES_MUTATION_COVERAGE);
		return (input: MultiStepInput) => runReneriObserveMethodsGoal(input, state);
	}

    async function runReneriObserveMethodsGoal(input: MultiStepInput, state: Partial<State>) {
		const pick = await input.showQuickPick({
			title: 'Reneri',
			step: 2,
			totalSteps: 5,
			placeholder: 'Run Reneri observeMethods goal',
			items: resourceReneriObserveMethodsGoal,
            canSelectMany: false,
			activeItem: typeof state.resourceGroup !== 'string' ? state.resourceGroup : undefined,
			shouldResume: shouldResume
		});
		state.resourceGroup = pick;
		Utils.runGoal(Settings.RENERI_OBSERVE_METHODS);
		return (input: MultiStepInput) => runReneriObserveTestsGoal(input, state);
	}

    async function runReneriObserveTestsGoal(input: MultiStepInput, state: Partial<State>) {
		const pick = await input.showQuickPick({
			title: 'Reneri',
			step: 2,
			totalSteps: 5,
			placeholder: 'Run Reneri observeTests goal',
			items: resourceReneriObserveTestsGoal,
            canSelectMany: false,
			activeItem: typeof state.resourceGroup !== 'string' ? state.resourceGroup : undefined,
			shouldResume: shouldResume
		});
		state.resourceGroup = pick;
		Utils.runGoal(Settings.RENERI_OBSERVE_TESTS);
		return (input: MultiStepInput) => runReneriHintsGoal(input, state);
	}
	
    async function runReneriHintsGoal(input: MultiStepInput, state: Partial<State>) {
		const pick = await input.showQuickPick({
			title: 'Reneri',
			step: 2,
			totalSteps: 5,
			placeholder: 'Run Reneri hints goal',
			items: resourceReneriHintsGoal,
            canSelectMany: false,
			activeItem: typeof state.resourceGroup !== 'string' ? state.resourceGroup : undefined,
			shouldResume: shouldResume
		});
		state.resourceGroup = pick;
		Utils.runGoal(Settings.RENERI_HINTS);
		return (input: MultiStepInput) => ShowHints(input, state);
	}
	
    async function ShowHints(input: MultiStepInput, state: Partial<State>) {
		const pick = await input.showQuickPick({
			title: 'LASoT',
			step: 2,
			totalSteps: 5,
			placeholder: 'Show Hints',
			items: resourceLASoT,
            canSelectMany: false,
			activeItem: typeof state.resourceGroup !== 'string' ? state.resourceGroup : undefined,
			shouldResume: shouldResume
		});
		state.resourceGroup = pick;
		//ReadReneri();
		return /*(input: MultiStepInput) => inputName(input, state)*/;
	}

	function shouldResume() {
		// Could show a notification with the option to resume.
		return new Promise<boolean>((resolve, reject) => {
			// noop
		});
	}
    
	const state = await collectInputs();
}

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

	static async run<T>(start: InputStep) {
		const input = new MultiStepInput();
		return input.stepThrough(start);
	}

	private current?: QuickInput;
	private steps: InputStep[] = [];
    private descartesOperators: string[] = [];

	private async stepThrough<T>(start: InputStep) {
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

	async showQuickPick<T extends QuickPickItem, P extends QuickPickParameters<T>>({ title, step, totalSteps, items, canSelectMany = false, activeItem, placeholder, buttons, shouldResume }: P) {
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
			var parser = new xml2js.Parser(/* options */);
			var res:string='';

			parser.parseString(e.document.getText(), function(error,result) {
				let plugins = result.project.build[0].plugins[0].plugin;
				for(const plugin of plugins){
					if(plugin.artifactId[0] === 'pitest-maven'){
						let configuration = plugin.configuration[0];
						//remove mutator element
						if(configuration.mutators[0]){
							delete configuration.mutators[0];
						} 
						if(selectedItems.length > 0){
							var mutators = [{mutator:[]}];
							var m:string[] = [];
							for(var i = 0; i < selectedItems.length; i++){
								m[i] = selectedItems[i].label;
							}
							mutators[0].mutator = m as never;
							configuration['mutators'] = mutators;
						}
					}
				}
				
				//build xml string from new result object
				var builder = new xml2js.Builder();
				res = builder.buildObject(result);
			});

			//remove pom.xml content
			let lineCount = e.document.lineCount;
			let lastChar = e.document.lineAt(lineCount-1).range.end.character;				
			edit.delete(new Range(new Position(0,0),new Position(lineCount-1,lastChar)));
			//insert complete new pom content in pom.xml
			edit.insert(new Position(0,0),res);
			});
		});
	}, (error: any) => {
		console.error(error);
		debugger;
	});
}
