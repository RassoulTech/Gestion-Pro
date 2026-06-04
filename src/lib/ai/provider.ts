import "server-only";

/**
 * Couche IA unique et provider-agnostique.
 *
 * Mode déterminé par les variables d'environnement :
 *   - ANTHROPIC_API_KEY → Claude (claude-haiku-4-5 par défaut)
 *   - OPENAI_API_KEY     → OpenAI (gpt-4o-mini par défaut)
 *   - sinon              → MOCK (réponses simulées, 0 coût)
 *
 * Chaque appel fournit OBLIGATOIREMENT un `mock()` : en mode mock, ou si l'appel
 * réseau échoue, on renvoie ce repli — l'app ne casse jamais et reste utilisable
 * sans clé. Brancher une vraie clé suffit à activer le moteur réel, sans recoder.
 */

export type AiMode = "anthropic" | "openai" | "mock";

export function getAiMode(): AiMode {
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.OPENAI_API_KEY) return "openai";
  return "mock";
}

const ANTHROPIC_MODEL = process.env.AI_MODEL || "claude-haiku-4-5";
const OPENAI_MODEL = process.env.AI_MODEL || "gpt-4o-mini";

export interface AiMessage {
  role: "user" | "assistant";
  content: string;
}

interface CompleteOpts {
  system: string;
  user: string;
  mock: () => string;
  maxTokens?: number;
}

/** Complétion non-streamée. Renvoie toujours une chaîne (repli mock si besoin). */
export async function aiComplete({ system, user, mock, maxTokens = 1024 }: CompleteOpts): Promise<string> {
  const mode = getAiMode();
  if (mode === "mock") return mock();

  try {
    if (mode === "anthropic") {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": process.env.ANTHROPIC_API_KEY!,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: ANTHROPIC_MODEL,
          max_tokens: maxTokens,
          system,
          messages: [{ role: "user", content: user }],
        }),
      });
      if (!res.ok) throw new Error(`Anthropic ${res.status}`);
      const data = await res.json();
      const text = data?.content?.[0]?.text;
      return typeof text === "string" && text.trim() ? text : mock();
    }

    // openai
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY!}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        max_tokens: maxTokens,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    if (!res.ok) throw new Error(`OpenAI ${res.status}`);
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    return typeof text === "string" && text.trim() ? text : mock();
  } catch (err) {
    console.error("[ai] complete failed, falling back to mock:", err);
    return mock();
  }
}

interface VisionOpts {
  system: string;
  user: string;
  imageBase64: string; // base64 brut (sans préfixe data:)
  mimeType: string;
  mock: () => string;
  maxTokens?: number;
}

/** Complétion avec image (vision). Repli mock si pas de clé ou erreur. */
export async function aiCompleteVision({ system, user, imageBase64, mimeType, mock, maxTokens = 700 }: VisionOpts): Promise<string> {
  const mode = getAiMode();
  if (mode === "mock") return mock();

  try {
    if (mode === "anthropic") {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": process.env.ANTHROPIC_API_KEY!,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: ANTHROPIC_MODEL,
          max_tokens: maxTokens,
          system,
          messages: [
            {
              role: "user",
              content: [
                { type: "image", source: { type: "base64", media_type: mimeType, data: imageBase64 } },
                { type: "text", text: user },
              ],
            },
          ],
        }),
      });
      if (!res.ok) throw new Error(`Anthropic ${res.status}`);
      const data = await res.json();
      const text = data?.content?.[0]?.text;
      return typeof text === "string" && text.trim() ? text : mock();
    }

    // openai (vision)
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY!}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        max_tokens: maxTokens,
        messages: [
          { role: "system", content: system },
          {
            role: "user",
            content: [
              { type: "text", text: user },
              { type: "image_url", image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
            ],
          },
        ],
      }),
    });
    if (!res.ok) throw new Error(`OpenAI ${res.status}`);
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    return typeof text === "string" && text.trim() ? text : mock();
  } catch (err) {
    console.error("[ai] vision failed, falling back to mock:", err);
    return mock();
  }
}

/** Découpe un texte en petits morceaux pour simuler le streaming en mode mock. */
function* chunkText(text: string): Generator<string> {
  const tokens = text.split(/(\s+)/);
  let buf = "";
  for (const t of tokens) {
    buf += t;
    if (buf.length >= 12) {
      yield buf;
      buf = "";
    }
  }
  if (buf) yield buf;
}

interface StreamOpts {
  system: string;
  messages: AiMessage[];
  mock: () => string;
  maxTokens?: number;
}

/**
 * Chat en streaming. Renvoie un ReadableStream de texte brut (UTF-8) que le
 * client lit au fur et à mesure. En mode mock, on streame le repli morceau par
 * morceau pour conserver l'effet « machine à écrire ».
 */
export async function streamChat({ system, messages, mock, maxTokens = 1024 }: StreamOpts): Promise<ReadableStream<Uint8Array>> {
  const mode = getAiMode();
  const encoder = new TextEncoder();

  if (mode === "mock") {
    const text = mock();
    return new ReadableStream({
      async start(controller) {
        for (const piece of chunkText(text)) {
          controller.enqueue(encoder.encode(piece));
          await new Promise((r) => setTimeout(r, 18));
        }
        controller.close();
      },
    });
  }

  try {
    if (mode === "anthropic") {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": process.env.ANTHROPIC_API_KEY!,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: ANTHROPIC_MODEL,
          max_tokens: maxTokens,
          stream: true,
          system,
          messages,
        }),
      });
      if (!res.ok || !res.body) throw new Error(`Anthropic ${res.status}`);
      return parseSse(res.body, (json) =>
        json.type === "content_block_delta" && json.delta?.type === "text_delta"
          ? json.delta.text ?? ""
          : ""
      );
    }

    // openai
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY!}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        max_tokens: maxTokens,
        stream: true,
        messages: [{ role: "system", content: system }, ...messages],
      }),
    });
    if (!res.ok || !res.body) throw new Error(`OpenAI ${res.status}`);
    return parseSse(res.body, (json) => json.choices?.[0]?.delta?.content ?? "");
  } catch (err) {
    console.error("[ai] stream failed, falling back to mock:", err);
    const text = mock();
    return new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(text));
        controller.close();
      },
    });
  }
}

interface SseJson {
  type?: string;
  delta?: { type?: string; text?: string };
  choices?: { delta?: { content?: string } }[];
}

/** Transforme un flux SSE provider en flux de texte brut via un extracteur de delta. */
function parseSse(
  body: ReadableStream<Uint8Array>,
  extract: (json: SseJson) => string
): ReadableStream<Uint8Array> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  return new ReadableStream({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        controller.close();
        return;
      }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const json = JSON.parse(payload) as SseJson;
          const delta = extract(json);
          if (delta) controller.enqueue(encoder.encode(delta));
        } catch {
          /* ligne partielle — ignorée */
        }
      }
    },
    cancel() {
      reader.cancel();
    },
  });
}
