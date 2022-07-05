import * as vscode from 'vscode';

export class ReneriSerialized {
    public survivors: Survivor[] = [];

    async ReadReneri(){
        this.survivors = [];
        const hintsFiles = await vscode.workspace.findFiles('**/hints.json');
        if(hintsFiles.length > 0){
            for(const hintFile of hintsFiles){
                let survivor: Survivor = new Survivor();
                let a: vscode.TextDocument = await vscode.workspace.openTextDocument(vscode.Uri.file(hintFile.fsPath));
                survivor.hints = JSON.parse(a.getText());
                this.survivors.push(survivor); 
            }
        }
        else{

        }
    }
}

class Survivor {
    public hints: Hint[] = [];
}

interface Hint {
	pointCut: string;
	hintType: string;
	location: Location;
}

interface Location {
	point: string;
	type: string;
	from: ReneriPosition;
	to: ReneriPosition;
	file: string;
}

interface ReneriPosition {
    line: number;
    column: number;
}
