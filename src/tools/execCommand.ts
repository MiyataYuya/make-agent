import * as path from "path";
import { spawn } from "child_process";

const WORKSPACE_ROOT = path.resolve(process.cwd(), "./workspace");
const ALLOWED_COMMANDS = ["cat", "bun", "gh", "echo", "ls", "pwd", "date", "whoami"];
const MAX_OUTPUT_LENGTH = 2048;
const dangerousChar = /[;&|<>]/;

// ==============================
// コマンドのパース関数
// ==============================
type Quote = '"' | "'" | null;

export function parseCommand(input: string): string[] {
    const tokens: string[] = [];
    let current = '';
    let quote: Quote = null;
    let escaped = false;

    for (let i = 0; i < input.length; i++) {
        const char = input[i] || "";

        if (quote) {
            if (escaped) {
                current += char;
                escaped = false;
                continue;
            }
            if (char === '\\' && quote === '"') {
                escaped = true;
                continue;
            }
            if (char === quote) { quote = null; continue; }
            current += char;
            continue;
        }

        // quote開始
        if (char === '"' || char === "'") {
            quote = char;
            continue;
        }

        // 空白でトークンを区切る
        if (/\s/.test(char)) {
            if (current.length > 0) {
                tokens.push(current);
                current = '';
            }
            continue;
        }

        current += char;
    }

    if (quote) {
        throw new Error(`Unclosed quote: ${quote}`);
    }
    if (current.length > 0) {
        tokens.push(current);
    }

    return tokens;
};

// ==============================
// execCommandの実装
// ==============================

async function execCommandExecute(args: { command: string }): Promise<string> {
    // 危険な文字が含まれていないかチェック
    if (dangerousChar.test(args.command)) {
        throw new Error("危険な文字が含まれています。");
    }

    // コマンドの解析
    const parts = parseCommand(args.command);
    if (parts.length === 0) {
        throw new Error("コマンドが空です。");
    }

    const commandName: string = parts[0];
    const commandArgs = parts.slice(1);

    // 許可されたコマンドかチェック
    if (!ALLOWED_COMMANDS.includes(commandName)) {
        throw new Error(`許可されていないコマンドです: ${commandName}`);
    }

    // ワークスペース内なチェック
    for (const arg of commandArgs) {
        if (arg.includes("/") || arg.includes("\\")) {
            const resolvedPath = path.resolve(WORKSPACE_ROOT, arg);
            if (!resolvedPath.startsWith(WORKSPACE_ROOT + path.sep) && resolvedPath !== WORKSPACE_ROOT) {
                throw new Error(`コマンド引数にワークスペース外のパスが含まれています: ${arg}`);
            }
        }
    }

    // コマンドの実行
    return new Promise((resolve, reject) => {
        let stdout = "";
        let stderr = "";
        let outputTruncated = false;

        const child = spawn(commandName, commandArgs, {
            cwd: WORKSPACE_ROOT,
            timeout: 30000,
            shell: false,
        });

        child.stdout.on('data', (data, Buffer) => {
            const chunk = data.toString();
            if (stdout.length + chunk.length > MAX_OUTPUT_LENGTH) {
                stdout += chunk.slice(0, MAX_OUTPUT_LENGTH - stdout.length);
                outputTruncated = true;
            } else {
                stdout += chunk;
            }
        });

        child.stderr.on('data', (data, Buffer) => {
            const chunk = data.toString();
            if (stdout.length + chunk.length > MAX_OUTPUT_LENGTH) {
                stdout += chunk.slice(0, MAX_OUTPUT_LENGTH - stdout.length);
                outputTruncated = true;
            } else {
                stdout += chunk;
            }
        });

        child.on('close', (code: number | null) => {
            let result = '';

            if (stdout) {
                result += stdout;
            }
            if (stderr) {
                result += (result ? '\n' : '') + stderr;
            }
            if (outputTruncated) {
                result += '\n[出力が長すぎるため、途中で切り捨てられました]';
            }

            if (code !== 0) {
                result += `\n[終了コード]: ${code}`;
            }

            resolve(result || '(コマンドの出力はありません)');
        });

        child.on('error', (err: Error) => {
            reject(new Error(`コマンドの実行に失敗しました: ${err.message}`));
        });
    });
}

// ==============================
// ツール定義
// ==============================

export const execCommand = {
    name: "execCommand",
    description: "ワークスペース内で許可されたコマンドを実行する。",
    parameters: {
        type: 'object',
        properties: {
            command: {
                type: 'string',
                description: '実行するコマンド（例: "bun test", "ls -la src/"）',
            },
        },
    },
    execute: execCommandExecute,
};


