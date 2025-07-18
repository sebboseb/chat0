import { ChevronDown, Check, ArrowUpIcon, Paperclip } from "lucide-react";
import { memo, useCallback, useMemo } from "react";
import { Textarea } from "@/frontend/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Button } from "@/frontend/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/frontend/components/ui/dropdown-menu";
import useAutoResizeTextarea from "@/hooks/useAutoResizeTextArea";
import { UseChatHelpers, useCompletion } from "@ai-sdk/react";
import { useParams } from "react-router";
import { useNavigate } from "react-router";
import { createMessage, createThread } from "@/frontend/dexie/queries";
import { useAPIKeyStore } from "@/frontend/stores/APIKeyStore";
import { useModelStore } from "@/frontend/stores/ModelStore";
import { AI_MODELS, AIModel, getModelConfig } from "@/lib/models";
import KeyPrompt from "@/frontend/components/KeyPrompt";
import { UIMessage } from "ai";
import { v4 as uuidv4 } from "uuid";
import { StopIcon } from "./ui/icons";
import { toast } from "sonner";
import { useMessageSummary } from "../hooks/useMessageSummary";
import { Input } from "./ui/input";

interface ChatInputProps {
  threadId: string;
  input: UseChatHelpers["input"];
  status: UseChatHelpers["status"];
  setInput: UseChatHelpers["setInput"];
  append: UseChatHelpers["append"];
  stop: UseChatHelpers["stop"];
}

interface StopButtonProps {
  stop: UseChatHelpers["stop"];
}

interface SendButtonProps {
  onSubmit: () => void;
  disabled: boolean;
}

const createUserMessage = (id: string, text: string): UIMessage => ({
  id,
  parts: [{ type: "text", text }],
  role: "user",
  content: text,
  createdAt: new Date(),
});

function PureChatInput({
  threadId,
  input,
  status,
  setInput,
  append,
  stop,
}: ChatInputProps) {
  const canChat = useAPIKeyStore((state) => state.hasRequiredKeys());

  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 48,
    maxHeight: 200,
  });

  const navigate = useNavigate();
  const { id } = useParams();

  const isDisabled = useMemo(
    () => !input.trim() || status === "streaming" || status === "submitted",
    [input, status]
  );

  const { complete } = useMessageSummary();

  const handleSubmit = useCallback(async () => {
    const currentInput = textareaRef.current?.value || input;

    if (
      !currentInput.trim() ||
      status === "streaming" ||
      status === "submitted"
    )
      return;

    const messageId = uuidv4();

    if (!id) {
      navigate(`/chat/${threadId}`);
      await createThread(threadId);
      complete(currentInput.trim(), {
        body: { threadId, messageId, isTitle: true },
      });
    } else {
      complete(currentInput.trim(), { body: { messageId, threadId } });
    }

    const userMessage = createUserMessage(messageId, currentInput.trim());
    await createMessage(threadId, userMessage);

    append(userMessage);
    setInput("");
    adjustHeight(true);
  }, [
    input,
    status,
    setInput,
    adjustHeight,
    append,
    id,
    textareaRef,
    threadId,
    complete,
  ]);

  if (!canChat) {
    return <KeyPrompt />;
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    adjustHeight();
  };

  return (
    // <div className="fixed bottom-0 w-full max-w-3xl">
    //   <div className="bg-secondary rounded-t-[20px] p-2 pb-0 w-full">
    //     <div className="relative">
    //       <div className="flex flex-col">
    //         <div className="bg-secondary overflow-y-auto max-h-[300px]">
    //           <Textarea
    //             id="chat-input"
    //             value={input}
    //             placeholder="What can I do for you?"
    //             className={cn(
    //               "w-full px-4 py-3 border-none shadow-none dark:bg-transparent",
    //               "placeholder:text-muted-foreground resize-none",
    //               "focus-visible:ring-0 focus-visible:ring-offset-0",
    //               "scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/30",
    //               "scrollbar-thumb-rounded-full",
    //               "min-h-[72px]"
    //             )}
    //             ref={textareaRef}
    //             onKeyDown={handleKeyDown}
    //             onChange={handleInputChange}
    //             aria-label="Chat message input"
    //             aria-describedby="chat-input-description"
    //           />
    //           <span id="chat-input-description" className="sr-only">
    //             Press Enter to send, Shift+Enter for new line
    //           </span>
    //         </div>

    //         <div className="h-14 flex items-center px-2">
    //           <div className="flex items-center justify-between w-full">
    //             <ChatModelDropdown />

    //             {status === "submitted" || status === "streaming" ? (
    //               <StopButton stop={stop} />
    //             ) : (
    //               <SendButton onSubmit={handleSubmit} disabled={isDisabled} />
    //             )}
    //           </div>
    //         </div>
    //       </div>
    //     </div>
    //   </div>
    // </div>
    <form
      onSubmit={handleSubmit}
      className={`w-full flex justify-center fixed bottom-6 max-w-3xl`}
    >
      <div className="w-full max-w-4xl relative">
        <div className="bg-secondary rounded-[20px] p-2  w-full">
          <div className="relative">
            <div className="flex flex-col">
              <div className="bg-secondary overflow-y-auto max-h-[200px]">
                <Textarea
                  value={input}
                  ref={textareaRef}
                  onKeyDown={handleKeyDown}
                  onChange={handleInputChange}
                  aria-label="Chat message input"
                  aria-describedby="chat-input-description"
                  placeholder={"Ställ en fråga..."}
                  className={cn(
                    "w-full px-4 py-3 border-none shadow-none dark:bg-transparent",
                    "placeholder:text-muted-foreground resize-none",
                    "focus-visible:ring-0 focus-visible:ring-offset-0",
                    "scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/30",
                    "scrollbar-thumb-rounded-full",
                    "min-h-[52px]"
                    // `transition-all duration-200 bg-accent pr-24 pl-4`
                  )}
                />
              </div>
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                {/* <button
                  disabled={isDisabled}
                  type="button"
                  className="rounded-full text-black p-2 hover:bg-neutral-100"
                >
                  <Paperclip className="rotate-[135deg]" size={24} />
                </button> */}
                <div className="flex items-center justify-between w-full">
                  {/* <ChatModelDropdown /> */}

                  {status === "submitted" || status === "streaming" ? (
                    <StopButton stop={stop} />
                  ) : (
                    <SendButton onSubmit={handleSubmit} disabled={isDisabled} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

const ChatInput = memo(PureChatInput, (prevProps, nextProps) => {
  if (prevProps.input !== nextProps.input) return false;
  if (prevProps.status !== nextProps.status) return false;
  return true;
});

const PureChatModelDropdown = () => {
  const getKey = useAPIKeyStore((state) => state.getKey);
  const { selectedModel, setModel } = useModelStore();

  const isModelEnabled = useCallback(
    (model: AIModel) => {
      const modelConfig = getModelConfig(model);
      const apiKey = getKey(modelConfig.provider);
      return !!apiKey;
    },
    [getKey]
  );

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex items-center gap-1 h-8 pl-2 pr-2 text-xs rounded-md text-foreground hover:bg-primary/10 focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-blue-500"
            aria-label={`Selected model: ${selectedModel}`}
          >
            <div className="flex items-center gap-1">
              {selectedModel}
              <ChevronDown className="w-3 h-3 opacity-50" />
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className={cn("min-w-[10rem]", "border-border", "bg-popover")}
        >
          {AI_MODELS.map((model) => {
            const isEnabled = isModelEnabled(model);
            return (
              <DropdownMenuItem
                key={model}
                onSelect={() => isEnabled && setModel(model)}
                disabled={!isEnabled}
                className={cn(
                  "flex items-center justify-between gap-2",
                  "cursor-pointer"
                )}
              >
                <span>{model}</span>
                {selectedModel === model && (
                  <Check
                    className="w-4 h-4 text-blue-500"
                    aria-label="Selected"
                  />
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

const ChatModelDropdown = memo(PureChatModelDropdown);

function PureStopButton({ stop }: StopButtonProps) {
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={stop}
      aria-label="Stop generating response"
    >
      <StopIcon size={20} />
    </Button>
  );
}

const StopButton = memo(PureStopButton);

const PureSendButton = ({ onSubmit, disabled }: SendButtonProps) => {
  return (
    <Button
      onClick={onSubmit}
      variant="default"
      size="icon"
      disabled={disabled}
      aria-label="Send message"
    >
      <ArrowUpIcon size={18} />
    </Button>
  );
};

const SendButton = memo(PureSendButton, (prevProps, nextProps) => {
  return prevProps.disabled === nextProps.disabled;
});

export default ChatInput;
