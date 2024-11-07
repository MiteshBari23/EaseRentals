const dotenv = require("dotenv");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const cors = require("cors");
const express = require("express");
const app = express();
app.use(cors());

dotenv.config();

const port = process.env.GEMINI_PORT;
const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  generationConfig: {
    candidateCount: 1,
    stopSequences: [""],
    maxOutputTokens: 700,
    temperature: 0.8,
  },
});
  
let geminiResponse = "";

async function generateContent(userPrompt) {
  try {
    const result = await model.generateContent(
      // window.localStorage.getItem("user-prompt")
      userPrompt +
        ", dont give any introduction, dont give any conclusion," +
        " only list out, only answer to this prompt if this a travelling" +
        " or health care related question else respond with 'I can assist you with travel-related questions and health needs only.'"
    );
    // console.log(result.response.text());
    geminiResponse = result.response.text();
    // console.log(geminiResponse);
    return geminiResponse;
  } catch (error) {
    console.error("Error generating content:", error);
  }
}

app.get("/test", async (req, res) => {
  // console.log("GET request successful");
  const userPrompt = req.query.prompt;
  // console.log(userPrompt)
  const geminiResponse = await generateContent(userPrompt);
  res.json({ message: geminiResponse });
});

app.listen(port, () => {
  console.log(`Gemini Server is running on port ${port}`);
});
