import { createOllama } from "../src/providers/ollama";
import { generateText } from "../src/core/generate-text";
import type { Message } from "../src/types";

const messages: Message[] = [
    {role: 'user', content: 'TypeScriptについて簡潔に説明してください。'}
];

const ollama = createOllama();
const result = await generateText({ model: ollama('gemma4'), messages });
console.log(result.text);
