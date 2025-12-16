import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export function createGroqModel() {
  return {
    async generateContent(prompt) {
      if (!process.env.GROQ_API_KEY) {
        throw new Error("GROQ_API_KEY is not configured");
      }

      try {
        const completion = await groq.chat.completions.create({
          // Use a currently supported Groq model
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
        });

        const text =
          completion.choices?.[0]?.message?.content?.trim?.() ??
          completion.choices?.[0]?.message?.content ??
          "";

        return {
          response: {
            text: () => text,
            candidates: [
              {
                content: {
                  parts: [{ text }],
                },
              },
            ],
          },
        };
      } catch (error) {
        console.error("Groq generateContent error:", error);
        throw error;
      }
    },
  };
}



