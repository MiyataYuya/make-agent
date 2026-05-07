// Ollama (gemma4) のChat APIを呼び出す最小限の実装
async function callOllama() {
  const response = await fetch('http://host.docker.internal:11434/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gemma4',
      messages: [
        { role: 'user', content: 'TypeScriptについて簡潔に説明してください。' }
      ],
      stream: false,
    }),
  });

  const data = await response.json() as { message: { content: string } };
  console.log(data.message.content);
}

// 関数を実行
callOllama();
