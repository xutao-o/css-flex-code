import * as vscode from 'vscode';
import { join } from 'path';
import * as flexboxPatterns from './flexboxPatterns';

const supportedFiles = ['css', 'less', 'sass', 'scss', 'vue', 'html', 'styl', 'stylus'];
let decorationType: vscode.TextEditorDecorationType;

export function activate(context: vscode.ExtensionContext) {
    decorationType = vscode.window.createTextEditorDecorationType({
        after: {
            margin: '0 0 0 0.25rem',
            width: '0.9rem',
        },
        dark: {
            after: {
                contentIconPath: context.asAbsolutePath(
                    '/images/flex_light.svg'
                )
            },
        },
        light: {
            after: {
                contentIconPath: context.asAbsolutePath(
                    '/images/flex_dark.svg'
                ),
            },
        },
    });

    const activeEditor = vscode.window.activeTextEditor;

    if (activeEditor) {
        decorate(activeEditor);
    }


    // 事件
    const disposableCommand = vscode.commands.registerCommand(
        'flexcode.generating', 
         (uri) => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                return;
            }
            const line = editor.document.lineAt(uri.posLine);
            // 根据缩进设置处理缩进格式
            let indentation = '';
            const tabSize = editor.options.tabSize || 4;
            const insertSpaces = editor.options.insertSpaces;
            const indentationLength = line.firstNonWhitespaceCharacterIndex;
            if (insertSpaces) {
                indentation = ' '.repeat(indentationLength);
            } else {
                const tabsCount = Math.floor(indentationLength / Number(tabSize));
                const spacesCount = indentationLength % Number(tabSize);
                indentation = '\t'.repeat(tabsCount) + ' '.repeat(spacesCount);
            }
            let upText = false
            // 遍历每个字符
            for (let i = uri.posLine - 1; i >= 0; i--) {
                const line = editor.document.lineAt(i);
                if(line.text.includes("{")){
                    break
                }
                if(line.text.includes(uri.attr + ":")){
                    upText = true
                    editor.edit(editBuilder => {
                        editBuilder.replace(line.range , indentation + `${uri.attr}: ${uri.code};`);
                    });
                    break
                }
            }
            for (let i = uri.posLine + 1; i < editor.document.lineCount; i++) {
                const line = editor.document.lineAt(i);
                if(line.text.includes("{") || line.text.includes("}")){
                    break
                }
                if(line.text.includes(uri.attr + ":")){
                    upText = true
                    editor.edit(editBuilder => {
                        editBuilder.replace(line.range , indentation + `${uri.attr}: ${uri.code};`);
                    });
                    break
                }
            }
            if(!upText){
                // 插入布局样式
                editor.edit(editBuilder => {
                    const insertPosition = new vscode.Position(line.lineNumber, line.range.end.character);
                    editBuilder.insert(insertPosition, '\n'+ indentation + `${uri.attr}: ${uri.code};`);
                });
            }
        }
    );

    const disposableVisibleTextEditors = vscode.window.onDidChangeVisibleTextEditors((event) => {
        let editor = vscode.window.activeTextEditor;

        if (editor && supportedFiles.includes(editor.document.languageId)) {
            decorate(editor);
        }
    });

    const disposableChangeDocument = vscode.workspace.onDidChangeTextDocument(
        (event) => {
            const openEditor = vscode.window.visibleTextEditors.filter(
                (editor) => editor.document.uri === event.document.uri
            )[0];

            if (
                openEditor &&
                supportedFiles.includes(openEditor.document.languageId)
            ) {
                decorate(openEditor);
            }
        }
    );
    
    // 悬浮信息
    const hoverProvider: vscode.HoverProvider = {
        provideHover(doc, pos, token): vscode.ProviderResult<vscode.Hover> {
            const range = getPropertyRangeAtPosition(doc, pos);
            if (range === undefined) {
                return;
            }
            const markdownString = buildMarkdownString(context, pos.line);
            return new vscode.Hover(markdownString, range);
        },
    };

    const disposableHoverProvider = vscode.languages.registerHoverProvider(
        supportedFiles,
        hoverProvider
    );

    context.subscriptions.push(
        disposableCommand,
        disposableHoverProvider,
        disposableChangeDocument,
        disposableVisibleTextEditors,
    );
}


// 追加图标
function decorate(editor: vscode.TextEditor) {
    const sourceCode = editor.document.getText();

    let decorationsArray: vscode.DecorationOptions[] = [];

    const sourceCodeArr = sourceCode.split('\n');


    function matchAll(pattern: RegExp, text: string): Array<RegExpMatchArray> {
        const out: RegExpMatchArray[] = [];
        let match: RegExpMatchArray | null;
    
        pattern.lastIndex = 0;
    
        while ((match = pattern.exec(text))) {
            out.push(match);
        }
    
        return out;
    }

    for (let line = 0; line < sourceCodeArr.length; line++) {
        const sourceCode = sourceCodeArr[line];

        let matches = [] as any;
        for (const pattern of flexboxPatterns.allFlexboxPatterns) {
            matches = matchAll(pattern, sourceCode);
            if (matches.length > 0) {
                break;
            }
        }
        if (matches.length > 0) {
            matches.forEach((match:any) => {
                if (match.index !== undefined) {
                    const flexIndex = sourceCode.indexOf(';', match.index) + 1;
                    let range = new vscode.Range(
                        new vscode.Position(line, match.index),
                        new vscode.Position(line, flexIndex)
                    );
                    let decoration = { range };
                    decorationsArray.push(decoration);
                }
            });
        }
    }
    editor.setDecorations(decorationType, decorationsArray);
}


// 主题
function isDarkTheme() {
    const activeTheme = vscode.window.activeColorTheme;
    return activeTheme.kind === vscode.ColorThemeKind.Dark;
}



// 悬浮信息
const getCommandUri = (attr:string, code:string, posLine: number) => {
    return vscode.Uri.parse(`command:flexcode.generating?${encodeURIComponent(JSON.stringify([{ attr, code, posLine }]))}`)
}
function buildMarkdownString(
    context: vscode.ExtensionContext,
    posLine: number
): vscode.MarkdownString[] {
    let markdownString: vscode.MarkdownString[] = [];
    const flexboxCommand = new vscode.MarkdownString();
    let imgUrl = isDarkTheme() ? 'light_flex' : 'dark_flex'
    const editor = vscode.window.activeTextEditor as any;
    let direction = "row"

    let LineText = editor.document.lineAt(posLine).text
    let flexBol = LineText.includes('flex')
    // 遍历字符
    for (let i = posLine - 1; i >= 0; i--) {
        const line = editor.document.lineAt(i);
        if(line.text.includes("{")){
            break
        }
        if(line.text.includes("flex-direction:")){
            const result = line.text.match(/flex-direction:\s*(.*?);/);
            if (result && result.length > 1) {
                direction = result[1].trim();
            }
            break
        }
    }
    for (let i = posLine + 1; i < editor.document.lineCount; i++) {
        const line = editor.document.lineAt(i);
        if(line.text.includes("{") || line.text.includes("}")){
            break
        }
        if(line.text.includes("flex-direction:")){
            const result = line.text.match(/flex-direction:\s*(.*?);/);
            if (result && result.length > 1) {
                direction = result[1].trim();
            }
            break
        }
    }

    if(!['row','column','row-reverse','column-reverse'].includes(direction)){
        direction = 'row'
    }
    let svgType = direction.includes('column') ? '_column' : ''

    const getSvg = (key: string) => {
        const alignmentMap = {
            'flex-start': {
                'row': 'content_flex-start_column.svg',
                'column': 'content_flex-start.svg',
                'row-reverse': 'content_flex-end_column.svg',
                'column-reverse': 'content_flex-end.svg'
            },
            'flex-end': {
                'row': 'content_flex-end_column.svg',
                'column': 'content_flex-end.svg',
                'row-reverse': 'content_flex-start_column.svg',
                'column-reverse': 'content_flex-start.svg'
            }
        } as any;
    
        if (alignmentMap[key]) {
            return alignmentMap[key][direction];
        }
    };

    const flex_html = `<span style="color:#3794FF;">flex-direction</span>
    <div>
        <a  href="${getCommandUri("flex-direction","row", posLine)}">
            <img width="22px" src="${vscode.Uri.file(join(context.extensionPath, `images/${imgUrl}`, `icon_flex_direction_row.svg`))}"> 
        </a>&nbsp;
        <a href="${getCommandUri("flex-direction","column", posLine)}">
            <img width="22px" src="${vscode.Uri.file(join(context.extensionPath, `images/${imgUrl}`, `icon_flex_direction_column.svg`))}"> 
        </a>&nbsp;
        <a href="${getCommandUri("flex-direction","row-reverse", posLine)}">
            <img width="22px" src="${vscode.Uri.file(join(context.extensionPath, `images/${imgUrl}`, `icon_flex_direction_row_reverse.svg`))}">
        </a>&nbsp;
        <a href="${getCommandUri("flex-direction","column-reverse", posLine)}">
            <img width="22px" src="${vscode.Uri.file(join(context.extensionPath, `images/${imgUrl}`, `icon_flex_direction_column_reverse.svg`))}">
        </a>
    </div>
    <span style="color:#3794FF;">flex-wrap</span>
    <div>
        <a href="${getCommandUri("flex-wrap","nowrap", posLine)}">
            <img width="22px" src="${vscode.Uri.file(join(context.extensionPath, `images/${imgUrl}`, `wrap_nowrap${svgType}.svg`))}"> 
        </a>&nbsp;
        <a href="${getCommandUri("flex-wrap","wrap", posLine)}">
            <img width="22px" src="${vscode.Uri.file(join(context.extensionPath, `images/${imgUrl}`, `wrap_wrap${svgType}.svg`))}"> 
        </a>
    </div>
    <span style="color:#3794FF;">align-content</span>
    <div>
        <a href="${getCommandUri("align-content","center", posLine)}">
            <img  width="22px" src="${vscode.Uri.file(join(context.extensionPath, `images/${imgUrl}`, `content_center${svgType}.svg`))}"> 
        </a>&nbsp;
        <a href="${getCommandUri("align-content","flex-start", posLine)}">
            <img width="22px" src="${vscode.Uri.file(join(context.extensionPath, `images/${imgUrl}`, `content_flex-start${svgType}.svg`))}"> 
        </a>&nbsp;
        <a href="${getCommandUri("align-content","flex-end", posLine)}">
            <img width="22px" src="${vscode.Uri.file(join(context.extensionPath, `images/${imgUrl}`, `content_flex-end${svgType}.svg`))}"> 
        </a>&nbsp;
        <a href="${getCommandUri("align-content","space-around", posLine)}">
            <img width="22px" src="${vscode.Uri.file(join(context.extensionPath, `images/${imgUrl}`, `content_space-around${svgType}.svg`))}"> 
        </a>&nbsp;
        <a href="${getCommandUri("align-content","space-between", posLine)}">
            <img width="22px" src="${vscode.Uri.file(join(context.extensionPath, `images/${imgUrl}`, `content_space-between${svgType}.svg`))}"> 
        </a>&nbsp;
        <a href="${getCommandUri("align-content","stretch", posLine)}">
            <img width="22px" src="${vscode.Uri.file(join(context.extensionPath, `images/${imgUrl}`, `content_stretch${svgType}.svg`))}"> 
        </a>
    </div>
    <span style="color:#3794FF;">justify-content</span>
    <div>
        <a href="${getCommandUri("justify-content","center", posLine)}">
            <img  width="22px" src="${vscode.Uri.file(join(context.extensionPath, `images/${imgUrl}`, `content_center${svgType ? '' : '_column'}.svg`))}"> 
        </a>&nbsp;
        <a href="${getCommandUri("justify-content","flex-start", posLine)}">
            <img width="22px" src="${vscode.Uri.file(join(context.extensionPath, `images/${imgUrl}`, `${getSvg('flex-start')}`))}"> 
        </a>&nbsp;
        <a href="${getCommandUri("justify-content","flex-end", posLine)}">
            <img width="22px" src="${vscode.Uri.file(join(context.extensionPath, `images/${imgUrl}`, `${getSvg('flex-end')}`))}"> 
        </a>&nbsp;
        <a href="${getCommandUri("justify-content","space-between", posLine)}">
            <img width="22px" src="${vscode.Uri.file(join(context.extensionPath, `images/${imgUrl}`, `content_space-between${svgType ? '' : '_column'}.svg`))}"> 
        </a>&nbsp;
        <a href="${getCommandUri("justify-content","space-around", posLine)}">
            <img width="22px" src="${vscode.Uri.file(join(context.extensionPath, `images/${imgUrl}`, `content_space-around${svgType ? '' : '_column'}.svg`))}"> 
        </a>&nbsp;
        <a href="${getCommandUri("justify-content","space-evenly", posLine)}">
            <img width="22px" src="${vscode.Uri.file(join(context.extensionPath, `images/${imgUrl}`, `content_space-evenly${svgType ? '' : '_column'}.svg`))}"> 
        </a>
    </div>
    <span style="color:#3794FF;">align-items</span>
    <div>
        <a href="${getCommandUri("align-items","center", posLine)}">
            <img  width="22px" src="${vscode.Uri.file(join(context.extensionPath, `images/${imgUrl}`, `items_center${svgType}.svg`))}"> 
        </a>&nbsp;
        <a href="${getCommandUri("align-items","flex-start", posLine)}">
            <img width="22px" src="${vscode.Uri.file(join(context.extensionPath, `images/${imgUrl}`, `items_flex-start${svgType}.svg`))}"> 
        </a>&nbsp;
        <a href="${getCommandUri("align-items","flex-end", posLine)}">
            <img width="22px" src="${vscode.Uri.file(join(context.extensionPath, `images/${imgUrl}`, `items_flex-end${svgType}.svg`))}"> 
        </a>&nbsp;
        <a href="${getCommandUri("align-items","stretch", posLine)}">
            <img width="22px" src="${vscode.Uri.file(join(context.extensionPath, `images/${imgUrl}`, `items_stretch${svgType}.svg`))}"> 
        </a>&nbsp;
        <a href="${getCommandUri("align-items","baseline", posLine)}">
            <img width="22px" src="${vscode.Uri.file(join(context.extensionPath, `images/${imgUrl}`, `items_baseline.svg`))}"> 
        </a>
    </div>`

    const grid_html = `<span style="color:#3794FF;">align-content</span>
    <div>
        <a href="${getCommandUri("align-content","center", posLine)}">
            <img  width="22px" src="${vscode.Uri.file(join(context.extensionPath, `images/${imgUrl}`, `content_center${svgType}.svg`))}"> 
        </a>&nbsp;
        <a href="${getCommandUri("align-content","space-between", posLine)}">
            <img width="22px" src="${vscode.Uri.file(join(context.extensionPath, `images/${imgUrl}`, `content_space-between${svgType}.svg`))}"> 
        </a>&nbsp;
        <a href="${getCommandUri("align-content","space-around", posLine)}">
            <img width="22px" src="${vscode.Uri.file(join(context.extensionPath, `images/${imgUrl}`, `content_space-around${svgType}.svg`))}"> 
        </a>&nbsp;
        <a href="${getCommandUri("align-content","space-evenly", posLine)}">
            <img width="22px" src="${vscode.Uri.file(join(context.extensionPath, `images/${imgUrl}`, `content_space-evenly${svgType}.svg`))}"> 
        </a>&nbsp;
        <a href="${getCommandUri("align-content","stretch", posLine)}">
            <img width="22px" src="${vscode.Uri.file(join(context.extensionPath, `images/${imgUrl}`, `content_stretch${svgType}.svg`))}"> 
        </a>
    </div>
    <span style="color:#3794FF;">justify-content</span>
    <div>
        <a href="${getCommandUri("justify-content","center", posLine)}">
            <img  width="22px" src="${vscode.Uri.file(join(context.extensionPath, `images/${imgUrl}`, `content_center${svgType ? '' : '_column'}.svg`))}"> 
        </a>&nbsp;
        <a href="${getCommandUri("justify-content","flex-start", posLine)}">
            <img width="22px" src="${vscode.Uri.file(join(context.extensionPath, `images/${imgUrl}`, `${getSvg('flex-start')}`))}"> 
        </a>&nbsp;
        <a href="${getCommandUri("justify-content","flex-end", posLine)}">
            <img width="22px" src="${vscode.Uri.file(join(context.extensionPath, `images/${imgUrl}`, `${getSvg('flex-end')}`))}"> 
        </a>&nbsp;
        <a href="${getCommandUri("justify-content","space-between", posLine)}">
            <img width="22px" src="${vscode.Uri.file(join(context.extensionPath, `images/${imgUrl}`, `content_space-between${svgType ? '' : '_column'}.svg`))}"> 
        </a>&nbsp;
        <a href="${getCommandUri("justify-content","space-around", posLine)}">
            <img width="22px" src="${vscode.Uri.file(join(context.extensionPath, `images/${imgUrl}`, `content_space-around${svgType ? '' : '_column'}.svg`))}"> 
        </a>&nbsp;
        <a href="${getCommandUri("justify-content","space-evenly", posLine)}">
            <img width="22px" src="${vscode.Uri.file(join(context.extensionPath, `images/${imgUrl}`, `content_space-evenly${svgType ? '' : '_column'}.svg`))}"> 
        </a>
    </div>
    <span style="color:#3794FF;">align-items</span>
    <div>
        <a href="${getCommandUri("align-items","center", posLine)}">
            <img  width="22px" src="${vscode.Uri.file(join(context.extensionPath, `images/${imgUrl}`, `items_center${svgType}.svg`))}"> 
        </a>&nbsp;
        <a href="${getCommandUri("align-items","flex-start", posLine)}">
            <img width="22px" src="${vscode.Uri.file(join(context.extensionPath, `images/${imgUrl}`, `items_flex-start${svgType}.svg`))}"> 
        </a>&nbsp;
        <a href="${getCommandUri("align-items","flex-end", posLine)}">
            <img width="22px" src="${vscode.Uri.file(join(context.extensionPath, `images/${imgUrl}`, `items_flex-end${svgType}.svg`))}"> 
        </a>&nbsp;
        <a href="${getCommandUri("align-items","stretch", posLine)}">
            <img width="22px" src="${vscode.Uri.file(join(context.extensionPath, `images/${imgUrl}`, `items_stretch${svgType}.svg`))}"> 
        </a>&nbsp;
        <a href="${getCommandUri("align-items","baseline", posLine)}">
            <img width="22px" src="${vscode.Uri.file(join(context.extensionPath, `images/${imgUrl}`, `items_baseline.svg`))}"> 
        </a>
    </div><span style="color:#3794FF;">justify-items</span>
    <div>
        <a href="${getCommandUri("justify-items","center", posLine)}">
            <img  width="22px" src="${vscode.Uri.file(join(context.extensionPath, `images/${imgUrl}`, `justify-items-center.svg`))}"> 
        </a>&nbsp;
        <a href="${getCommandUri("justify-items","start", posLine)}">
            <img width="22px" src="${vscode.Uri.file(join(context.extensionPath, `images/${imgUrl}`, `justify-items-start.svg`))}"> 
        </a>&nbsp;
        <a href="${getCommandUri("justify-items","end", posLine)}">
            <img width="22px" src="${vscode.Uri.file(join(context.extensionPath, `images/${imgUrl}`, `justify-items-end.svg`))}"> 
        </a>&nbsp;
        <a href="${getCommandUri("justify-items","stretch", posLine)}">
            <img width="22px" src="${vscode.Uri.file(join(context.extensionPath, `images/${imgUrl}`, `justify-items-stretch.svg`))}"> 
        </a>&nbsp;
    </div>`

    let HoverHtml = flexBol ? flex_html : grid_html
    flexboxCommand.appendMarkdown(HoverHtml)
    flexboxCommand.isTrusted = true
    flexboxCommand.supportHtml = true
    markdownString.push(flexboxCommand)
    return markdownString
}

function getPropertyRangeAtPosition(
    doc: vscode.TextDocument,
    pos: vscode.Position
) {
    let propertyRange: vscode.Range | undefined;

    for (const pattern of flexboxPatterns.allFlexboxPatterns) {
        const range = doc.getWordRangeAtPosition(pos, pattern);

        if (range) {
            propertyRange = range;

            break;
        }
    }

    return propertyRange;
}

export function deactivate() { }
