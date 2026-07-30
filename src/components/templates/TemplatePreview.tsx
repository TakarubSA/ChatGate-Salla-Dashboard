import type * as React from 'react';
import {
  Copy,
  ExternalLink,
  FileText,
  ImageIcon,
  MessageCircleReply,
  Phone,
  Play,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  extractTemplateVariableNumbers,
  type TemplateButtonValues,
  type TemplateFormValues,
} from './types';

const buttonIcons: Record<TemplateButtonValues['type'], typeof MessageCircleReply> = {
  QUICK_REPLY: MessageCircleReply,
  URL: ExternalLink,
  PHONE_NUMBER: Phone,
  COPY_CODE: Copy,
};

function createSampleMap(values: TemplateFormValues) {
  return new Map(
    values.variableSamples.map((sample) => [sample.key, sample.value.trim()]),
  );
}

function renderTextWithVariables(text: string, samples: Map<string, string>) {
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(/\{\{(\d+)\}\}/g)) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const variableKey = match[1];
    nodes.push(
      <span
        key={`${variableKey}-${match.index}`}
        className="rounded bg-emerald-100 px-1 font-medium text-emerald-900"
      >
        {samples.get(variableKey) || match[0]}
      </span>,
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

function MediaPreview({ values }: { values: TemplateFormValues }) {
  const { format, mediaUrl } = values.header;

  if (format === 'IMAGE') {
    if (mediaUrl) {
      return (
        <img
          src={mediaUrl}
          alt="Template header"
          className="mb-2 h-40 w-full rounded-md object-cover"
        />
      );
    }

    return (
      <div className="mb-2 flex h-40 w-full items-center justify-center rounded-md bg-muted text-muted-foreground">
        <ImageIcon className="h-8 w-8" />
      </div>
    );
  }

  if (format === 'VIDEO') {
    return (
      <div className="mb-2 flex h-40 w-full items-center justify-center rounded-md bg-muted text-muted-foreground">
        <Play className="h-9 w-9" />
      </div>
    );
  }

  if (format === 'DOCUMENT') {
    return (
      <div className="mb-2 flex h-20 w-full items-center gap-3 rounded-md bg-muted px-4 text-muted-foreground">
        <FileText className="h-8 w-8" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            Attachment
          </p>
          <p className="text-xs">Document preview</p>
        </div>
      </div>
    );
  }

  return null;
}

export interface TemplatePreviewProps {
  value: TemplateFormValues;
  className?: string;
  timestamp?: string;
}

export function TemplatePreview({
  value,
  className,
  timestamp = new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date()),
}: TemplatePreviewProps) {
  const samples = createSampleMap(value);
  const containsVariables = extractTemplateVariableNumbers(value.body).length > 0;

  return (
    <aside className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Preview</h3>
          <p className="text-xs text-muted-foreground">WhatsApp message</p>
        </div>
        <Badge variant="secondary">{value.language}</Badge>
      </div>

      <div className="mx-auto w-full max-w-sm overflow-hidden rounded-[28px] border border-border bg-background shadow-sm">
        <div className="flex h-14 items-center gap-3 bg-[#075e54] px-4 text-white">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-sm font-semibold">
            W
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">WhatsApp Business</p>
            <p className="text-xs text-white/80">online</p>
          </div>
        </div>

        <div
          className="min-h-[520px] px-3 py-5"
          style={{
            backgroundColor: '#efe7dd',
            backgroundImage:
              'linear-gradient(45deg, rgba(255,255,255,.28) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,.28) 25%, transparent 25%)',
            backgroundSize: '24px 24px',
          }}
        >
          <div className="max-w-[86%] rounded-lg bg-white px-2.5 py-2 text-[#111b21] shadow-sm">
            <MediaPreview values={value} />

            {value.header.format === 'TEXT' && value.header.text && (
              <p className="mb-1 whitespace-pre-wrap break-words text-sm font-semibold leading-5">
                {renderTextWithVariables(value.header.text, samples)}
              </p>
            )}

            <p className="whitespace-pre-wrap break-words text-sm leading-5">
              {value.body
                ? renderTextWithVariables(value.body, samples)
                : 'Message body'}
            </p>

            {value.footer && (
              <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-4 text-[#667781]">
                {renderTextWithVariables(value.footer, samples)}
              </p>
            )}

            <div className="mt-1 text-right text-[10px] leading-none text-[#667781]">
              {timestamp}
            </div>

            {value.buttons.length > 0 && (
              <div className="mt-2 divide-y divide-border border-t border-border">
                {value.buttons.map((button, index) => {
                  const Icon = buttonIcons[button.type];
                  return (
                    <button
                      key={`${button.type}-${index}`}
                      type="button"
                      className="flex h-10 w-full items-center justify-center gap-2 text-sm font-medium text-[#027eb5]"
                    >
                      <Icon className="h-4 w-4" />
                      <span className="truncate">
                        {button.text || `Button ${index + 1}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      {containsVariables && <span className="sr-only">Variables applied</span>}
    </aside>
  );
}
