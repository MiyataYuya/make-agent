import {writeFile} from '../src/tools/writeFile';
import {readFile} from '../src/tools/readFile';
import {editFile} from '../src/tools/editFile';
import {execCommand} from '../src/tools/execCommand';

async function demo() {
    console.log("=== writeFile ===");

    console.log('1. writeFile: テストファイルを作成');
    const writeResult = await writeFile.execute({
        path: 'test.txt',
        content: 'Hello, World!',
    });
    console.log('writeFile result:', writeResult);

    console.log('2. readFile: 作成したファイルを読み込む');
    const readResult = await readFile.execute({
        path: 'test.txt',
    });
    console.log('readFile result:', readResult);

    console.log('3. editFile: ファイルの内容を編集');
    const editResult = await editFile.execute({
        path: 'test.txt',
        oldText: 'World',
        newText: 'TypeScript',
    });
    console.log('editFile result:', editResult);

    console.log('4. execCommand: ファイルの内容を表示');
    const execResult = await execCommand.execute({
        command: 'cat test.txt',
    });
    console.log('execCommand result:', execResult);

    // エラーケース
    console.log("6. エラーケース：　存在しないファイルを読み込む");
    await readFile.execute({
        path: 'nonexistent.txt',
    }).catch(err => {
        console.log('Expected error:', err.message);
    });

    console.log("7. セキュリティチェック");
    try {
        await readFile.execute({
            path: '../.env'
        });
    } catch (err) {
        console.log('Expected security error:', err.message);
    }

    console.log("=== デモ完了 ===");
}

demo().catch(console.error);