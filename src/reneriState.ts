import { readFileSync } from 'fs';
import * as vscode from 'vscode';
import { Settings } from './settings';
import { FileSystemProvider } from './utils/fileExplorer';

export class ReneriState {
    private _reportFolders: [string, vscode.FileType][] | undefined;
    public methodsObservation: Observation;
    public testsObservation: Observation;
    private fileSystemProvider: FileSystemProvider;

    constructor(){
        this.methodsObservation = new Observation(ObservationType.method);
        this.testsObservation = new Observation(ObservationType.test);
        this.fileSystemProvider = new FileSystemProvider();
    }

    public folderExists():boolean{
        if(this._reportFolders){
            return this._reportFolders?.length > 0;
        }
        else {
            return false;
        }
    }

    private async findFolder(): Promise<[string, vscode.FileType][]>{
        const path = Settings.getRootPath() + `\\target\\reneri`;
        const fileSystemProvider = new FileSystemProvider();
        return fileSystemProvider._readDirectory(vscode.Uri.file(path));
    }

    public async initialize(): Promise<void>{
        return this.findFolder().then(files => {
            if(files.length > 0){
                this._reportFolders = files;
            }
        });
    }

    public getLastReportFolder(){
        if(this._reportFolders)
        {
            return this._reportFolders.at(this._reportFolders.length-1);
        }
    }

    public getLastReportDate(): Date{
        let date = new Date();
        let lastReportFolder = this.getLastReportFolder();
        if(lastReportFolder){
            const year = lastReportFolder[0].substring(0,4);
            const month = lastReportFolder[0].substring(4,6);
            const day = lastReportFolder[0].substring(6,8);
            const hr = lastReportFolder[0].substring(8,10);
            const min = lastReportFolder[0].substring(10,12);
            date = new Date(year + '-' + month + '-' + day + 'T' + hr + ':' + min + ':' + '59');
        }
        return date;
    }

    public async readReneri(){

        if(this.folderExists()){

            const testsPath = Settings.getRootPath() + `\\target\\reneri\\observations\\tests`;
            const testsFiles = await this.fileSystemProvider._readDirectory(vscode.Uri.file(testsPath));
            
            let r = await this.readFiles(testsFiles, ObservationType.test, testsPath);
            
            const methodsPath = Settings.getRootPath() + `\\target\\reneri\\observations\\methods`;
            const methodsFiles = await this.fileSystemProvider._readDirectory(vscode.Uri.file(methodsPath));
            
            r = await this.readFiles(methodsFiles, ObservationType.method, methodsPath);
        }
        
    }

    getNumberOfSurvivors(){
        return this.testsObservation.survivors.length;
    }
    
    async readFiles(files: [string, vscode.FileType][], observationType:ObservationType, path:string) {

        for(const file of files){
            if(file[1] == vscode.FileType.Directory){
                let survivor: Survivor = new Survivor();
                const folderPath = path + '\\' + file[0];
                const survivorFiles = await this.fileSystemProvider._readDirectory(vscode.Uri.file(folderPath));

                for(const f of survivorFiles){
                    switch(f[0]){
                        case 'hints.json': {
                            let a: vscode.TextDocument = await vscode.workspace.openTextDocument(vscode.Uri.file(folderPath + `\\${f[0]}`));
                            survivor.hints = JSON.parse(a.getText());
                            break;
                        }
                        case 'diff.json': {
                            let a: vscode.TextDocument = await vscode.workspace.openTextDocument(vscode.Uri.file(folderPath + `\\${f[0]}`));
                            survivor.diffs = JSON.parse(a.getText());
                            break;
                        }
                        case 'mutation.json': {
                            let a: vscode.TextDocument = await vscode.workspace.openTextDocument(vscode.Uri.file(folderPath + `\\${f[0]}`));
                            survivor.mutation = JSON.parse(a.getText());
                            break;
                        }
                    }
                }

                switch(observationType){
                    case ObservationType.method: {
                        this.methodsObservation.survivors.push(survivor);
                        break;
                    }
                    case ObservationType.test: {
                        this.testsObservation.survivors.push(survivor);
                    }
                }
            }  
        }   
    }
}

enum ObservationType {
    method,
    test
}

export class Observation {
    private type: ObservationType;
    public survivors: Survivor[] = [];

    constructor(observationType: ObservationType){
        this.type = observationType;
    }
}

export class Survivor {
    public diffs: Diff[] = [];
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

export class Hint {
	pointcut: string = '';
	hintType: string = '';
	location: Location = new Location();
}

export class Location {
	point: string = '';
	type: string = '';
	from: ReneriPosition = new ReneriPosition();
	to: ReneriPosition = new ReneriPosition();
	file: string = '';
}

export class ReneriPosition {
    line: number = 0;
    column: number = 0;
}

export class Diff {
    pointcut: string = '';
    expected: ReturnedValue[] = [];
    unexpected: ReturnedValue[] = [];
} 

export class ReturnedValue {
    literalValue: string = '';
    typeName: string = '';
}

