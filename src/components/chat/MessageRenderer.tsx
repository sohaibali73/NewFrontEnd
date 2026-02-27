'use client';

import React from 'react';
import { CopyIcon, ThumbsUpIcon, ThumbsDownIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// AI Elements
import { Reasoning, ReasoningTrigger, ReasoningContent } from '@/components/ai-elements/reasoning';
import { Shimmer } from '@/components/ai-elements/shimmer';
import { Tool as AITool, ToolHeader, ToolContent, ToolInput, ToolOutput } from '@/components/ai-elements/tool';
import { Message as AIMessage, MessageContent, MessageActions, MessageAction } from '@/components/ai-elements/message';
import { MessageResponse } from '@/components/ai-elements/message';
import { Sources, SourcesTrigger, SourcesContent, Source } from '@/components/ai-elements/sources';
import { Attachments, Attachment, AttachmentPreview, AttachmentInfo } from '@/components/ai-elements/attachments';
import { Artifact, ArtifactHeader, ArtifactTitle, ArtifactContent } from '@/components/ai-elements/artifact';
import { DocumentGenerator } from '@/components/ai-elements/document-generator';
import { ChainOfThought, ChainOfThoughtHeader, ChainOfThoughtContent, ChainOfThoughtStep } from '@/components/ai-elements/chain-of-thought';
import { WebPreview, WebPreviewNavigation, WebPreviewBody, WebPreviewConsole } from '@/components/ai-elements/web-preview';
import { CodeBlock, CodeBlockHeader, CodeBlockTitle, CodeBlockActions, CodeBlockCopyButton } from '@/components/ai-elements/code-block';
import { Image as AIImage } from '@/components/ai-elements/image';
import { ArtifactRenderer } from '@/components/artifacts';
import { InlineReactPreview, stripReactCodeBlocks } from '@/components/InlineReactPreview';
import { ToolLoading } from '@/components/generative-ui';
import { renderRegisteredTool } from './tool-registry';

const logo = '/potomac-icon.png';

interface MessageRendererProps {
  message: {
    id: string;
    role: string;
    parts?: Array<{ type: string; [key: string]: unknown }>;
    createdAt?: Date;
  };
  isLast: boolean;
  isStreaming: boolean;
  status: string;
  isDark: boolean;
  userName: string;
  colors: Record<string, string>;
  onCopy: (text: string) => void;
  onDocumentGenerated: (artifact: unknown) => void;
}

/**
 * Memoized message renderer. Only re-renders when the message itself
 * changes (id, parts length, streaming state). Old messages in the list
 * are skipped entirely during token-by-token streaming.
 */
export const MessageRenderer = React.memo(function MessageRenderer({
  message,
  isLast,
  isStreaming,
  status,
  isDark,
  userName,
  colors,
  onCopy,
  onDocumentGenerated,
}: MessageRendererProps) {
  const parts = message.parts || [];
  const msgIsStreaming = isStreaming && isLast && message.role === 'assistant';
  const fullText = parts
    .filter((p) => p.type === 'text')
    .map((p) => (p as { text?: string }).text || '')
    .join('');

  const toolParts = parts.filter(
    (p) => p.type?.startsWith('tool-') || p.type === 'dynamic-tool'
  );
  const hasMultipleTools = toolParts.length >= 2;
  const sourceParts = parts.filter((p) => p.type === 'source-url');
  const hasSources = sourceParts.length > 0;

  return (
    <AIMessage key={message.id} from={message.role}>
      {/* Sender label */}
      <div
        className={cn(
          'flex items-center gap-2 text-xs',
          message.role === 'user' ? 'justify-end' : ''
        )}
      >
        {message.role === 'user' ? (
          <>
            <span className="font-medium text-muted-foreground">{userName}</span>
            {message.createdAt && (
              <span className="text-muted-foreground/60">
                {new Date(message.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            )}
          </>
        ) : (
          <>
            <img src={logo} alt="Yang AI" className="w-5 h-5 rounded flex-shrink-0" />
            <span className="font-semibold text-foreground">Yang</span>
            {message.createdAt && (
              <span className="text-muted-foreground/60">
                {new Date(message.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            )}
            {msgIsStreaming && <Shimmer duration={1.5}>Streaming...</Shimmer>}
          </>
        )}
      </div>

      <MessageContent>
        {/* Sources */}
        {hasSources && message.role === 'assistant' && !msgIsStreaming && (
          <Sources>
            <SourcesTrigger count={sourceParts.length} />
            <SourcesContent>
              {sourceParts.map((sourcePart: Record<string, unknown>, sIdx: number) => (
                <Source
                  key={`source-${sIdx}`}
                  href={sourcePart.url as string}
                  title={(sourcePart.title as string) || new URL(sourcePart.url as string).hostname}
                />
              ))}
            </SourcesContent>
          </Sources>
        )}

        {/* Chain of Thought for multi-tool sequences */}
        {hasMultipleTools && message.role === 'assistant' && !msgIsStreaming && (
          <ChainOfThought defaultOpen={false}>
            <ChainOfThoughtHeader>Used {toolParts.length} tools</ChainOfThoughtHeader>
            <ChainOfThoughtContent>
              {toolParts.map((tp: Record<string, unknown>, tIdx: number) => {
                const tName =
                  tp.type === 'dynamic-tool'
                    ? ((tp.toolName as string) || 'unknown')
                    : ((tp.type as string)?.replace('tool-', '') || 'unknown');
                const tStatus =
                  tp.state === 'output-available'
                    ? 'complete'
                    : tp.state === 'output-error'
                      ? 'complete'
                      : 'active';
                return (
                  <ChainOfThoughtStep
                    key={`cot-${tIdx}`}
                    label={tName.replace(/_/g, ' ')}
                    status={tStatus}
                    description={
                      tp.state === 'output-available'
                        ? 'Completed'
                        : tp.state === 'output-error'
                          ? 'Error'
                          : 'Running...'
                    }
                  />
                );
              })}
            </ChainOfThoughtContent>
          </ChainOfThought>
        )}

        {/* Render parts */}
        {parts.map((part: Record<string, unknown>, pIdx: number) => {
          const partType = part.type as string;

          switch (partType) {
            case 'text': {
              const text = (part as { text?: string }).text;
              if (!text) return null;
              if (message.role === 'assistant') {
                const strippedText = !msgIsStreaming ? stripReactCodeBlocks(text) : text;
                return (
                  <React.Fragment key={pIdx}>
                    {strippedText.trim() && <MessageResponse>{strippedText}</MessageResponse>}
                    {!msgIsStreaming && <InlineReactPreview text={text} isDark={isDark} />}
                  </React.Fragment>
                );
              }
              return (
                <p
                  key={pIdx}
                  className="whitespace-pre-wrap break-words text-sm leading-relaxed"
                  style={{ color: colors.text, fontWeight: 400 }}
                >
                  {text}
                </p>
              );
            }

            case 'reasoning':
              return (
                <Reasoning key={pIdx} isStreaming={msgIsStreaming} defaultOpen={msgIsStreaming}>
                  <ReasoningTrigger />
                  <ReasoningContent>{(part as { text?: string }).text || ''}</ReasoningContent>
                </Reasoning>
              );

            case 'source-url':
              return null; // Handled by Sources above

            case 'step-start':
              return pIdx > 0 ? (
                <div key={pIdx} className="my-3 flex items-center gap-2 text-muted-foreground">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs">Step {pIdx}</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
              ) : null;

            case 'file': {
              const mediaType = part.mediaType as string | undefined;
              const base64 = part.base64 as string | undefined;
              const url = part.url as string | undefined;
              const filename = part.filename as string | undefined;

              if (mediaType?.startsWith('image/') && base64) {
                return (
                  <AIImage
                    key={pIdx}
                    base64={base64}
                    uint8Array={undefined as never}
                    mediaType={mediaType}
                    alt="Generated image"
                    className="max-w-full rounded-lg mt-2"
                  />
                );
              }
              if (mediaType?.startsWith('image/')) {
                return <img key={pIdx} src={url} alt="Generated" className="max-w-full rounded-lg mt-2" />;
              }
              if (url || filename) {
                return (
                  <Attachments key={pIdx} variant="inline">
                    <Attachment data={{ ...part, id: `file-${pIdx}`, type: 'file' as const }}>
                      <AttachmentPreview />
                      <AttachmentInfo showMediaType />
                    </Attachment>
                  </Attachments>
                );
              }
              return null;
            }

            // Dynamic tool
            case 'dynamic-tool': {
              const dynToolName = (part.toolName as string) || 'unknown';
              const state = part.state as string;
              switch (state) {
                case 'input-streaming':
                case 'input-available':
                  return <ToolLoading key={pIdx} toolName={dynToolName} input={part.input} />;
                case 'output-available':
                  return (
                    <AITool key={pIdx}>
                      <ToolHeader type="dynamic-tool" state={state} toolName={dynToolName} />
                      <ToolContent>
                        <ToolInput input={part.input} />
                        <ToolOutput output={part.output} errorText={part.errorText as string} />
                      </ToolContent>
                    </AITool>
                  );
                case 'output-error':
                  return (
                    <AITool key={pIdx}>
                      <ToolHeader type="dynamic-tool" state={state} toolName={dynToolName} />
                      <ToolContent>
                        <ToolOutput output={part.output} errorText={part.errorText as string} />
                      </ToolContent>
                    </AITool>
                  );
                default:
                  return null;
              }
            }

            default: {
              // Tool parts: use registry lookup
              if (partType?.startsWith('tool-')) {
                const toolName = partType.replace('tool-', '');
                const registryResult = renderRegisteredTool(
                  toolName,
                  part as { state: string; input?: unknown; output?: unknown; errorText?: string },
                  pIdx
                );
                if (registryResult !== null) return registryResult;

                // Fallback for unregistered tools
                const state = part.state as string;
                switch (state) {
                  case 'input-streaming':
                  case 'input-available':
                    return <ToolLoading key={pIdx} toolName={toolName} input={part.input} />;
                  case 'output-available':
                    return (
                      <AITool key={pIdx}>
                        <ToolHeader type={partType} state={state} />
                        <ToolContent>
                          <ToolInput input={part.input} />
                          <ToolOutput output={part.output} errorText={part.errorText as string} />
                        </ToolContent>
                      </AITool>
                    );
                  case 'output-error':
                    return (
                      <AITool key={pIdx}>
                        <ToolHeader type={partType} state={state} />
                        <ToolContent>
                          <ToolOutput output={part.output} errorText={part.errorText as string} />
                        </ToolContent>
                      </AITool>
                    );
                  default:
                    return null;
                }
              }

              // Data parts (artifacts)
              if (partType?.startsWith('data-') && part.data) {
                const data = part.data as Record<string, unknown>;
                if (data.content && data.artifactType) {
                  const artType = data.artifactType as string;
                  const isRenderable = ['html', 'svg', 'react', 'jsx', 'tsx'].includes(artType);
                  const artLang = (data.language as string) || artType;
                  const artCode = data.content as string;

                  if (isRenderable && artCode) {
                    const blobUrl = (() => {
                      try {
                        const htmlContent =
                          artType === 'svg'
                            ? `<!DOCTYPE html><html><body style="margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:transparent">${artCode}</body></html>`
                            : artCode;
                        const blob = new Blob([htmlContent], { type: 'text/html' });
                        return URL.createObjectURL(blob);
                      } catch {
                        return '';
                      }
                    })();

                    return (
                      <div key={pIdx} className="space-y-2">
                        <WebPreview defaultUrl={blobUrl} className="h-[400px]">
                          <WebPreviewNavigation>
                            <span className="text-xs text-muted-foreground px-2 truncate flex-1">
                              {(data.title as string) || `${artType.toUpperCase()} Preview`}
                            </span>
                          </WebPreviewNavigation>
                          <WebPreviewBody />
                          <WebPreviewConsole />
                        </WebPreview>
                        <CodeBlock code={artCode} language={artLang as never} showLineNumbers>
                          <CodeBlockHeader>
                            <CodeBlockTitle>{(data.title as string) || artType}</CodeBlockTitle>
                            <CodeBlockActions>
                              <CodeBlockCopyButton />
                            </CodeBlockActions>
                          </CodeBlockHeader>
                        </CodeBlock>
                      </div>
                    );
                  }

                  return (
                    <Artifact key={pIdx}>
                      <ArtifactHeader>
                        <ArtifactTitle>{(data.title as string) || artType}</ArtifactTitle>
                      </ArtifactHeader>
                      <ArtifactContent>
                        <ArtifactRenderer
                          artifact={{
                            id: (data.id as string) || `data-${pIdx}`,
                            type: artType,
                            language: artLang,
                            code: artCode,
                            complete: true,
                          }}
                        />
                      </ArtifactContent>
                    </Artifact>
                  );
                }
              }
              return null;
            }
          }
        })}

        {/* Shimmer for submitted state */}
        {status === 'submitted' &&
          isLast &&
          message.role === 'assistant' &&
          parts.every((p) => !(p as { text?: string }).text) && (
            <Shimmer duration={1.5}>Yang is Thinking...</Shimmer>
          )}
      </MessageContent>

      {/* Document generator for assistant responses */}
      {message.role === 'assistant' &&
        !msgIsStreaming &&
        fullText &&
        /\b(document|proposal|report|memo|letter|policy|guide|plan|summary|brief|outline|form|checklist)\b/i.test(
          fullText
        ) && (
          <div style={{ marginTop: '12px' }}>
            <DocumentGenerator
              title="Generated Document"
              content={fullText}
              onDocumentGenerated={onDocumentGenerated}
            />
          </div>
        )}

      {/* Message actions toolbar */}
      {message.role === 'assistant' && !msgIsStreaming && fullText && (
        <MessageActions className="opacity-0 group-hover:opacity-100 transition-opacity">
          <MessageAction tooltip="Copy" onClick={() => onCopy(fullText)}>
            <CopyIcon className="size-3.5" />
          </MessageAction>
          <MessageAction
            tooltip="Helpful"
            onClick={() => toast.success('Thanks for the feedback!')}
          >
            <ThumbsUpIcon className="size-3.5" />
          </MessageAction>
          <MessageAction tooltip="Not helpful" onClick={() => toast.info('Feedback noted')}>
            <ThumbsDownIcon className="size-3.5" />
          </MessageAction>
        </MessageActions>
      )}
    </AIMessage>
  );
}, (prev, next) => {
  // Custom comparator: skip re-render for old messages that haven't changed
  if (prev.message.id !== next.message.id) return false;
  if (prev.isLast !== next.isLast) return false;
  if (prev.isStreaming !== next.isStreaming) return false;
  if (prev.status !== next.status) return false;
  if (prev.isDark !== next.isDark) return false;

  // For non-last messages, parts are stable — skip re-render
  if (!next.isLast) return true;

  // For the last message, check if parts changed
  const prevParts = prev.message.parts || [];
  const nextParts = next.message.parts || [];
  return prevParts.length === nextParts.length;
});
