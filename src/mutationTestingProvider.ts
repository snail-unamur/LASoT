import * as vscode from 'vscode';
import { commands } from "vscode";

export class MutationTestingProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    constructor() {}

    getTreeItem(element: Goal): vscode.TreeItem {
      return element;
    }
  
    getChildren(element?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {

      if (element) {
        if(element instanceof Menu){
          return Promise.resolve(getCommandsInMenu(element.label));
        }
      } else {
        const ret: vscode.TreeItem[] = [];
        const descartesMenu : Menu = new Menu("Descartes",vscode.TreeItemCollapsibleState.Collapsed);
        const reneriMenu : Menu = new Menu("Reneri",vscode.TreeItemCollapsibleState.Collapsed);
        ret.push(descartesMenu);
        ret.push(reneriMenu);
  
        return Promise.resolve(ret);
      }

      return Promise.resolve([]);

    }
    
}

export class Goal extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly command?: vscode.Command
  ) {
    super(label, collapsibleState);
    this.tooltip = `${this.label}`;
  }
  
  iconPath = new vscode.ThemeIcon("gear");

  contextValue = 'goal';
}

class Menu extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly commands?: Goal[]
  ) {
    super(label, collapsibleState);
    this.tooltip = `${this.label}`;
  }

  iconPath = new vscode.ThemeIcon("folder");

  contextValue = 'menu';
}


function getCommandsInMenu(label: string | vscode.TreeItemLabel | undefined): vscode.TreeItem[] {
  if(label === "Descartes"){
    const DEFAULT_DESCARTES_COMMANDS: vscode.Command[] = [
      {
        command: "org.pitest:pitest-maven:mutationCoverage",
        title: 'mutationCoverage'
      }
      ];
    return DEFAULT_DESCARTES_COMMANDS.map(command => new Goal(command.title, vscode.TreeItemCollapsibleState.None, command));
  }
  else if(label === "Reneri"){
    const DEFAULT_RENERI_COMMANDS: vscode.Command[] = [
      {
        command: "eu.stamp-project:reneri:observeMethods",
        title: 'observeMethods'
      },
      {
        command: "eu.stamp-project:reneri:observeTests",
        title: 'observeTests'
      },
      {
        command: "eu.stamp-project:reneri:hints",
        title: 'hints'
      }
    ]
    return DEFAULT_RENERI_COMMANDS.map(command => new Goal(command.title, vscode.TreeItemCollapsibleState.None,command));
  }
  else{
    return [];
  }

}




  