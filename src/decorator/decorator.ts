import * as vscode from 'vscode';
import { MarkdownString } from 'vscode';
import { DescartesMethod, DescartesMutationDetail, DescartesState } from '../descartesState';
import { Hint, ReneriState, SignaledMethod } from '../reneriState';
import { Settings } from '../settings';

export class Decorator {

    private active: boolean = false;
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

    constructor(descartesState: DescartesState,reneriState:ReneriState) {
		this.descartesState = descartesState;
        this.reneriState = reneriState;
	    if (this.activeEditor) {
		    this.triggerUpdateDecorations();
	    }
    }

	timeout: NodeJS.Timer | undefined = undefined;

	deactivate(){
		this.active = false;
        if (!this.activeEditor) {
            return;
        }
		const decorationOptions: vscode.DecorationOptions[] = [];
		this.activeEditor.setDecorations(this.reneriHintDecorationType, decorationOptions);
	}

	activate(){
		this.active = true;
	}

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

		if(this.reneriState.testsObservation.signaledMethods.length > 0){
			for(const signaledMethod of this.reneriState.testsObservation.signaledMethods){	
				if(signaledMethod.hints.length > 0){
					for(const hint of signaledMethod.hints){
						if(this.activeEditor.document.uri.fsPath.toLocaleLowerCase() === hint.location.file.toLowerCase()){
							const decoration = this.generateTestDecoration(hint,signaledMethod);
							decorationOptions.push(decoration);
						}
					}
				}
				else{
					const descartesMutation = this.descartesState.descartesReports.mutationReport.mutations.filter( m => 
						m.status === 'SURVIVED'
						&& m.method.class === signaledMethod.mutation.class
						&& m.method.name === signaledMethod.mutation.method);
					if(descartesMutation){
						if(this.activeEditor.document.uri.fsPath.toLocaleLowerCase().indexOf(descartesMutation[0].file) !== 0){
							for(const testString of descartesMutation[0].tests.ordered){
								const testString0 = testString.split('(')[0];
								let testName = testString0.substring(testString0.lastIndexOf('.')+1, testString.length-1);
								
								for(let line = 0; line < this.activeEditor.document.lineCount; line++){
									if(this.activeEditor.document.lineAt(line).text.match('^.*' + testName + '.*$')){
										this.activeEditor.document.lineAt(line).firstNonWhitespaceCharacterIndex;
										const firstChar = this.activeEditor.document.lineAt(line).firstNonWhitespaceCharacterIndex;
										const lastChar = this.activeEditor.document.lineAt(line).text.length-1;
										const decoration = this.generateTestDecorationByDescartesMutation(descartesMutation[0],line,firstChar,lastChar);
										decorationOptions.push(decoration);
									}
								}
							}
						}
					}
				}
			}
		}
		else{
			for(const descartesMutation of this.descartesState.descartesReports.mutationReport.mutations.filter( m => 
				m.status === 'SURVIVED')){
				if(this.activeEditor.document.uri.fsPath.toLocaleLowerCase().indexOf(descartesMutation.file) !== 0){
					for(const testString of descartesMutation.tests.ordered){
						const testString0 = testString.split('(')[0];
						let testName = testString0.substring(testString0.lastIndexOf('.')+1, testString.length-1);
						
						for(let line = 0; line < this.activeEditor.document.lineCount; line++){
							if(this.activeEditor.document.lineAt(line).text.match('^.*' + testName + '.*$')){
								this.activeEditor.document.lineAt(line).firstNonWhitespaceCharacterIndex;
								const firstChar = this.activeEditor.document.lineAt(line).firstNonWhitespaceCharacterIndex;
								const lastChar = this.activeEditor.document.lineAt(line).text.length-1;
								const decoration = this.generateTestDecorationByDescartesMutation(descartesMutation,line,firstChar,lastChar);
								decorationOptions.push(decoration);
							}
						}
					}
				}
			}
		}

		
		
		for(const signaledMethod of this.reneriState.methodsObservation.signaledMethods){	
			//  Pour chaque méthode signalée, affiche les informations des reneri et descartes
			const descartesMutation = this.descartesState.descartesReports.mutationReport.mutations.filter(m => 
				m.method.class === signaledMethod.mutation.class 
				&& m.method.package === signaledMethod.mutation.package
				&& m.method.name === signaledMethod.mutation.method);
			const descartesMethod = this.descartesState.descartesReports.methodReport.methods.filter(m => 
				m.class === signaledMethod.mutation.class 
				&& m.package.split('/').join('.') === signaledMethod.mutation.package
				&& m.name === signaledMethod.mutation.method);
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
						const range = new vscode.Range(
							new vscode.Position(l,this.activeEditor.document.lineAt(l).firstNonWhitespaceCharacterIndex),
							new vscode.Position(l,this.activeEditor.document.lineAt(l).text.length)
						)
						const decoration = this.generateMethodDecoration(descartesMethod[0],range);
						decorationOptions.push(decoration);
					}
				}
			}
		}

		for(const method of this.descartesState.descartesReports.methodReport.methods){
			if(method.classification === 'not-covered'
			|| method.classification === 'partially-tested'
			|| method.classification === 'pseudo-tested'){
				const f = await vscode.workspace.findFiles('**/src/**/' + method['file-name']);
				if(f){
					if(this.activeEditor.document.uri.fsPath.toLocaleLowerCase() === f[0].fsPath.toLowerCase()){
						let l = method['line-number'];
						while(!this.activeEditor.document.lineAt(l).text.match('^.*' + method.name + '.*$')){
							l--;
							if(l === method['line-number']-10){
								break;
							}
						}
						const range = new vscode.Range(
							new vscode.Position(l,this.activeEditor.document.lineAt(l).firstNonWhitespaceCharacterIndex),
							new vscode.Position(l,this.activeEditor.document.lineAt(l).text.length)
						);
						const decoration = this.generateMethodDecoration(method,range);
						decorationOptions.push(decoration);
					}
				}
			}
			else if(method.classification === 'partially-tested' || method.classification === 'pseudo-tested'){
				const f = await vscode.workspace.findFiles('**/src/**/' + method['file-name']);
				if(f){
					if(this.activeEditor.document.uri.fsPath.toLocaleLowerCase() === f[0].fsPath.toLowerCase()){
						let l = method['line-number'];
						while(!this.activeEditor.document.lineAt(l).text.match('^.*' + method.name + '.*$')){
							l--;
							if(l === method['line-number']-10){
								break;
							}
						}
						const range = new vscode.Range(
							new vscode.Position(l,this.activeEditor.document.lineAt(l).firstNonWhitespaceCharacterIndex),
							new vscode.Position(l,this.activeEditor.document.lineAt(l).text.length)
						);
						const decoration = this.generateMethodDecoration(method,range);
						decorationOptions.push(decoration);
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

	generateTestDecoration(hint: Hint, signaledMethod: SignaledMethod) : vscode.DecorationOptions {
			const from = new vscode.Position(hint.location.from.line-1, hint.location.from.column-1);
			const to = new vscode.Position(hint.location.to.line-1, hint.location.to.column);
			const range: vscode.Range = new vscode.Range(from , to);
			const hoverMessage = this.generateTestHoverMessage(signaledMethod, hint);
			return { range: range, hoverMessage: hoverMessage };
	}

	generateTestDecorationByDescartesMutation(descartesMutation: DescartesMutationDetail,line:number,firstChar:number,lastChar:number) : vscode.DecorationOptions {
		const from = new vscode.Position(line, firstChar);
		const to = new vscode.Position(line, lastChar);
		const range: vscode.Range = new vscode.Range(from , to);
		const hoverMessage = this.generateTestHoverMessageWithDescartesMutation(descartesMutation);
		return { range: range, hoverMessage: hoverMessage };
}

	generateTestHoverMessage(signaledMethod: SignaledMethod, hint: Hint) : MarkdownString{
		const diff = signaledMethod.diffs.find(d => d.pointcut === hint.pointcut);
		let markDownString: MarkdownString = new MarkdownString();
		let typeComment = '';
		if(signaledMethod.mutation.mutator === 'empty'){
			typeComment = '(Array size)';
		}
		markDownString.appendMarkdown( 
		`<p><span style="color:#00BE83;">Method</span> : ${signaledMethod.mutation.method} </p>
		<p><span style="color:#00BE83;">Original</span> Code :</p>
		<ul>
		<li><span style="color:#00BE83;"> Returned Value </span> : ${diff?.expected[0].literalValue} </li>
		<li><span style="color:#00BE83;"> Type </span>: ${diff?.expected[0].typeName} ${typeComment}</li>
		</ul>
		<p><span style="color:#00BE83;">Undetected</span> Mutation :</p>
		<ul>
		<li><span style="color:#00BE83;"> Returned Value</span> : ${diff?.unexpected[0].literalValue} </li>
		<li><span style="color:#00BE83;"> Type</span> : ${diff?.expected[0].typeName} ${typeComment}</li>
		<li><span style="color:#00BE83;"> Mutator</span> : ${signaledMethod.mutation.mutator} </li>
		</ul>`);
		markDownString.supportHtml = true;
		markDownString.isTrusted = true;
		return markDownString;
	}
	
	generateTestHoverMessageWithDescartesMutation(descartesMutation: DescartesMutationDetail) : MarkdownString {
		let markDownString: MarkdownString = new MarkdownString();
		markDownString.appendMarkdown( 
		`<p><span style="color:#00BE83;">Undetected</span> Mutation :</p>
		<ul>
		<li><span style="color:#00BE83;"> Mutator</span> : ${descartesMutation.mutator} </li>
		<li><span style="color:#00BE83;"> On method</span> : ${descartesMutation.method.class + '.' + descartesMutation.method.name + '()'} </li>
		</ul>`);
		markDownString.supportHtml = true;
		markDownString.isTrusted = true;
		return markDownString;
	}
	
	generateMethodHoverMessage(descartesMethod: DescartesMethod) : MarkdownString{
		let markDownString: MarkdownString = new MarkdownString();
		markDownString.appendMarkdown(`<p><em>This method is ${descartesMethod.classification}</em></p>`);
		for(const mutation of descartesMethod.mutations){

			let description = "";
			if(!mutation.mutator.match('/^null|void|empty|new|argument|optional|this/g')){
				description = Settings.getMutatorDescription("constant") + mutation.mutator;
			}
			else{
				description = Settings.getMutatorDescription(mutation.mutator);
			}

			if(mutation.status === 'SURVIVED'){
				let mutationTestsString: string = "<br>";
				for(const test of mutation.tests){
					mutationTestsString += "<code>" + test.replace(/\(.*\)/,'\(\)') + "</code><br>";
				}
				markDownString.appendMarkdown(
				`<p><span style="color:#00BE83;">Undetected</span> mutation :</p>
				<ul>  
				  <li><span style="color:#00BE83;"> Mutator</span> : ${mutation.mutator} <br><code>${description}</code></li>  
				  <li><span style="color:#00BE83;"> Tests run</span> : ${mutationTestsString}</li>
				</ul>`);
			}
			if(mutation.status === "KILLED"){
				let mutationTestsString: string = "<br>";
				for(const test of mutation['killing-tests']){
					mutationTestsString += "<code>" + test.replace(/\(.*\)/,'\(\)') + "</code><br>";
				}
				markDownString.appendMarkdown(
				`<p><span style="color:#00BE83;">Killed</span> mutation :</p>
				<ul>  
				  <li><span style="color:#00BE83;"> Mutator</span> : ${mutation.mutator}  <br><code>${description}</code></li>
				  <li><span style="color:#00BE83;"> Killing tests</span> : <code>${mutationTestsString}</code>  </li>
				</ul>`);	
			}
			if(mutation.status === "NO_COVERAGE"){
				markDownString.appendMarkdown(
				`<p><span style="color:#00BE83;">Not covered</span> mutation :</p>
				<ul>  
				  <li><span style="color:#00BE83;"> Mutator</span> : ${mutation.mutator}  </li>
				</ul>`);	
			}
		}
		markDownString.supportHtml = true;
		markDownString.isTrusted = true;
		return markDownString;
	}
}



