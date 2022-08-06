import { readFileSync } from 'fs';
import * as vscode from 'vscode';
import { Observation, ObservationType, SignaledMethod } from './models/reneriModels';
import { Settings } from './settings';
import { FileSystemProvider } from './utils/fileExplorer';

export class ReneriState {
    private _reportFolders: [string, vscode.FileType][] | undefined;
    public methodsObservation: Observation;
    public testsObservation: Observation;
    private fileSystemProvider: FileSystemProvider;

    constructor(){
        this.methodsObservation = new Observation(ObservationType.methods);
        this.testsObservation = new Observation(ObservationType.tests);
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
        this.methodsObservation = new Observation(ObservationType.methods);
        this.testsObservation = new Observation(ObservationType.tests);

        return this.findFolder().then(async files => {
            if(files.length > 0){
                this._reportFolders = files;
                await this.readReneri();
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

    public async readReneri() {

        if(this.folderExists()){

            const testsPath = Settings.getRootPath() + `\\target\\reneri\\observations\\tests`;
            const testsFiles = await this.fileSystemProvider._readDirectory(vscode.Uri.file(testsPath));
            
            let r = await this.readFiles(testsFiles, ObservationType.tests, testsPath);
            
            const methodsPath = Settings.getRootPath() + `\\target\\reneri\\observations\\methods`;
            const methodsFiles = await this.fileSystemProvider._readDirectory(vscode.Uri.file(methodsPath));
            
            r = await this.readFiles(methodsFiles, ObservationType.methods, methodsPath);
        }
        
    }
    
    async readFiles(files: [string, vscode.FileType][], observationType:ObservationType, path:string) {

        for(const file of files){
            if(file[1] === vscode.FileType.Directory){
                let survivor: SignaledMethod = new SignaledMethod();
                //const folderPath = path + '\\' + file[0];
                const globPattern = `**/target/reneri/observations/${ObservationType[observationType]}/${file[0]}/**/*.json`;
                const survivorFiles = await vscode.workspace.findFiles(globPattern);
                //const srvFiles = await vscode.workspace.findFiles('**/*.json',path2);
                //const survivorFiles = await this.fileSystemProvider._readDirectory(vscode.Uri.file(folderPath));

                for(const f of survivorFiles){
                    switch(f.path.split('/').pop()){
                        case 'hints.json': {
                            let a: vscode.TextDocument = await vscode.workspace.openTextDocument(f.fsPath);//vscode.Uri.file(folderPath + `\\${f[0]}`));
                            survivor.hints = JSON.parse(a.getText());
                            break;
                        }
                        case 'diff.json': {
                            let a: vscode.TextDocument = await vscode.workspace.openTextDocument(f.fsPath);//vscode.Uri.file(folderPath + `\\${f[0]}`));
                            survivor.diffs = JSON.parse(a.getText());
                            break;
                        }
                        case 'mutation.json': {
                            let a: vscode.TextDocument = await vscode.workspace.openTextDocument(f.fsPath);//vscode.Uri.file(folderPath + `\\${f[0]}`));
                            survivor.mutation = JSON.parse(a.getText());
                            break;
                        }
                    }
                }

                switch(observationType){
                    case ObservationType.methods: {
                        this.methodsObservation.signaledMethods.push(survivor);
                        break;
                    }
                    case ObservationType.tests: {
                        this.testsObservation.signaledMethods.push(survivor);
                    }
                }
            }  
        }   
    }
}

