import api from "./api";

/**
 * Sends conversation messages to backend AI Assistant.
 * @param {Array<{role: string, content: string}>} messages 
 * @param {string} [prompt] 
 * @param {string} [language]
 * @returns {Promise<{reply: string, source: string, language: string}>}
 */
export async function sendAssistantChat(messages, prompt, language = "en") {
  const response = await api.post("/ai/assistant/chat", {
    messages,
    prompt: prompt || (messages.length > 0 ? messages[messages.length - 1].content : ""),
    language,
  });
  return response.data;
}
