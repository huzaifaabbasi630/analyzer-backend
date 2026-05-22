// aiHelper.js
const axios = require("axios");

const getAIResponse = async (prompt) => {
  try {
    const response = await axios.post(
      "https://api.puter.com/puterai/openai/v1/chat/completions",
      {
        model: "google/gemini-3.1-flash-lite",
        messages: [
          { role: "system", content: "You are a resume analysis assistant." },
          { role: "user", content: prompt }
        ]
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.PUTER_AUTH_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );

    // Puter returns the standard OpenAI format
    const aiOutput = response.data.choices?.[0]?.message?.content;
    if (!aiOutput) {
      throw new Error("No content returned from Puter AI");
    }

    return aiOutput;
  } catch (error) {
    console.error(
      "Puter AI Error:",
      error.response ? error.response.data : error.message
    );
    throw new Error("AI analysis failed. Please check your API key or try again later.");
  }
};

module.exports = { getAIResponse };