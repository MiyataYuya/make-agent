import type {
    GenerateParams,
    GenerateTextResult,
    LanguageModel,
    Message,
    Provider,
    ToolCall,
} from '../types';
import { LLMApiError as LLMApiError } from '../types';

export function createOllama(config?: {
    apiKey?: string;
    baseUrl?: string;
    maxRetries?: number;
}): Provider {

    const client = {
        baseURL: config?.baseUrl ?? 'http://host.docker.internal:11434',
        maxRetries: config?.maxRetries ?? 3,
    }

    function convertMessages(messages: Message[]) {
        return messages.map((m) => {
            if (m.role === 'tool') {
                return {
                    role: 'tool' as const,
                    tool_name: m.name,
                    content: m.content,
                };
            }
            if (m.role === 'assistant' && m.toolCalls) {
                return {
                    role: 'assistant' as const,
                    content: m.content,
                    tool_calls: m.toolCalls.map((tc, index) => ({
                        type: 'function' as const,
                        function: {
                            index,
                            name: tc.name,
                            arguments: tc.args,
                        },
                    })),
                };
            }
            return { role: m.role, content: m.content };
        });
    }

    function mapFinishReason(reason: string | null): GenerateTextResult['finishReason'] {
        switch (reason) {
            case 'stop': return 'stop';
            case 'length': return 'length';
            default:
                return 'stop';
        }
    }

    return (modelId: string): LanguageModel => ({

        async doGenerate(params: GenerateParams): Promise<GenerateTextResult> {
            const tools = params.tools?.map((tool) => ({
                type: 'function' as const,
                function: {
                    name: tool.name,
                    description: tool.description,
                    parameters: tool.parameters,
                },
            }));

            let response: Response;
            try {
                response = await fetch(`${client.baseURL}/api/chat`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model: modelId,
                        messages: convertMessages(params.messages),
                        stream: false,
                    }),
                });
            } catch (error) {
                if (error instanceof LLMApiError) throw error;
                throw new LLMApiError(
                    500,
                    'ollama',
                    undefined,
                    error instanceof Error ? error.message : 'unknown error',
                    error
                )
            }

            if (!response.ok) {
                const body = await response.text();
                throw new LLMApiError(
                    response.status, 'ollama', undefined, body, body
                );
            }


            const data = await response.json() as {
                message: { 
                    content: string; 
                    tool_calls?: { type: string; function: { index: number; name: string; arguments: any } }[]; 
                };
                done_reason?: string;
                prompt_eval_count?: number;
                eval_count?: number;
            };

            const toolCalls: ToolCall[] | undefined = data.message.tool_calls?.map(
                (tc, i) => ({
                    toolCallId: (tc.function.index ?? i).toString(),
                    name: tc.function.name,
                    args: tc.function.arguments,
                }),
            );

            return {
                text: data.message.content ?? '',
                finishReason: 
                    toolCalls && toolCalls.length > 0
                        ? 'tool_calls'
                        : mapFinishReason(data.done_reason ?? null),
                toolCalls,
                usage: {
                    promptTokens: data.prompt_eval_count,
                    completionTokens: data.eval_count,
                    totalTokens: (data.prompt_eval_count ?? 0) + (data.eval_count ?? 0),
                }
            }
        }
    })
}