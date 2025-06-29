import { memo, useState } from "react";
import MarkdownRenderer from "@/frontend/components/MemoizedMarkdown";
import { cn } from "@/lib/utils";
import { UIMessage } from "ai";
import equal from "fast-deep-equal";
import MessageControls from "./MessageControls";
import { UseChatHelpers } from "@ai-sdk/react";
import MessageEditor from "./MessageEditor";
import MessageReasoning from "./MessageReasoning";
import Image from "next/image";

function PureMessage({
  threadId,
  message,
  setMessages,
  reload,
  isStreaming,
  registerRef,
  stop,
  append,
}: {
  threadId: string;
  message: UIMessage;
  setMessages: UseChatHelpers["setMessages"];
  reload: UseChatHelpers["reload"];
  isStreaming: boolean;
  registerRef: (id: string, ref: HTMLDivElement | null) => void;
  stop: UseChatHelpers["stop"];
  append: UseChatHelpers["append"];
}) {
  const [mode, setMode] = useState<"view" | "edit">("view");

  return (
    <div
      role="article"
      className={cn(
        "flex flex-col",
        message.role === "user" ? "items-end" : "items-start"
      )}
    >
      {message.parts.map((part, index) => {
        const { type } = part;
        const key = `message-${message.id}-part-${index}`;

        if (type === "reasoning") {
          return (
            <MessageReasoning
              key={key}
              reasoning={part.reasoning}
              id={message.id}
            />
          );
        }

        if (type === "text") {
          return message.role === "user" ? (
            <div
              key={key}
              className="relative group px-4 py-3 rounded-xl bg-secondary border border-secondary-foreground/2 max-w-[80%]"
              ref={(el) => registerRef(message.id, el)}
            >
              {mode === "edit" && (
                <MessageEditor
                  threadId={threadId}
                  message={message}
                  content={part.text}
                  setMessages={setMessages}
                  reload={reload}
                  setMode={setMode}
                  stop={stop}
                />
              )}
              {mode === "view" && (
                <p className="whitespace-pre-wrap">{part.text}</p>
              )}

              {mode === "view" && (
                <MessageControls
                  threadId={threadId}
                  content={part.text}
                  message={message}
                  setMode={setMode}
                  setMessages={setMessages}
                  reload={reload}
                  stop={stop}
                  append={append}
                />
              )}
            </div>
          ) : (
            <div key={key} className="flex gap-x-2">
              <Image
                src={"/barta-white.png"}
                width={100}
                height={100}
                alt="Bärta profilbild"
                className="rounded-full min-w-8 min-h-8 max-w-8 max-h-8 object-cover shadow-[0_0_0_1px_rgb(0,0,0,0.1)]"
              ></Image>
              <div className="group flex flex-col gap-2 w-full">
                <MarkdownRenderer content={part.text} id={message.id} />
                {!isStreaming && (
                  <MessageControls
                    threadId={threadId}
                    content={part.text}
                    message={message}
                    setMessages={setMessages}
                    reload={reload}
                    stop={stop}
                    append={append}
                  />
                )}
              </div>
            </div>
          );
        }
      })}
    </div>
  );
}

const PreviewMessage = memo(PureMessage, (prevProps, nextProps) => {
  if (prevProps.isStreaming !== nextProps.isStreaming) return false;
  if (prevProps.message.id !== nextProps.message.id) return false;
  if (!equal(prevProps.message.parts, nextProps.message.parts)) return false;
  return true;
});

PreviewMessage.displayName = "PreviewMessage";

export default PreviewMessage;
