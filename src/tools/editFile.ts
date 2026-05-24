import { argon2Sync } from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';

const WORKSPACE_ROOT = path.resolve(process.cwd(), './workspace');

async function editFileExecute(args: {
    path: string;
    oldText: string;
    newText: string;
}): Promise<string> {
    const absolutePath = path.resolve(WORKSPACE_ROOT, args.path);

    const allowedPrefix = WORKSPACE_ROOT + path.sep;
    if (!absolutePath.startsWith(allowedPrefix) && absolutePath !== WORKSPACE_ROOT) {
        throw new Error(`Access denied: The path ${args.path} is outside the workspace`);
    }

    const content = await fs.readFile(absolutePath, 'utf-8');

    const matches = content.split(args.oldText).length - 1;
    if (matches === 0) {
        const preview = args.oldText.length > 50
        ? `${args.oldText.slice(0, 50)}...`
        : args.oldText;
        throw new Error(`The text "${preview}" was not found in the file ${args.path}`);
    }
    if (matches > 1) {
        throw new Error(
            `The text "${args.oldText}" was found ${matches} times in the file ${args.path}. Please ensure it is unique before editing.`
        );
    }

    const newContent = content.replace(args.oldText, args.newText);

    await fs.writeFile(absolutePath, newContent, 'utf-8');

    return `File ${args.path} has been edited successfully.`;
}

export const editFile = {
    name: "editFile",
    description: "ファイルの一部を編集する。olfTextで指定した個所をnewTextで置き換える。oldTextが複数見つかる場合はエラーを返すため、一意によく艇できる範囲を指定すること。ファイル全体を読み書きするよりトークン消費が少ない。",
    parameters: {
        type: "object",
        properties: {
            path: {
                type: "string",
                description: "編集するファイルのパス"
            },
            oldText: {
                type: "string",
                description: "変更後のテキスト"
            },
            newText: {
                type: "string",
                description: "変更後のテキスト"
            }
        },
        required: ["path", "oldText", "newText"]
    },
    execute: editFileExecute,
};