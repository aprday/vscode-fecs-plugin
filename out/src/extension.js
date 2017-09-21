"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const fecs = require("fecs");
// this method is called when vs code is activated
function activate(context) {
    console.log('decorator sample is activated');
    // create a decorator type that we use to decorate large numbers
    const warningDecorationType = vscode_1.window.createTextEditorDecorationType({
        backgroundColor: new vscode_1.ThemeColor('editorWarning.foreground'),
        gutterIconPath: context.asAbsolutePath('src/assets/warning-gutter.svg'),
        gutterIconSize: 'contain',
        overviewRulerColor: '#ddb700',
    });
    // create a decorator type that we use to decorate small numbers
    const errorDecorationType = vscode_1.window.createTextEditorDecorationType({
        backgroundColor: new vscode_1.ThemeColor('editorError.foreground'),
        // isWholeLine: true,
        gutterIconPath: context.asAbsolutePath('src/assets/error-gutter.svg'),
        gutterIconSize: 'contain',
        overviewRulerColor: '#f00'
    });
    const diagnosticCollection = vscode_1.languages.createDiagnosticCollection('fecs');
    // create a new word counter
    const statusBarItem = vscode_1.window.createStatusBarItem(vscode_1.StatusBarAlignment.Left);
    let map = {};
    vscode_1.window.onDidChangeActiveTextEditor(editor => {
        if (editor) {
            check(editor.document);
            ;
        }
    }, null, context.subscriptions);
    vscode_1.workspace.onDidSaveTextDocument(event => {
        const editor = vscode_1.window.activeTextEditor;
        if (editor) {
            check(editor);
            ;
        }
    }, null, context.subscriptions);
    vscode_1.window.onDidChangeTextEditorSelection(event => {
        if (!event.textEditor || !event.textEditor.document) {
            return;
        }
        if (event.textEditor === vscode_1.window.activeTextEditor) {
            const editor = event.textEditor;
            const selection = editor.selection;
            const line = editor.selection.start.line;
            const end = editor.selection.end;
            updateStatusBar(map[line + 1][0].info);
        }
    });
    function updateDecorations(editor, rules) {
        if (!editor) {
            return;
        }
        const { uri } = editor.document;
        let messageMap = {};
        const warnings = [];
        const errors = [];
        const diagnostics = [];
        rules.forEach((item, index) => {
            let { line, column, severity, message } = item;
            messageMap[line] = (messageMap[line] ? messageMap[line] : []).concat([item]);
            const start = new vscode_1.Position(line - 1, column - 1);
            const end = new vscode_1.Position(line - 1, column - 1);
            const range = new vscode_1.Range(start, end);
            severity = severity === 1 ? 1 : 0;
            diagnostics.push(new vscode_1.Diagnostic(range, message, severity));
            const messages = messageMap[line].map(item => item.message);
            const decoration = { range, hoverMessage: messages, renderOptions: {
                    after: {}
                } };
            if (severity) {
                warnings.push(decoration);
            }
            else {
                errors.push(decoration);
            }
        });
        diagnosticCollection.set(uri, diagnostics);
        editor.setDecorations(warningDecorationType, warnings);
        editor.setDecorations(errorDecorationType, errors);
        map = messageMap;
        return messageMap;
    }
    function check(editor) {
        const document = editor.document;
        fecs.check(Object.assign({}, fecs.getOptions(), {
            /* eslint-disable */
            _: [document && document.uri.path],
            /* eslint-enable */
            reporter: 'baidu'
        }), (success, data = []) => {
            data[0] && updateDecorations(editor, data[0].errors);
        });
    }
    function updateStatusBar(info) {
        if (info) {
            statusBarItem.text = `$(info) ${info} Words` || 'world';
            statusBarItem.show();
        }
        else {
            statusBarItem.hide();
        }
    }
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map