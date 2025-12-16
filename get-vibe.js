const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async function(event, context) {
    // Only allow GET requests
    if (event.httpMethod !== "GET") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    const product = event.queryStringParameters.product;

    if (!product) {
        return { statusCode: 400, body: "Product name is required" };
    }

    try {
        // Initialize Gemini API
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        // The Prompt Engineering
        const prompt = `
        You are a Gen Z product reviewer. I will give you a product name: "${product}".
        Generate a JSON response that describes this product. 
        Do not include markdown formatting like \`\`\`json. Just return the raw JSON object.
        
        The JSON must strictly follow this structure:
        {
            "name": "Product Name",
            "tagline": "A short, punchy, gen-z tagline (max 6 words)",
            "score": Integer between 1 and 100 representing sentiment,
            "vibe": "A 2-3 word summary (e.g., 'ABSOLUTE GOAT', 'MID TIER', 'SKIP IT')",
            "specs": [
                {"k": "Spec Label 1", "v": "Spec Value 1"},
                {"k": "Spec Label 2", "v": "Spec Value 2"},
                {"k": "Spec Label 3", "v": "Spec Value 3"},
                {"k": "Spec Label 4", "v": "Spec Value 4"}
            ],
            "reviews": [
                "A short positive review using slang",
                "Another short review",
                "A critical/funny review"
            ],
            "verdict": "A one sentence final verdict."
        }
        
        Be honest about the product (if it's bad, say it's bad). Use slang like "no cap", "slaps", "mid", "goated", "L", "W".
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // Clean up formatting if the AI adds markdown ticks
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '');

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: cleanJson
        };

    } catch (error) {
        console.error("Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Vibe check failed. Try again." })
        };
    }
};


