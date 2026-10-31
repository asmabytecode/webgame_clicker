export async function api(path, options = {}) {
  let response;
  try {
    response = await fetch(path, {
      credentials: "same-origin",
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error(
      "Не удалось подключиться к игровому серверу. Запустите npm run dev и откройте http://127.0.0.1:5173/.",
    );
  }

  if (response.status === 204) return null;

  let body;
  try {
    body = await response.json();
  } catch {
    throw new Error(
      `Сервер вернул ответ не в формате JSON (HTTP ${response.status}). Запустите npm run dev и откройте игру через http://127.0.0.1:5173/, а не файл index.html.`,
    );
  }

  if (!response.ok) {
    const error = new Error(body?.error || "Не удалось выполнить запрос");
    error.status = response.status;
    throw error;
  }

  return body;
}
