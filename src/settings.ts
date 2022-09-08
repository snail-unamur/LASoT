
import path = require('path');
import * as vscode from 'vscode';
import { FileExplorer } from './utils/fileExplorer';

export namespace Settings {

    export const DESCARTES_MUTATION_COVERAGE : string = 'org.pitest:pitest-maven:mutationCoverage';
    export const RENERI_OBSERVE_METHODS : string = 'eu.stamp-project:reneri:observeMethods';
    export const RENERI_OBSERVE_TESTS : string = 'eu.stamp-project:reneri:observeTests';
    export const RENERI_HINTS : string = 'eu.stamp-project:reneri:hints';
    export const DESCARTES_OPERATORS: MutationOperator[] = [
        {name:'void',description:'This operator accepts a void method and removes all the instructions on its body.'},
        {name:'null',description:'This operator accepts a method with a reference return type and replaces all instructions with return null.'},
        {name:'empty',description:'This is a special operator which targets methods that return arrays. It replaces the entire body with a return statement that produces an empty array of the corresponding type.'},
        {name:'constant',description:'This operator accepts any method with primitive or String return type. It replaces the method body with a single instruction returning a defined constant.'},
        {name:'new',description:'This operator accepts any method whose return type has a constructor with no parameters and belongs to a java package. It replaces the code of the method by a single instruction returning a new instance.'},
        {name:'optional',description:'This operator accepts any method whose return type is java.util.Optional. It replaces the code of the method by a single instruction returning an empty instance.'},
        {name:'argument',description:'This operator replaces the body of a method by returning the value of the first parameter that has the same type as the return type of the method.'},
        {name:'this',description:'Replaces the body of a method by return this; if applicable. The goal of this operator is to perform better transformations targeting fluent APIs.'},
    ];
    export const DESCARTES_MUTATORS = {
    };

    export function getMutatorDescription(mutator:string){
        switch(mutator){
            case 'void': {return "Removed all instructions in the method.";}
            case 'null': {return "All method instructions replaced by: return null.";}
            case 'empty': {return "All method instructions replaced by: return empty array of the corresponding type.";}
            case 'constant': {return "All method instructions replaced by: return ";}
            case 'new': {return "All method instructions replaced by: single instruction returning a new instance.";}
            case 'optional': {return "All method instructions replaced by: single instruction returning an empty instance.";}
            case 'argument': {return "All method instructions replaced by: return value of the first parameter that has the same type as the return type of the method.";}
            case 'this': {return "All method instructions replaced by: return this.";}
            default: {return "";}
        }
    }

    export function getRootPath() : string | undefined {        
        const rootPath = 
        vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0? 
        vscode.workspace.workspaceFolders[0].uri.fsPath
        : undefined;

        return rootPath;
    }

    export function getPomPath() : string | undefined {
    	return path.join(getRootPath() as string, `${path.sep}pom.xml`);
    }

    export function getMavenExecutablePath() : string | undefined {        
        const mavenConfig = vscode.workspace.getConfiguration('maven');
        return mavenConfig.get('executable.path'); 
    }

    export async function getMavenWrapper() : Promise<string | undefined> { 
        const files = await vscode.workspace.findFiles('mvnw.cmd'); 
        if(files.length > 0){
            return './mvnw.cmd';
        }
        return undefined;
    }

    export class MutationOperator {
        public name: string = '';
        public description: string = '';
    }

}