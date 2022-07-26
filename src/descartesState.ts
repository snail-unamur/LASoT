import * as vscode from 'vscode';
import { Settings } from './settings';
import { FileExplorer, FileSystemProvider } from './utils/fileExplorer';

export class DescartesState {
    private _reportFolders: [string, vscode.FileType][] | undefined;
    public descartesReports: DescartesReports = new DescartesReports();
    private survivors: DescartesMutationFull[] = [];

    public folderExists():boolean{
        if(this._reportFolders){
            return this._reportFolders?.length > 0;
        }
        else {
            return false;
        }
    }

    private async findFolder(): Promise<[string, vscode.FileType][]>{
        const path = Settings.getRootPath() + `\\target\\pit-reports`;
        const fileSystemProvider = new FileSystemProvider();
        let descartesFolder = await fileSystemProvider._readDirectory(vscode.Uri.file(path));
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
                            let a: vscode.TextDocument = await vscode.workspace.openTextDocument(file.fsPath);//vscode.Uri.file(folderPath + `\\${f[0]}`));
                            this.descartesReports.mutationReport = JSON.parse(a.getText());
                            break;
                        }
                        case 'methods.json': {
                            let a: vscode.TextDocument = await vscode.workspace.openTextDocument(file.fsPath);//vscode.Uri.file(folderPath + `\\${f[0]}`));
                            this.descartesReports.methodReport = JSON.parse(a.getText());
                            break;
                        }
                    }
                }

                this.registerSurvivors();
            }
            
        }
    }
    
    public getSurvivors():DescartesMutationFull[] {
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

    public getMutationScore(): number {
        if(this.descartesReports.mutationReport.mutations.length > 0){
            const score = (this.survivors.length / this.descartesReports.mutationReport.mutations.length) * 100;
            return score;
        }
        return 0;
    }

    public async copyReportFilesToTargetFolder(): Promise<boolean>{
        const lastReportFolder = this.getLastReportFolder();
        let result = false;
        if(lastReportFolder){
            result = await FileSystemProvider.copyFile(`\\target\\pit-reports\\${lastReportFolder[0]}\\mutations.json`, `\\target\\mutations.json`);
            result = await FileSystemProvider.copyFile(`\\target\\pit-reports\\${lastReportFolder[0]}\\methods.json`, `\\target\\methods.json`);
        }
        return result;
    }

}

export class DescartesReports {
    public methodReport: DescartesMethodReport = new DescartesMethodReport();
    public mutationReport: DescartesMutationReport = new DescartesMutationReport();
}

export class DescartesMutationReport {
    public mutations: DescartesMutationFull[] = [];
    public mutators: string[] = [];
}

export class DescartesMutationFull {
    public detected: boolean = false;
    public status: string = '';
    public mutator: string = '';
    public line: number = 0;
    public block: number = 0;
    public file: string = '';
    public index: number = 0;
    public method: Method = new Method();
    public tests: Tests = new Tests();
}

export class Method {
    public name: string = '';
    public description: string = '';
    public class: string= '';
    public package: string = '';
}

export class Tests {
    public run: number = 1;
    public ordered: string[] = [];
    public killing: string[] = [];
    public succeeding: string[] = [];
}

export class DescartesMethodReport {
    public methods: DescartesMethod[] = [];
    public analysis: DescartesAnalysis = new DescartesAnalysis();
}

export class DescartesMethod {
    public name: string = '';
    public description: string = '';
    public class: string = '';
    public package: string = '';
    public ['file-name']: string = '';
    public ['line-number']: number = 0;
    public classification: string = '';
    public detected: string[] = [];
    public ['not-detected']: string[] = [];
    public tests: string[] = [];
    public mutations: DescartesMutation[] = [];
}

export class DescartesAnalysis {
    public time: number = 0;
    public mutators: string[] = [];
}

export class DescartesMutation {
    public status: string = '';
    public mutator: string = '';
    public ['tests-run']: number = 0;
    public tests: string[] = [];
    public ['killing-tests']: string[] = [];
    public ['succeeding_tests']: string[] = [];
}