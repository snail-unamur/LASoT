
import path = require('path');
import * as vscode from 'vscode';

export namespace Settings {

    export function getRootPath() : string | undefined {        
        const rootPath = 
        vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0? 
        vscode.workspace.workspaceFolders[0].uri.fsPath
        : undefined;

        return rootPath;
    }

    export function getPomPath() : string | undefined {
    	return path.join(getRootPath() as string,'\\pom.xml');
    }

    export function getMavenExecutablePath() : string | undefined {        
        const mavenConfig = vscode.workspace.getConfiguration('maven');
        return mavenConfig.get('executable.path');    
    }
}