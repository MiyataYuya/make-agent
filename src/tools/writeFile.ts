// src/tools/writeFile.ts
import * as fs from 'fs/promises';
import * as path from 'path';

const WORKSPACE_ROOT = path.resolve(process.cwd(), './workspace');

async function writeFileExecute(args: {
    path: string;
    content: string;
}): Promise<string> {
    const absolutePath = path.resolve(WORKSPACE_ROOT, args.path);

    const allowedPrefix = WORKSPACE_ROOT + path.sep;

    if (!absolutePath.startsWith(allowedPrefix) && absolutePath !== WORKSPACE_ROOT) {
        throw new Error(`Access denied: The path ${args.path} is outside the workspace`);
    }

    const dir = path.dirname(absolutePath);
    await fs.mkdir(dir, {recursive: true});

    await fs.writeFile(absolutePath, args.content, 'utf-8');

    return `File ${args.path} has been written successfully.`;
}

export const writeFile = {
    name: "writeFile", 
    description: "ワークスペース内の指定されたパスに文字列内容を書き込む。相対パスまたは絶対パスを指定できる。必要に応じてディレクトリも作成される。",
    parameters: {
        type: "object",
        properties: {
            type: "string",
            description: "書き込むファイルのパス（例: 'output.txt', 'logs/app.log'）"
        },
        content: {
            type: "string",
            description: "ファイルに書き込む内容",
        },
        required: ["path", "content"]
    },
    execute: writeFileExecute,
};
