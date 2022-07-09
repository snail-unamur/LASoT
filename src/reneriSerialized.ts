import * as vscode from 'vscode';

export class ReneriSerialized {
    public survivors: Survivor[] = [];

    async readReneri(){
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

        const mutationFiles = await vscode.workspace.findFiles('**/mutation.json','**/target/reneri/tests/**');
        if(mutationFiles.length > 0){
            for(let i:number = 0; i < mutationFiles.length;i++){
                if(mutationFiles[i].fsPath.match('tests')){
                    let mutation: Mutation[] = [];
                    let a: vscode.TextDocument = await vscode.workspace.openTextDocument(vscode.Uri.file(mutationFiles[i].fsPath));
                    this.survivors[i].mutation = JSON.parse(a.getText()); 
                }
            }
        }
        else{

        }
    }

    getNumberOfSurvivors(){
        return this.survivors.length;
    }
}

class Survivor {
    public hints: Hint[] = [];
    public mutation: Mutation = new Mutation();
}

class Mutation {
    mutator: string = '';
    class: string = '';
    package: string = '';
    method: string = '';
    description: string = '';
    tests: string[] = [];
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
