import * as vscode from 'vscode';
import { MarkdownString } from 'vscode';
import { Hint, ReneriState, Survivor } from '../reneriState';

export class Decorator {

    public active: boolean = false;
	public activeEditor = vscode.window.activeTextEditor;
    reneriState: ReneriState;

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

    constructor(reneriState:ReneriState) {
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

    updateDecorations() {
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
					const decoration = this.generateDecoration(hint,survivor);
					decorationOptions.push(decoration);
				}
			}
		}
		
		for(const survivor of this.reneriState.methodsObservation.survivors){	
			for(const hint of survivor.hints){
				if(this.activeEditor.document.uri.fsPath.toLocaleLowerCase() === hint.location.file.toLowerCase()){
					const decoration = this.generateDecoration(hint,survivor);
					decorationOptions.push(decoration);
				}
			}
		}
		
		this.activeEditor.setDecorations(this.reneriHintDecorationType, decorationOptions);
    }

	
	generateDecoration(hint: Hint, survivor: Survivor) : vscode.DecorationOptions {
			const from = new vscode.Position(hint.location.from.line-1, hint.location.from.column-1);
			const to = new vscode.Position(hint.location.to.line-1, hint.location.to.column);
			const range: vscode.Range = new vscode.Range(from , to);
			const hoverMessage = this.generateHoverMessage(survivor, hint);
			return { range: range, hoverMessage: hoverMessage };
	}


	generateHoverMessage(survivor: Survivor, hint: Hint) : MarkdownString{
		const diff = survivor.diffs.find(d => d.pointcut === hint.pointcut);
		let markDownString: MarkdownString = new MarkdownString();
		markDownString.value = `
		Original Code
		~ Value : ${diff?.expected[0].literalValue}
		~ Type : ${diff?.expected[0].typeName}
	
		Undetected Mutation
		~ Value : ${diff?.unexpected[0].literalValue}
		~ Type : ${diff?.unexpected[0].typeName}
		`;
		return markDownString;
	}
}



