import * as assert from 'assert';
import { after } from 'mocha';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import { LASoTExplorerProvider, Menu } from '../../explorer/lasotExplorerProvider';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');
    after(() => {
      vscode.window.showInformationMessage('All tests done!');
    });

	test("Java Extension should be present", () => {
        assert.ok(vscode.extensions.getExtension("vscjava.vscode-java-pack"));
    });

    test("Java should be activated", async function() {
        await vscode.extensions.getExtension("vscjava.vscode-java-pack")!.activate();
        assert.ok(true);
	});

	test("Maven Extension should be present", () => {
        assert.ok(vscode.extensions.getExtension("vscjava.vscode-maven"));
    });

    test("Maven should be activated", async function() {
        await vscode.extensions.getExtension("vscjava.vscode-maven")!.activate();
        assert.ok(true);
    });

    
    test("Can list LASoT Explorer Menus", async () => {
        const lasotExplorerProvider = new LASoTExplorerProvider();
        const roots = await lasotExplorerProvider.getChildren();
        assert.equal(roots?.length, 3, "Number of root node should be 3");

        let menuNode = roots![0] as Menu;
        assert.equal(menuNode.label, "PITest Descartes", "First menu label should be \"PITest Descartes\"");
        menuNode = roots![1] as Menu;
        assert.equal(menuNode.label, "Reneri", "Second menu label should be \"Reneri\"");
        menuNode = roots![2] as Menu;
        assert.equal(menuNode.label, "LASoT", "Third menu label should be \"LASoT\"");
    });

});
