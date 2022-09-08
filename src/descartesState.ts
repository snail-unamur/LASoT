import * as vscode from 'vscode';
import { DescartesMutationDetail, DescartesReports } from './models/descartesModels';
import { Settings } from './settings';
import { FileExplorer, FileSystemProvider } from './utils/fileExplorer';
import path = require('path');

export class DescartesState {
    private _reportFolders: [string, vscode.FileType][] | undefined;
    public descartesReports: DescartesReports = new DescartesReports();
    private survivors: DescartesMutationDetail[] = [];
    private oldMutationScore: number = 0.00;
    private mutationScore: number = 0.00;

    public folderExists():boolean{
        if(this._reportFolders){
            return this._reportFolders?.length > 0;
        }
        else {
            return false;
        }
    }

    private async findFolder(): Promise<[string, vscode.FileType][]>{
        const descartesFolderPath = Settings.getRootPath() + `${path.sep}target${path.sep}pit-reports`;
        const fileSystemProvider = new FileSystemProvider();
        let descartesFolder = await fileSystemProvider._readDirectory(vscode.Uri.file(descartesFolderPath));
        return descartesFolder;
    }

    public async initialize(): Promise<void>{
        return this.findFolder().then(async files => {
            if(files.length >= 0){
                this._reportFolders = files;
                await this.readDescartes();
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

    public async readDescartes(){
        this.descartesReports = new DescartesReports();
        this.survivors = [];

        if(this.folderExists()){
            const lastReportFolder = this.getLastReportFolder();
            if(lastReportFolder){
                const globPattern = `**/target/pit-reports/${lastReportFolder[0]}/*.json`;
                const descartesFiles = await vscode.workspace.findFiles(globPattern);
                for(const file of descartesFiles){
                    switch(file.path.split('/').pop()){
                        case 'mutations.json': {
                            let a: vscode.TextDocument = await vscode.workspace.openTextDocument(file.fsPath);//vscode.Uri.file(folderPath + `${path.sep}${f[0]}`));
                            this.descartesReports.mutationReport = JSON.parse(a.getText());
                            break;
                        }
                        case 'methods.json': {
                            let a: vscode.TextDocument = await vscode.workspace.openTextDocument(file.fsPath);//vscode.Uri.file(folderPath + `${path.sep}${f[0]}`));
                            this.descartesReports.methodReport = JSON.parse(a.getText());
                            break;
                        }
                    }
                }

                this.registerSurvivors();

                this.oldMutationScore = this.mutationScore;
                this.mutationScore = this.caculateMutationScore();
            }
            
        }
    }
    
    public getSurvivors():DescartesMutationDetail[] {
        return this.survivors;
    }

    private registerSurvivors() {
        this.survivors = [];
        for(const mutation of this.descartesReports.mutationReport.mutations){
            if(mutation.status === 'SURVIVED'){
                this.survivors.push(mutation);
            }
        }
    }

    public caculateMutationScore(): number {
        if(this.descartesReports.mutationReport.mutations.length > 0){
            const score = (this.survivors.length / this.descartesReports.mutationReport.mutations.length) * 100;
            return score;
        }
        return 0;
    }

    public getOldMutationScore(): number {
        return this.oldMutationScore;
    }
    
    public getMutationScore(): number {
        return this.mutationScore;
    }

    public async copyReportFilesToTargetFolder(): Promise<boolean>{
        const lastReportFolder = this.getLastReportFolder();
        let result = false;
        if(lastReportFolder){
            result = await FileSystemProvider.copyFile(`${path.sep}target${path.sep}pit-reports${path.sep}${lastReportFolder[0]}${path.sep}mutations.json`, `${path.sep}target${path.sep}mutations.json`);
            result = await FileSystemProvider.copyFile(`${path.sep}target${path.sep}pit-reports${path.sep}${lastReportFolder[0]}${path.sep}methods.json`, `${path.sep}target${path.sep}methods.json`);
        }
        return result;
    }

}

