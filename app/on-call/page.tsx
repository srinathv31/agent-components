"use client";

import { useChat } from "@ai-sdk/react";
import * as aiHelpers from "ai";
import {
  DefaultChatTransport,
  type UIMessage,
  type ToolUIPart,
  type TextUIPart,
} from "ai";
import { useMemo, useState } from "react";
import {
  ChevronDownIcon,
  PlayIcon,
  RotateCcwIcon,
  AlertTriangleIcon,
} from "lucide-react";
import { ModelProvider, useModel } from "@/contexts/model-context";
import { getModelsByProvider } from "@/lib/models";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
  ConversationEmptyState,
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
  Confirmation,
  ConfirmationTitle,
  ConfirmationRequest,
  ConfirmationActions,
  ConfirmationAction,
  ConfirmationAccepted,
  ConfirmationRejected,
} from "@/components/ai-elements/confirmation";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ModeToggle } from "@/components/dark-mode-toggle";

type EventItem =
  | {
      kind: "tool";
      messageIndex: number;
      partIndex: number;
      toolName: string;
      state: ToolUIPart["state"];
      input?: unknown;
      output?: unknown;
      errorText?: string;
      at?: string;
    }
  | {
      kind: "note";
      messageIndex: number;
      partIndex: number;
      text: string;
    };

function useOnCallEvents(messages: UIMessage[]): EventItem[] {
  return useMemo(() => {
    const events: EventItem[] = [];
    messages.forEach((message, messageIndex) => {
      message.parts.forEach((part, partIndex) => {
        if (part.type === "text" && message.role === "assistant") {
          const t = part as TextUIPart;
          const text = String(t.text ?? "").trim();
          if (text) {
            events.push({ kind: "note", messageIndex, partIndex, text });
          }
        }
        if (part.type.startsWith("tool-")) {
          const toolPart = part as ToolUIPart;
          const toolName = toolPart.type.replace("tool-", "");
          const input = "input" in toolPart ? toolPart.input : undefined;
          const output = "output" in toolPart ? toolPart.output : undefined;
          const errorText =
            "errorText" in toolPart ? toolPart.errorText : undefined;

          const at =
            (typeof output === "object" &&
              output &&
              "at" in (output as Record<string, unknown>) &&
              typeof (output as Record<string, unknown>).at === "string" &&
              ((output as Record<string, unknown>).at as string)) ||
            undefined;

          events.push({
            kind: "tool",
            messageIndex,
            partIndex,
            toolName,
            state: toolPart.state,
            input,
            output,
            errorText,
            at,
          });
        }
      });
    });
    return events;
  }, [messages]);
}

const asRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;

function OnCallConversation({
  messages,
  addToolApprovalResponse,
}: {
  messages: UIMessage[];
  addToolApprovalResponse?: (args: {
    id: string;
    approved: boolean;
    reason?: string;
  }) => void;
}) {
  return (
    <ConversationContent className="max-w-3xl mx-auto w-full">
      {messages.length === 0 ? (
        <ConversationEmptyState
          title="On-Call Servicing Agent"
          description="Click Start to run the 3am incident scenario, then chat with the agent."
        />
      ) : (
        messages.map((message, index) => (
          <Message from={message.role} key={index}>
            <MessageContent>
              {message.parts.map((part, i) => {
                if (part.type === "text") {
                  const textPart = part as TextUIPart;
                  return (
                    <MessageResponse key={`${message.role}-text-${i}`}>
                      {textPart.text}
                    </MessageResponse>
                  );
                }

                if (part.type.startsWith("tool-")) {
                  const toolPart = part as ToolUIPart;
                  const toolName = toolPart.type.replace("tool-", "");

                  // Special-case: approval-gated tool
                  if (toolName === "sendF5RedirectEmail") {
                    const approval =
                      (
                        toolPart as unknown as {
                          approval?: {
                            id: string;
                            approved?: boolean;
                            reason?: string;
                          };
                        }
                      ).approval ?? undefined;
                    const toolId = (toolPart as unknown as { id: string }).id;
                    const approvalForUi =
                      approval && typeof approval.approved === "boolean"
                        ? {
                            id: approval.id,
                            approved: approval.approved,
                            reason: approval.reason,
                          }
                        : { id: approval?.id ?? toolId };
                    const approvalId = approvalForUi.id;

                    return (
                      <div
                        key={`${message.role}-tool-${i}`}
                        className="space-y-3"
                      >
                        <Tool defaultOpen>
                          <ToolHeader
                            title={toolName}
                            type={toolPart.type}
                            state={toolPart.state}
                          />
                          <ToolContent>
                            {"input" in toolPart && toolPart.input ? (
                              <ToolInput
                                input={toolPart.input as ToolUIPart["input"]}
                              />
                            ) : null}
                            {"output" in toolPart || "errorText" in toolPart ? (
                              <ToolOutput
                                output={
                                  "output" in toolPart
                                    ? (toolPart.output as ToolUIPart["output"])
                                    : undefined
                                }
                                errorText={
                                  "errorText" in toolPart
                                    ? toolPart.errorText
                                    : undefined
                                }
                              />
                            ) : null}
                          </ToolContent>
                        </Tool>

                        <Confirmation
                          approval={approvalForUi}
                          state={toolPart.state}
                          className="border-yellow-200 bg-yellow-50/50 dark:border-yellow-900 dark:bg-yellow-950/50"
                        >
                          <ConfirmationTitle className="font-medium">
                            Human approval required
                          </ConfirmationTitle>
                          <ConfirmationRequest>
                            <div className="text-sm text-muted-foreground">
                              The agent is ready to send the F5 redirect email
                              to mitigate customer impact. Approve or deny.
                            </div>
                            <ConfirmationActions>
                              <ConfirmationAction
                                variant="secondary"
                                onClick={() => {
                                  if (!addToolApprovalResponse) return;
                                  addToolApprovalResponse({
                                    id: approvalId,
                                    approved: false,
                                    reason: "Denied by on-call",
                                  });
                                }}
                              >
                                Deny
                              </ConfirmationAction>
                              <ConfirmationAction
                                onClick={() => {
                                  if (!addToolApprovalResponse) return;
                                  addToolApprovalResponse({
                                    id: approvalId,
                                    approved: true,
                                  });
                                }}
                              >
                                Approve & Send
                              </ConfirmationAction>
                            </ConfirmationActions>
                          </ConfirmationRequest>
                          <ConfirmationAccepted>
                            <div className="text-sm">
                              Approved. The agent sent the email and is
                              continuing mitigation.
                            </div>
                          </ConfirmationAccepted>
                          <ConfirmationRejected>
                            <div className="text-sm">
                              Denied. The agent will page a human and propose
                              alternatives.
                            </div>
                          </ConfirmationRejected>
                        </Confirmation>
                      </div>
                    );
                  }

                  // Default tool rendering
                  return (
                    <Tool key={`${message.role}-tool-${i}`} defaultOpen={false}>
                      <ToolHeader
                        title={toolName}
                        type={toolPart.type}
                        state={toolPart.state}
                      />
                      <ToolContent>
                        {"input" in toolPart && toolPart.input ? (
                          <ToolInput
                            input={toolPart.input as ToolUIPart["input"]}
                          />
                        ) : null}
                        {"output" in toolPart || "errorText" in toolPart ? (
                          <ToolOutput
                            output={
                              "output" in toolPart
                                ? (toolPart.output as ToolUIPart["output"])
                                : undefined
                            }
                            errorText={
                              "errorText" in toolPart
                                ? toolPart.errorText
                                : undefined
                            }
                          />
                        ) : null}
                      </ToolContent>
                    </Tool>
                  );
                }

                return null;
              })}
            </MessageContent>
          </Message>
        ))
      )}
    </ConversationContent>
  );
}

type ChatStatus = "ready" | "submitted" | "streaming" | "error";

type SendMessageOptions = {
  body: {
    provider: string;
    modelId: string;
  };
};

type UseChatShape = {
  messages: UIMessage[];
  status: ChatStatus;
  sendMessage: (
    message: { text: string },
    options?: SendMessageOptions
  ) => void;
  addToolApprovalResponse?: (args: {
    id: string;
    approved: boolean;
    reason?: string;
  }) => void;
};

function AgentDemoSession({ onReset }: { onReset: () => void }) {
  const { selectedModel, setSelectedModel } = useModel();
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false);

  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/oncall" }),
    []
  );

  const sendAutomaticallyWhen =
    (aiHelpers as unknown as Record<string, unknown>)
      .lastAssistantMessageIsCompleteWithApprovalResponses ?? undefined;

  // addToolApprovalResponse is only present when tool-approval is supported.
  const chat = useChat({
    transport,
    // @ts-expect-error - helper may not exist in current types
    sendAutomaticallyWhen,
  }) as unknown as UseChatShape;

  const messages = chat.messages ?? [];
  const status = chat.status ?? "ready";
  const sendMessage = chat.sendMessage;
  const addToolApprovalResponse = chat.addToolApprovalResponse;

  const events = useOnCallEvents(messages);

  const openaiModels = getModelsByProvider("openai");
  const googleModels = getModelsByProvider("google");

  const incidentBadge = useMemo(() => {
    const lastSnapshot = [...events]
      .reverse()
      .find((e) => e.kind === "tool" && e.toolName === "getDynatraceSnapshot");
    const lastSnapshotPhase =
      lastSnapshot?.kind === "tool"
        ? asRecord(lastSnapshot.output)?.phase
        : undefined;

    const awaitingApproval = events.some(
      (e) =>
        e.kind === "tool" &&
        e.toolName === "sendF5RedirectEmail" &&
        e.state === "approval-requested"
    );
    const hasPaging = events.some(
      (e) => e.kind === "tool" && e.toolName === "pageHumanOnCall"
    );
    const hasEmailSent = events.some(
      (e) =>
        e.kind === "tool" &&
        e.toolName === "sendF5RedirectEmail" &&
        e.state === "output-available"
    );
    if (lastSnapshotPhase === "resolved")
      return { label: "Resolved", variant: "secondary" as const };
    if (awaitingApproval)
      return { label: "Awaiting Approval", variant: "secondary" as const };
    if (hasEmailSent || lastSnapshotPhase === "rerouted")
      return { label: "Mitigating", variant: "secondary" as const };
    if (hasPaging)
      return { label: "Human Paged", variant: "destructive" as const };
    if (messages.length > 0)
      return { label: "Monitoring", variant: "secondary" as const };
    return { label: "Idle", variant: "outline" as const };
  }, [events, messages.length]);

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <AlertTriangleIcon className="size-5 text-yellow-600" />
          <h1 className="text-lg font-semibold">On-Call Servicing Agent</h1>
          <Badge variant={incidentBadge.variant}>{incidentBadge.label}</Badge>
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
                        </ModelSelectorItem>
                      ))}
                    </ModelSelectorGroup>
                  </>
                )}
              </ModelSelectorList>
            </ModelSelectorContent>
          </ModelSelector>

          <Button
            size="sm"
            variant="secondary"
            className="gap-2"
            disabled={status === "streaming" || status === "submitted"}
            onClick={() => {
              sendMessage(
                {
                  text: "Start the 3am incident response demo. Follow your runbook: check Dynatrace, take least-risk actions first, and only page a human when approval is required.",
                },
                {
                  body: {
                    provider: selectedModel.provider,
                    modelId: selectedModel.id,
                  },
                }
              );
            }}
          >
            <PlayIcon className="size-4" />
            Start
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            onClick={onReset}
          >
            <RotateCcwIcon className="size-4" />
            Reset
          </Button>

          <ModeToggle />
        </div>
      </header>

      {/* Main Content Area with Event Log Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat Area */}
        <main className="flex flex-1 flex-col overflow-hidden">
          <Conversation className="flex-1">
            <OnCallConversation
              messages={messages}
              addToolApprovalResponse={addToolApprovalResponse}
            />
            <ConversationScrollButton />
          </Conversation>

          {/* Input Area */}
          <div className="shrink-0 border-t bg-linear-to-t from-background to-background/80 p-4">
            <div className="mx-auto max-w-3xl">
              <PromptInput
                onSubmit={async (message) => {
                  sendMessage(
                    { text: message.text },
                    {
                      body: {
                        provider: selectedModel.provider,
                        modelId: selectedModel.id,
                      },
                    }
                  );
                }}
              >
                <PromptInputFooter>
                  <PromptInputTextarea
                    placeholder="Ask the agent what happened, why it chose an action, or what to do next..."
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
        </main>

        {/* Event Log Sidebar */}
        <aside className="w-80 shrink-0 border-l bg-muted/30 hidden lg:flex flex-col">
          <div className="p-4 border-b">
            <div className="text-sm font-medium">Event Log</div>
          </div>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {events.length === 0 ? (
                <div className="text-muted-foreground text-sm py-6 text-center">
                  No events yet
                </div>
              ) : (
                events.map((e, idx) => {
                  if (e.kind === "note") {
                    const title =
                      e.text.split("\n").find(Boolean)?.slice(0, 80) ?? "Note";
                    return (
                      <Card key={idx} className="p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-sm font-medium">
                            Investigation Notes
                          </div>
                          <Badge variant="secondary">assistant</Badge>
                        </div>
                        <div className="mt-2 text-sm text-muted-foreground line-clamp-4 whitespace-pre-wrap">
                          {title}
                        </div>
                      </Card>
                    );
                  }

                  const isApproval = e.toolName === "sendF5RedirectEmail";
                  const isPaging = e.toolName === "pageHumanOnCall";
                  const isSnapshot = e.toolName === "getDynatraceSnapshot";

                  return (
                    <Card key={idx} className="p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-medium">
                          {isSnapshot
                            ? "Dynatrace Snapshot"
                            : isPaging
                            ? "Pager"
                            : isApproval
                            ? "F5 Redirect Email"
                            : e.toolName}
                        </div>
                        <Badge variant={isPaging ? "destructive" : "secondary"}>
                          {e.state}
                        </Badge>
                      </div>
                      {e.at && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          {e.at}
                        </div>
                      )}
                      {isSnapshot &&
                      typeof e.output === "object" &&
                      e.output ? (
                        <div className="mt-2 text-sm text-muted-foreground space-y-1">
                          <div>
                            {String(
                              asRecord(asRecord(e.output)?.health)?.summary ??
                                ""
                            )}
                          </div>
                          <div className="text-xs">
                            phase: {String(asRecord(e.output)?.phase ?? "")} ·
                            errorRate:{" "}
                            {String(
                              asRecord(asRecord(e.output)?.metrics)
                                ?.errorRatePct ?? ""
                            )}
                            % · p95:{" "}
                            {String(
                              asRecord(asRecord(e.output)?.metrics)
                                ?.p95LatencyMs ?? ""
                            )}
                            ms
                          </div>
                        </div>
                      ) : null}
                      {isApproval &&
                      typeof e.output === "object" &&
                      e.output &&
                      "ticketId" in (e.output as Record<string, unknown>) ? (
                        <div className="mt-2 text-sm text-muted-foreground">
                          Change ticket:{" "}
                          {String(asRecord(e.output)?.ticketId ?? "")}
                        </div>
                      ) : null}
                      {isPaging &&
                      typeof e.output === "object" &&
                      e.output &&
                      "pageId" in (e.output as Record<string, unknown>) ? (
                        <div className="mt-2 text-sm text-muted-foreground">
                          Paged human (id:{" "}
                          {String(asRecord(e.output)?.pageId ?? "")})
                        </div>
                      ) : null}
                    </Card>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </aside>
      </div>
    </div>
  );
}

export default function OnCallPage() {
  const [sessionKey, setSessionKey] = useState(0);
  return (
    <ModelProvider>
      <PromptInputProvider>
        <AgentDemoSession
          key={sessionKey}
          onReset={() => setSessionKey((k) => k + 1)}
        />
      </PromptInputProvider>
    </ModelProvider>
  );
}
