
import {window, workspace, languages, Hover, ExtensionContext, DecorationOptions, ThemeColor, Position, Range, Diagnostic, StatusBarItem, StatusBarAlignment, MarkdownString} from 'vscode';
import * as fecs from 'fecs';

// this method is called when vs code is activated
export function activate(context: ExtensionContext) {

	console.log('fecs is activated');

	languages.registerHoverProvider('javascript', {
		provideHover(document, position, token) {
			console.log(document, position, token);
			return new Hover('[My Cool Feature](command:myTrustedContents)');
		}
	});

	// create a decorator type that we use to decorate large numbers
	const warningDecorationType = window.createTextEditorDecorationType({
		backgroundColor: new ThemeColor('editorWarning.foreground'),
		gutterIconPath: context.asAbsolutePath('src/assets/warning-gutter.svg'),
        gutterIconSize: 'contain',
        overviewRulerColor: '#ddb700',
        // isWholeLine: true
	});

	// create a decorator type that we use to decorate small numbers
	const errorDecorationType = window.createTextEditorDecorationType({
        backgroundColor: new ThemeColor('editorError.foreground'),
		// isWholeLine: true,
		gutterIconPath: context.asAbsolutePath('src/assets/error-gutter.svg'),
        gutterIconSize: 'contain',
        overviewRulerColor: '#f00'
	});

    const diagnosticCollection = languages.createDiagnosticCollection('fecs');
    
    // create a new word counter
    const statusBarItem: StatusBarItem = window.createStatusBarItem(StatusBarAlignment.Left);

	let messageMap = {};

	const editor = window.activeTextEditor;
	if (editor) {
		check(editor);
	}

	window.onDidChangeActiveTextEditor(editor => {
		console.log('active');
		if (editor) {
			check(editor);
		}
	}, null, context.subscriptions);

	workspace.onDidSaveTextDocument(event => {
		console.log('save');
		const editor = window.activeTextEditor;
		if (editor) {
			check(editor);
		}
    }, null, context.subscriptions);
    
    window.onDidChangeTextEditorSelection(event => {
		console.log('select');
        if (!event.textEditor || !event.textEditor.document ) {
            return;
        }
        if (event.textEditor === window.activeTextEditor) {
            const editor = event.textEditor;
			const line = editor.selection.start.line;
            updateStatusBar(messageMap[line + 1] ? messageMap[line + 1][0].info : '');
        }
    });

	function updateDecorations(editor, rules) {
		if (!editor) {
			return;
		}
		const {uri} = editor.document;
		messageMap = {};
		const warnings: DecorationOptions[] = [];
		const errors: DecorationOptions[] = [];
		const diagnostics: Diagnostic[] = [];
		rules.forEach((item, index) => {
			let {line, column, severity, message} = item;
			messageMap[line] = (messageMap[line] ? messageMap[line] : []).concat([item]);

			const start = new Position(line - 1, column - 1);
			const end = new Position(line - 1, column - 1);
			const range = new Range(start, end);
			severity = severity === 1 ? 1 : 0;
			diagnostics.push(new Diagnostic(range, message, severity));

			const messages = messageMap[line].map(item => item.message);
			const decoration = { range, hoverMessage: messages, renderOptions: {
				after: {}
			}};
			if (severity) {
				warnings.push(decoration);
			} else {
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
        } else {
            statusBarItem.hide();
        }
    }
}
