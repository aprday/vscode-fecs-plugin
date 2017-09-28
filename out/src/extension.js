"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const fecs = require("fecs");
// this method is called when vs code is activated
function activate(context) {
    console.log('fecs is activated');
    vscode_1.languages.registerHoverProvider('javascript', {
        provideHover(document, position, token) {
            console.log(document, position, token);
            return new vscode_1.Hover('[My Cool Feature](command:myTrustedContents)');
        }
    });
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
    let messageMap = {};
    const editor = vscode_1.window.activeTextEditor;
    if (editor) {
        check(editor);
    }
    vscode_1.window.onDidChangeActiveTextEditor(editor => {
        console.log('active');
        if (editor) {
            check(editor);
        }
    }, null, context.subscriptions);
    vscode_1.workspace.onDidSaveTextDocument(event => {
        console.log('save');
        const editor = vscode_1.window.activeTextEditor;
        if (editor) {
            check(editor);
        }
    }, null, context.subscriptions);
    vscode_1.window.onDidChangeTextEditorSelection(event => {
        console.log('select');
        if (!event.textEditor || !event.textEditor.document) {
            return;
        }
        if (event.textEditor === vscode_1.window.activeTextEditor) {
            const editor = event.textEditor;
            const line = editor.selection.start.line;
            updateStatusBar(messageMap[line + 1] ? messageMap[line + 1][0].info : '');
        }
    });
    function updateDecorations(editor, rules) {
        if (!editor) {
            return;
        }
        const { uri } = editor.document;
        messageMap = {};
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
        return messageMap;
    }
    function check(editor) {
        const document = editor.document;
        const array = document.uri.path.split(':');
        const path = array.length - 1 ? array[1] : array[0];
        console.log(path);
        fecs.check(Object.assign({}, fecs.getOptions(), {
            /* eslint-disable */
            _: [path],
            /* eslint-enable */
            reporter: 'baidu'
        }), (success, errors = []) => {
            errors[0] && updateDecorations(editor, errors[0].errors);
        });
    }
    function updateStatusBar(info) {
        if (info) {
            statusBarItem.text = `$(info) ${info}`;
            statusBarItem.show();
        }
        else {
            statusBarItem.hide();
        }
    }
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map