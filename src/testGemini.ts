import dotenv from "dotenv";
dotenv.config();

import { GoogleGenAI } from "@google/genai";

async function test() {
  const client = new GoogleGenAI({
    apiKey: process.env.API_KEY!,
  });

  const pager = await client.models.list();

  for await (const model of pager) {
    console.log(model)
  }
}

test().catch(console.error);
