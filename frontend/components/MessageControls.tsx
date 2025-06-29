import { Dispatch, SetStateAction, useState } from "react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { Check, Copy, HandHelping, RefreshCcw, SquarePen } from "lucide-react";
import { UIMessage } from "ai";
import { UseChatHelpers } from "@ai-sdk/react";
import {
  deleteTrailingMessages,
  createMessage,
} from "@/frontend/dexie/queries";
import { useAPIKeyStore } from "@/frontend/stores/APIKeyStore";
import { v4 as uuidv4 } from "uuid";

interface MessageControlsProps {
  threadId: string;
  message: UIMessage;
  setMessages: UseChatHelpers["setMessages"];
  content: string;
  setMode?: Dispatch<SetStateAction<"view" | "edit">>;
  reload: UseChatHelpers["reload"];
  stop: UseChatHelpers["stop"];
  append: UseChatHelpers["append"];
}

export default function MessageControls({
  threadId,
  message,
  setMessages,
  content,
  setMode,
  reload,
  stop,
}: MessageControlsProps) {
  const [copied, setCopied] = useState(false);
  const hasRequiredKeys = useAPIKeyStore((state) => state.hasRequiredKeys());

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const handleRegenerate = async () => {
    // stop the current request
    stop();

    if (message.role === "user") {
      await deleteTrailingMessages(threadId, message.createdAt as Date, false);

      setMessages((messages) => {
        const index = messages.findIndex((m) => m.id === message.id);

        if (index !== -1) {
          return [...messages.slice(0, index + 1)];
        }

        return messages;
      });
    } else {
      await deleteTrailingMessages(threadId, message.createdAt as Date);

      setMessages((messages) => {
        const index = messages.findIndex((m) => m.id === message.id);

        if (index !== -1) {
          return [...messages.slice(0, index)];
        }

        return messages;
      });
    }

    setTimeout(() => {
      reload();
    }, 0);
  };

  async function handleAskForMore() {
    stop();

    setMessages((messages) => {
      const index = messages.findIndex((m) => m.id === message.id);

      if (index !== -1) {
        const isLatestMessage = index === messages.length - 1;
        const quotedContent = isLatestMessage
          ? "Förklara mer tack"
          : `> ${content.slice(0, 50)}... < \n\nFörklara mer tack`;
        const newMessage: UIMessage = {
          id: uuidv4(),
          content: quotedContent,
          role: "user",
          createdAt: new Date(),
          parts: [{ type: "text", text: quotedContent }],
        };

        createMessage(threadId, newMessage);
        return [...messages.slice(0, index + 1), newMessage];
      }

      return messages;
    });

    setTimeout(() => {
      reload();
    }, 0);
  }

  return (
    <div
      className={cn(
        "opacity-0 group-hover:opacity-100 transition-opacity duration-100 flex gap-1",
        {
          "absolute mt-5 right-2": message.role === "user",
        }
      )}
    >
      <Button variant="ghost" size="icon" onClick={handleCopy}>
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      </Button>
      {setMode && hasRequiredKeys && (
        <Button variant="ghost" size="icon" onClick={() => setMode("edit")}>
          <SquarePen className="w-4 h-4" />
        </Button>
      )}
      {hasRequiredKeys && (
        <Button variant="ghost" size="icon" onClick={handleRegenerate}>
          <RefreshCcw className="w-4 h-4" />
        </Button>
      )}
      {hasRequiredKeys && message.role === "assistant" && (
        <Button variant="ghost" size="icon" onClick={handleAskForMore}>
          <HandHelping className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}
