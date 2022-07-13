import * as vscode from 'vscode';
import { MarkdownString } from 'vscode';
import { DescartesMethod, DescartesState } from '../descartesState';
import { Hint, ReneriState, Survivor } from '../reneriState';

export class Decorator {

    public active: boolean = false;
	public activeEditor = vscode.window.activeTextEditor;
    reneriState: ReneriState;
	descartesState: DescartesState;

    // decorator type used to decorate code pointed by reneri hints
	reneriHintDecorationType = vscode.window.createTextEditorDecorationType({
		borderWidth: '1px',
		borderStyle: 'solid',
		overviewRulerColor: 'blue',
		overviewRulerLane: vscode.OverviewRulerLane.Right,
		light: {
			// this color will be used in light color themes
			borderColor: 'darkblue'
		},
		dark: {
			// this color will be used in dark color themes
			borderColor: 'lightblue'
		}
	});

	defaultDecorationType = vscode.window.createTextEditorDecorationType({
		backgroundColor: 'green',
		border: '2px solid white',
	  });

    constructor(descartesState: DescartesState,reneriState:ReneriState) {
		this.descartesState = descartesState;
        this.reneriState = reneriState;
	    if (this.activeEditor) {
		    this.triggerUpdateDecorations();
	    }
    }

	timeout: NodeJS.Timer | undefined = undefined;

	triggerUpdateDecorations(throttle = false) {
		if (this.timeout) {
			clearTimeout(this.timeout);
			this.timeout = undefined;
		}
		if (throttle) {
			this.timeout = setTimeout(this.updateDecorations, 500);
		} else {
			this.updateDecorations();
		}
	}

    async updateDecorations() {
        if (!this.active) {
            return;
        }
        if (!this.activeEditor) {
            return;
        }
        
		const decorationOptions: vscode.DecorationOptions[] = [];

		for(const survivor of this.reneriState.testsObservation.survivors){	
			for(const hint of survivor.hints){
				if(this.activeEditor.document.uri.fsPath.toLocaleLowerCase() === hint.location.file.toLowerCase()){
					const decoration = this.generateTestDecoration(hint,survivor);
					decorationOptions.push(decoration);
				}
			}
		}
		
		for(const survivor of this.reneriState.methodsObservation.survivors){	
			for(const diff of survivor.diffs){
				if(!diff.pointcut.match('^.*history.*$')){
					const descartesMutation = this.descartesState.descartesReports.mutationReport.mutations.filter(m => 
						m.method.class === survivor.mutation.class 
						&& m.method.package === survivor.mutation.package
						&& m.method.name === survivor.mutation.method);
					const descartesMethod = this.descartesState.descartesReports.methodReport.methods.filter(m => 
						m.class === survivor.mutation.class 
						&& m.package === survivor.mutation.package
						&& m.name === survivor.mutation.method);
					if(descartesMutation && descartesMethod){	
						const f = await vscode.workspace.findFiles('**/src/**/' + descartesMutation[0].file);
						if(f){
							if(this.activeEditor.document.uri.fsPath.toLocaleLowerCase() === f[0].fsPath.toLowerCase()){
								let l = descartesMutation[0].line;
								while(!this.activeEditor.document.lineAt(l).text.match('^.*' + descartesMutation[0].method.name + '.*$')){
									l--;
									if(l === descartesMutation[0].line-10){
										break;
									}
								}
								const range = this.activeEditor.document.lineAt(l).range;
								const decoration = this.generateMethodDecoration(descartesMethod[0],range);
								decorationOptions.push(decoration);
							}
						}
					}
				}
			}
		}
		
		this.activeEditor.setDecorations(this.reneriHintDecorationType, decorationOptions);
    }
	
	generateMethodDecoration(descartesMethod: DescartesMethod, range: vscode.Range) : vscode.DecorationOptions {
		const hoverMessage = this.generateMethodHoverMessage(descartesMethod);
		return { range: range, hoverMessage: hoverMessage };
	}

	generateTestDecoration(hint: Hint, survivor: Survivor) : vscode.DecorationOptions {
			const from = new vscode.Position(hint.location.from.line-1, hint.location.from.column-1);
			const to = new vscode.Position(hint.location.to.line-1, hint.location.to.column);
			const range: vscode.Range = new vscode.Range(from , to);
			const hoverMessage = this.generateTestHoverMessage(survivor, hint);
			return { range: range, hoverMessage: hoverMessage };
	}


	generateTestHoverMessage(survivor: Survivor, hint: Hint) : MarkdownString{
		const diff = survivor.diffs.find(d => d.pointcut === hint.pointcut);
		let markDownString: MarkdownString = new MarkdownString();
		markDownString.value = 
		`
		Original Code
		~ Value : ${diff?.expected[0].literalValue}
		~ Type : ${diff?.expected[0].typeName}
	
		Undetected Mutation
		~ Value : ${diff?.unexpected[0].literalValue}
		~ Type : ${diff?.unexpected[0].typeName}
		`;
		return markDownString;
	}
	
	generateMethodHoverMessage(descartesMethod: DescartesMethod) : MarkdownString{
		let markDownString: MarkdownString = new MarkdownString();
		markDownString.appendMarkdown(`
		** This method is ${descartesMethod.classification} **
		`);
		for(const mutation of descartesMethod.mutations){
			if(mutation.status === 'SURVIVED'){
				markDownString.appendMarkdown(
				`
				Undetected mutation : 
				~ mutator : ${mutation.mutator}
				~ tests run : ${mutation.tests}
				`);
			}
			if(mutation.status === "KILLED"){
				markDownString.appendMarkdown(
				`
				Killed mutation : 
				~ mutator : ${mutation.mutator}
				~ tests run : ${mutation.killing_tests}
				`);	
			}
		}
		return markDownString;
	}
}



