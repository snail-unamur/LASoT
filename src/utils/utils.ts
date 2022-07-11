
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { Settings } from "../settings";

export class Utils {
	constructor(){};

	static delay(ms: number) {
		return new Promise( resolve => setTimeout(resolve, ms) );
	}
	
}

