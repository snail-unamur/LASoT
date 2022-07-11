import * as vscode from 'vscode';
import { Settings } from './settings';
import { FileExplorer, FileSystemProvider } from './utils/fileExplorer';

export class DescartesState {
    private _reportFolders: [string, vscode.FileType][] | undefined;

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
        const treeDataProvider = new FileSystemProvider();
        let descartesFolder = await treeDataProvider._readDirectory(vscode.Uri.file(path));
        return descartesFolder;
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
}