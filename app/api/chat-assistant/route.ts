import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Available products in the supermarket
const availableProducts = [
  "vitamins", "medicine", "health products",
  "cosmetics", "shampoo", "soap", "personal care",
  "paper towels", "cleaning supplies", "toilet paper",
  "kitchen items", "pots", "pans",
  "fruit", "apples", "bananas", "oranges",
  "milk", "cheese", "yogurt", "dairy",
  "vegetables", "lettuce", "tomatoes", "carrots",
  "juice", "orange juice",
  "water", "beer",
  "wine", "candy", "chocolate",
  "snacks", "chips", "crackers",
  "oil", "vinegar", "condiments", "sauces",
  "canned goods", "beans", "soup",
  "soda", "soft drinks",
  "pasta", "bread", "bakery", "rice", "tortillas",
  "seafood", "fish",
  "frozen food", "meat", "chicken", "beef", "eggs",
  "coffee"
];

const systemPrompt = `You are Oci, a friendly supermarket voice assistant. 

Your job:
1. Extract product names from user input
2. Give SHORT responses (1-2 sentences) for shopping requests
3. Give CLEAR, SPECIFIC instructions when asked for help
4. Always tell users the EXACT phrases to say
5. When users ask about their list, suggest calculating the route if they have products

Available products: vitamins, medicine, cosmetics, shampoo, soap, paper towels, cleaning supplies, kitchen items, pots, pans, fruit, apples, bananas, oranges, milk, cheese, yogurt, vegetables, lettuce, tomatoes, carrots, juice, water, beer, wine, candy, chocolate, snacks, chips, crackers, oil, vinegar, condiments, sauces, canned goods, beans, soup, soda, pasta, bread, rice, tortillas, seafood, fish, frozen food, meat, chicken, beef, eggs, coffee

EXACT Commands to teach users:
- Add products: "I need milk and bread" or "Add apples"
- Confirm list: "Yes"
- Add more: "Add cheese" or "Also apples"
- Remove item: "Remove milk"
- Clear all: "Remove all"
- Hear route: "Repeat"
- Calculate/Generate route: "Calculate route" or "Generate route"
- Navigate: "Start navigation" then "Next zone"
- Camera: "Camera on" or "Camera off"
- Finish: "Thank you"

Rules:
- For shopping: Keep it brief
- For help: Give step-by-step instructions with exact phrases
- Always remind to press and hold mic button, then release when done
- Extract ALL products mentioned
- When user asks about their list, remind them they can say "Calculate route" to generate the optimal path
- If user has products but no route yet, suggest saying "Calculate route"

Response format (JSON):
{
  "response": "Your spoken response",
  "products": ["product1", "product2"],
  "intent": "shopping" or "greeting" or "help" or "command_info" or "list_inquiry"
}

Examples:
"I need milk and bread" → {"response": "Got it! Milk and bread.", "products": ["milk", "bread"], "intent": "shopping"}
"Help me" → {"response": "To shop, press and hold the mic button, say I need milk and bread, then release. When I ask, say Yes to confirm. Say Repeat to hear the route, Start navigation for steps, Camera on for camera, Thank you to finish.", "products": [], "intent": "help"}
"What's on my list?" → {"response": "Let me check your list. Would you like me to calculate the route? Just say Calculate route when ready.", "products": [], "intent": "list_inquiry"}
"What do I have?" → {"response": "I can tell you your current list. If you are ready to shop, say Calculate route to generate your optimal path.", "products": [], "intent": "list_inquiry"}
"This is my first time" → {"response": "Welcome! Press and hold the big blue button. Say I need milk and bread. Release button. I will ask you to say Yes to confirm. Then I create your route. Say Repeat to hear it, or Start navigation for step by step. Say Thank you when done.", "products": [], "intent": "help"}`;
export async function POST(req: Request) {
  try {
    const { message, history, currentProducts } = await req.json();

    console.log('Received request:', { message, currentProducts });

    // Build simple context
    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: systemPrompt }
    ];

    // Add context if user already has products
    if (currentProducts && currentProducts.length > 0) {
      messages.push({
        role: "system",
        content: `User already shopping for: ${currentProducts.join(", ")}. If they say "also" or "add", combine with these.`
      });
    }

    // Add just the last 2 exchanges for minimal context
    if (history && Array.isArray(history) && history.length > 0) {
      const recent = history.slice(-4); // Last 2 user + 2 assistant messages
      recent.forEach((msg: any) => {
        if (msg.role && msg.content) {
          messages.push({ 
            role: msg.role as "user" | "assistant", 
            content: msg.content 
          });
        }
      });
    }

    messages.push({ role: "user", content: message });

    console.log('Sending to OpenAI, messages count:', messages.length);

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
      response_format: { type: "json_object" },
      temperature: 0.3, // Lower for more consistent
      max_tokens: 250, // Increased for detailed help responses
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content received from OpenAI");
    }

    const aiResponse = JSON.parse(content);

    console.log('AI Response:', aiResponse);

    // If adding products, merge with current list
    let finalProducts = aiResponse.products || [];
    
    // Fusionar con productos existentes si:
    // 1. Ya hay productos actuales
    // 2. La intención es shopping
    // 3. El mensaje sugiere agregar (also, add, más, también) O hay productos previos
    const isAddingToList = message.toLowerCase().match(/also|add|more|además|también|agregar|y\s/);
    
    if (currentProducts && currentProducts.length > 0 && aiResponse.intent === "shopping") {
      if (isAddingToList || finalProducts.length > 0) {
        // Combinar productos existentes con los nuevos
        finalProducts = [...new Set([...currentProducts, ...finalProducts])];
        console.log('Merged products - Previous:', currentProducts, 'New:', aiResponse.products, 'Final:', finalProducts);
      }
    }

    return NextResponse.json({
      response: aiResponse.response,
      products: finalProducts,
      intent: aiResponse.intent || "other"
    });

  } catch (error) {
    console.error("Chat assistant error:", error);
    return NextResponse.json({
      error: "Error processing request",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
