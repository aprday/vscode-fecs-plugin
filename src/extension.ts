
import {window, workspace, languages, ExtensionContext, DecorationOptions, ThemeColor, Position, Range, Diagnostic, StatusBarItem, StatusBarAlignment} from 'vscode';
import * as fecs from 'fecs';

const Readable = require('stream').Readable;
const File = require('vinyl');

// this method is called when vs code is activated
export function activate(context: ExtensionContext) {

	console.log('fecs is activated');
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
			check(editor.document);
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

	function getStream(doc) {
		const {fileName} = doc;
		const text = doc.getText();
		let type = fileName.split('.').pop();
	
		let buffer = new Buffer(text);
		let file = new File({
			contents: buffer,
			path: fileName || 'current-file.' + type,
			stat: {
				size: buffer.length
			}
		});
		let stream = new Readable();
		stream._read = function () {
			this.emit('data', file);
			this.push(null);
		};
		return stream;
	}

	function check(editor) {
		const document = editor.document;
		const stream = getStream(document);
	
        fecs.check({
            lookup: true,
            stream: stream,
			reporter: 'baidu',
			level: 0,
        }, (success, data = []) => {
			data[0] && updateDecorations(editor, data[0].errors);
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
