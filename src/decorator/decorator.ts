import * as vscode from 'vscode';
import { ReneriSerialized } from '../reneriSerialized';

export class Decorator {

    public active: boolean = false;
	public activeEditor = vscode.window.activeTextEditor;
    reneriSerialized: ReneriSerialized;
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

    constructor(reneriSerialized:ReneriSerialized) {
        this.reneriSerialized = reneriSerialized;
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
        
        const reneriHints: vscode.DecorationOptions[] = [];
        
		for(const survivor of this.reneriSerialized.survivors){
			for(const hint of survivor.hints){
				if(this.activeEditor.document.uri.fsPath.toLocaleLowerCase() === hint.location.file.toLowerCase()){
					const from = new vscode.Position(hint.location.from.line-1, hint.location.from.column-1);
					const to = new vscode.Position(hint.location.to.line-1, hint.location.to.column);
					const range: vscode.Range = new vscode.Range(from , to);
					const decoration = { range: range, hoverMessage: hint.location.point };
					reneriHints.push(decoration);
				}
			}
		}
		
		this.activeEditor.setDecorations(this.reneriHintDecorationType, reneriHints);
    }



    
}

