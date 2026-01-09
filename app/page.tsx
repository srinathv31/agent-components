"use client";

import { useChat } from "@ai-sdk/react";
import { useMemo, useState } from "react";
import { DefaultChatTransport } from "ai";
import type { UIMessage, ToolUIPart, TextUIPart } from "ai";
import { ModelProvider, useModel } from "@/contexts/model-context";
import { getModelsByProvider } from "@/lib/models";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputProvider,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import {
  Tool,
  ToolHeader,
  ToolContent,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import {
  ModelSelector,
  ModelSelectorTrigger,
  ModelSelectorContent,
  ModelSelectorInput,
  ModelSelectorList,
  ModelSelectorEmpty,
  ModelSelectorGroup,
  ModelSelectorItem,
  ModelSelectorLogo,
  ModelSelectorName,
  ModelSelectorSeparator,
} from "@/components/ai-elements/model-selector";
import { Suggestions, Suggestion } from "@/components/ai-elements/suggestion";
import { Loader } from "@/components/ai-elements/loader";
import { Button } from "@/components/ui/button";
import { ChevronDownIcon, SparklesIcon, HandIcon } from "lucide-react";
import { ModeToggle } from "@/components/dark-mode-toggle";

const ONBOARDING_SUGGESTIONS = [
  "How do I set up my dev environment?",
  "What's our tech stack?",
  "Walk me through the git workflow",
  "What coding standards should I follow?",
  "Who should I reach out to for help?",
];

function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function HeroWelcome({
  onSuggestionClick,
}: {
  onSuggestionClick: (suggestion: string) => void;
}) {
  const greeting = getTimeBasedGreeting();

  return (
    <div className="flex h-full flex-col items-center justify-center px-4 text-center">
      <h1 className="mb-3 text-4xl font-bold tracking-tight">{greeting}!</h1>
      <p className="mb-2 text-xl text-muted-foreground">Welcome to the team</p>
      <p className="mb-8 max-w-md text-muted-foreground">
        I&apos;m your Onboarding Assistant. I&apos;m here to help you get
        started with everything you need — from setting up your environment to
        understanding our workflows.
      </p>

      <div className="mb-4 text-sm font-medium text-muted-foreground">
        Try asking me about:
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {ONBOARDING_SUGGESTIONS.map((suggestion) => (
          <Suggestion
            key={suggestion}
            suggestion={suggestion}
            onClick={onSuggestionClick}
            className="text-sm"
          />
        ))}
      </div>
    </div>
  );
}

function ChatMessages({
  messages,
  status,
}: {
  messages: UIMessage[];
  status: string;
}) {
  return (
    <ConversationContent className="max-w-3xl mx-auto w-full">
      {messages.map((message) => (
        <Message key={message.id} from={message.role}>
          {message.parts.map((part, index) => {
            // Handle text parts
            if (part.type === "text") {
              const textPart = part as TextUIPart;
              return (
                <MessageContent key={index}>
                  <MessageResponse>{textPart.text}</MessageResponse>
                </MessageContent>
              );
            }

            // Handle tool parts
            if (part.type.startsWith("tool-")) {
              const toolPart = part as ToolUIPart;
              const toolName = part.type.replace("tool-", "");

              return (
                <Tool
                  key={index}
                  defaultOpen={
                    toolPart.state === "input-available" ||
                    toolPart.state === "output-error"
                  }
                >
                  <ToolHeader
                    title={
                      toolName === "listFiles"
                        ? "Listing Files"
                        : `Reading ${
                            (
                              toolPart as ToolUIPart & {
                                input?: { filePath?: string };
                              }
                            ).input?.filePath || "file"
                          }`
                    }
                    type={toolPart.type}
                    state={toolPart.state}
                  />
                  <ToolContent>
                    {"input" in toolPart && toolPart.input ? (
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      <ToolInput input={toolPart.input as any} />
                    ) : null}
                    {"output" in toolPart || "errorText" in toolPart ? (
                      <ToolOutput
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        output={toolPart.output as any}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        errorText={toolPart.errorText as any}
                      />
                    ) : null}
                  </ToolContent>
                </Tool>
              );
            }

            return null;
          })}

          {/* Show loader for assistant messages that are streaming */}
          {message.role === "assistant" &&
            status === "streaming" &&
            message === messages[messages.length - 1] &&
            message.parts.length === 0 && (
              <MessageContent>
                <Loader size={16} />
              </MessageContent>
            )}
        </Message>
      ))}

      {/* Show loader when submitted but no response yet */}
      {status === "submitted" && (
        <Message from="assistant">
          <MessageContent>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader size={16} />
              <span className="text-sm">Thinking...</span>
            </div>
          </MessageContent>
        </Message>
      )}
    </ConversationContent>
  );
}

function OnboardingChat() {
  const { selectedModel, setSelectedModel } = useModel();
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false);

  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/chat" }),
    []
  );

  const { messages, status, sendMessage } = useChat({ transport });

  const openaiModels = getModelsByProvider("openai");
  const googleModels = getModelsByProvider("google");
  const hasMessages = messages.length > 0;

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(
      { text: suggestion },
      {
        body: {
          provider: selectedModel.provider,
          modelId: selectedModel.id,
        },
      }
    );
  };

  const handleSubmit = async (message: { text: string }) => {
    if (!message.text.trim()) return;

    sendMessage(
      { text: message.text },
      {
        body: {
          provider: selectedModel.provider,
          modelId: selectedModel.id,
        },
      }
    );
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <SparklesIcon className="size-5 text-primary" />
          <h1 className="text-lg font-semibold">Welcome Station</h1>
        </div>

        <div className="flex items-center gap-2">
          <ModelSelector
            open={modelSelectorOpen}
            onOpenChange={setModelSelectorOpen}
          >
            <ModelSelectorTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <ModelSelectorLogo provider={selectedModel.provider} />
                <span className="hidden sm:inline">{selectedModel.name}</span>
                <ChevronDownIcon className="size-4 opacity-50" />
              </Button>
            </ModelSelectorTrigger>
            <ModelSelectorContent>
              <ModelSelectorInput placeholder="Search models..." />
              <ModelSelectorList>
                <ModelSelectorEmpty>No models found.</ModelSelectorEmpty>
                {openaiModels.length > 0 && (
                  <ModelSelectorGroup heading="OpenAI">
                    {openaiModels.map((model) => (
                      <ModelSelectorItem
                        key={model.id}
                        onSelect={() => {
                          setSelectedModel(model);
                          setModelSelectorOpen(false);
                        }}
                        className="cursor-pointer"
                      >
                        <ModelSelectorLogo provider="openai" />
                        <ModelSelectorName>{model.name}</ModelSelectorName>
                        {model.description && (
                          <span className="text-xs text-muted-foreground">
                            {model.description}
                          </span>
                        )}
                      </ModelSelectorItem>
                    ))}
                  </ModelSelectorGroup>
                )}
                {googleModels.length > 0 && (
                  <>
                    {openaiModels.length > 0 && <ModelSelectorSeparator />}
                    <ModelSelectorGroup heading="Google">
                      {googleModels.map((model) => (
                        <ModelSelectorItem
                          key={model.id}
                          onSelect={() => {
                            setSelectedModel(model);
                            setModelSelectorOpen(false);
                          }}
                          className="cursor-pointer"
                        >
                          <ModelSelectorLogo provider="google" />
                          <ModelSelectorName>{model.name}</ModelSelectorName>
                          {model.description && (
                            <span className="text-xs text-muted-foreground">
                              {model.description}
                            </span>
                          )}
                        </ModelSelectorItem>
                      ))}
                    </ModelSelectorGroup>
                  </>
                )}
              </ModelSelectorList>
            </ModelSelectorContent>
          </ModelSelector>

          <ModeToggle />
        </div>
      </header>

      {/* Main Content */}
      <Conversation className="flex-1">
        {hasMessages ? (
          <ChatMessages messages={messages} status={status} />
        ) : (
          <HeroWelcome onSuggestionClick={handleSuggestionClick} />
        )}
        <ConversationScrollButton />
      </Conversation>

      {/* Input Area */}
      <div className="shrink-0 border-t bg-linear-to-t from-background to-background/80 p-4">
        <div className="mx-auto max-w-3xl">
          {/* Show suggestions when there are messages */}
          {hasMessages && (
            <div className="mb-3">
              <Suggestions>
                {ONBOARDING_SUGGESTIONS.slice(0, 3).map((suggestion) => (
                  <Suggestion
                    key={suggestion}
                    suggestion={suggestion}
                    onClick={handleSuggestionClick}
                    className="text-xs"
                  />
                ))}
              </Suggestions>
            </div>
          )}

          <PromptInput onSubmit={handleSubmit}>
            <PromptInputFooter>
              <PromptInputTextarea
                placeholder="Ask me anything about getting started..."
                disabled={status === "streaming" || status === "submitted"}
              />
              <PromptInputSubmit
                status={
                  status as "streaming" | "submitted" | "error" | undefined
                }
                disabled={status === "streaming" || status === "submitted"}
              />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <ModelProvider>
      <PromptInputProvider>
        <OnboardingChat />
      </PromptInputProvider>
    </ModelProvider>
  );
}
