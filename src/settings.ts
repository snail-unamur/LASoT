
import path = require('path');
import * as vscode from 'vscode';

export namespace Settings {

    export const DESCARTES_MUTATION_COVERAGE : string = 'org.pitest:pitest-maven:mutationCoverage';
    export const RENERI_OBSERVE_METHODS : string = 'eu.stamp-project:reneri:observeMethods';
    export const RENERI_OBSERVE_TESTS : string = 'eu.stamp-project:reneri:observeTests';
    export const RENERI_HINTS : string = 'org.pitest:pitest-maven:hints';

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