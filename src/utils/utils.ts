import * as vscode from 'vscode';
import { Settings } from "../settings";

export class Utils {
	constructor(){};

    static runGoal(goal:string){
        /*if(vscode.window.activeTerminal !== undefined){
            vscode.window.activeTerminal.show();
            vscode.window.activeTerminal.sendText(`& "${Settings.getMavenExecutablePath()}" ${goal} -f "${Settings.getPomPath()}"`);
        }
        else{*/
            const terminal = vscode.window.createTerminal(`Ext Terminal #${2}`);
            let maven = Settings.getMavenExecutablePath();
            let pom = Settings.getPomPath();
            terminal.show();
            terminal.sendText(`& "${maven}" ${goal} -f "${pom}"`);
        //}
    }
}