const vscode = require('vscode');

let jsonAutoQuotesEnabled = false;

function activate(context) {
    context.subscriptions.push(
        vscode.commands.registerCommand('filljson.toggle', toggleAutoQuotes),
        vscode.commands.registerCommand('filljson.nextField', handleNextField)
    );
}

function toggleAutoQuotes() {
    jsonAutoQuotesEnabled = !jsonAutoQuotesEnabled;
    vscode.window.showInformationMessage(`FillJSON Auto-Quotes: ${jsonAutoQuotesEnabled ? 'Enabled' : 'Disabled'}`);
    vscode.commands.executeCommand('setContext', 'jsonAutoQuotesEnabled', jsonAutoQuotesEnabled);
}

async function handleNextField() {
    const editor = getActiveEditor();
    if (!editor || !jsonAutoQuotesEnabled) return;

    const currentLine = getCurrentLine(editor);

    if (isLineEmpty(currentLine)) {
        await insertText(editor, '""');
        moveCursor(editor, -1);
    } else if (!currentLine.includes(":")) {
        await handleMissingColon(editor);
    } else {
        await handleExistingColon(editor);
    }
}

function getActiveEditor() {
    return vscode.window.activeTextEditor;
}

function getCurrentLine(editor) {
    const position = editor.selection.active;
    return editor.document.lineAt(position.line).text.trim();
}

function isLineEmpty(lineText) {
    return lineText === '';
}

async function insertText(editor, text) {
    const position = editor.selection.active;
    await editor.edit(editBuilder => {
        editBuilder.insert(position, text);
    });
}

function moveCursor(editor, offset) {
    const position = editor.selection.active;
    const newPosition = position.with(position.line, position.character + offset);
    editor.selection = new vscode.Selection(newPosition, newPosition);
}

async function handleMissingColon(editor) {
    moveCursorToEndOfLine(editor);
    await insertText(editor, ' : ""');
    moveCursor(editor, -1); // Move cursor inside the quotes
}

async function handleExistingColon(editor) {
    moveCursorToEndOfLine(editor);
    await insertText(editor, ',');
    await vscode.commands.executeCommand('editor.action.insertLineAfter');
    await insertText(editor, '""');
    moveCursor(editor, -1);
}

function moveCursorToEndOfLine(editor) {
    const position = editor.selection.active;
    const line = editor.document.lineAt(position.line);
    const newPosition = position.with(position.line, line.range.end.character);
    editor.selection = new vscode.Selection(newPosition, newPosition);
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};
