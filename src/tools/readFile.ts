import * as fs from 'fs/promises';
import path from 'path';

const WORKSPACE_ROOT = path.resolve(process.cwd(), './workspace'); 

const MAX_FILE_SIZE = 100 * 1024;

async function readFileExecute(args: {path: string }): Promise<string> {
    const absolutePath = path.resolve(WORKSPACE_ROOT, args.path);

    const allowedPrefix = WORKSPACE_ROOT + path.sep;

    if (!absolutePath.startsWith(allowedPrefix) && absolutePath !== WORKSPACE_ROOT) {
        throw new Error(`Access denied: The path ${args.path} is outside the workspace`);
    }

    const realPath = await fs.realpath(absolutePath);

    if (!realPath.startsWith(allowedPrefix) && realPath !== WORKSPACE_ROOT) {
        throw new Error(`Access denied: The path ${args.path} is outside the workspace`);
    }

    try {
        const stat = await fs.stat(absolutePath);
        if (!stat.isFile()) {
            throw new Error(`The path ${args.path} is not a file`);
        }

        if (stat.size > MAX_FILE_SIZE) {
            throw new Error(`The file ${args.path} is too large to read (max ${MAX_FILE_SIZE} bytes)`);
        }
    } catch (error) {
        if (error.code === 'ENOENT') {
            throw new Error(`The file ${args.path} does not exist`);
        }
        throw error;
    }

    const content = await fs.readFile(absolutePath, 'utf-8');
    return content;
}

export const readFile = {
    name: "readFile",
    description: "ワークスペース内の指定されたパスのファイル内容を文字列として読み込む。ファイルが存在しない場合はエラーを返す。100KBを超えるファイルは読み込まない（コンテクストウィンドウ保護のため）。相対パスまたは絶対パスを指定できる。",
    parameters: {
        type: "object",
        properties: {
            path: {
                type: "string",
                description: "読み込むファイルのパス（例: 'README.md', 'src/index.ts'）"
            }
        },
        required: ["path"],
    },
    execute: readFileExecute,
}