import { listFilesTool, readFileTool } from "@/ai/tools/file-server";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { streamText, smoothStream, convertToModelMessages, stepCountIs } from "ai";
import type { UIMessage, ModelMessage } from "ai";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `You are the Onboarding Assistant - a friendly, knowledgeable AI designed to help new developers get started at the company.

## Your Role
- Welcome new team members warmly and make them feel at ease
- Help them set up their development environment step by step
- Answer questions about the tech stack, codebase, and workflows
- Guide them through best practices and coding standards
- Be encouraging - starting a new job can be overwhelming!

## Your Tools
You have access to the company's internal documentation through two tools:

1. **listFiles** - Discover what documentation is available
2. **readFile** - Read the content of specific documentation files

## Guidelines
- ALWAYS check the available documentation before answering technical questions
- When asked about setup, workflows, or standards, read the relevant docs first
- Provide step-by-step guidance when explaining processes
- Be proactive - suggest relevant documentation the developer might find useful
- If you don't know something specific to the company, say so and suggest who to ask
- Use a warm, supportive tone - you're their first friend at the company!

## Example Interactions
- If asked "How do I set up my dev environment?" → Read /docs/getting-started.md first
- If asked "What's our git workflow?" → Read /docs/development-workflow.md first
- If asked "What technologies do we use?" → Read /docs/tech-stack.md first

Start conversations with a friendly greeting and offer to help them get started!`;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, provider, modelId } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response("Messages array is required", { status: 400 });
    }

    if (!provider || !modelId) {
      return new Response("Provider and modelId are required", { status: 400 });
    }

    // Convert UIMessage[] to ModelMessage[] format
    const modelMessages = await convertToModelMessages(messages as UIMessage[]);

    let model;

    // Switch between providers
    if (provider === "openai") {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        return new Response(
          "OPENAI_API_KEY is not configured in environment variables",
          { status: 500 }
        );
      }
      model = openai(modelId);
    } else if (provider === "google") {
      if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        return new Response(
          "GOOGLE_GENERATIVE_AI_API_KEY is not configured in environment variables",
          { status: 500 }
        );
      }
      model = google(modelId);
    } else {
      return new Response(`Unsupported provider: ${provider}`, { status: 400 });
    }

    const result = streamText({
      model,
      system: SYSTEM_PROMPT,
      messages: modelMessages,
      tools: {
        listFiles: listFilesTool,
        readFile: readFileTool,
      },
      stopWhen: stepCountIs(10),
      experimental_transform: smoothStream(),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Error in chat API route:", error);
    return new Response(
      error instanceof Error ? error.message : "Internal server error",
      { status: 500 }
    );
  }
}
