import { useEffect } from 'react';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Code2, Italic, Redo2, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { VariablePicker } from './VariablePicker';

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function textToHtml(value: string) {
  if (!value.trim()) {
    return '<p></p>';
  }

  return value
    .split('\n')
    .map((line) => `<p>${line ? escapeHtml(line) : '<br>'}</p>`)
    .join('');
}

function insertWrappedText(editor: Editor | null, marker: string) {
  if (!editor) return;

  const { from, to, empty } = editor.state.selection;
  const selectedText = editor.state.doc.textBetween(from, to, '\n');
  const replacement = empty
    ? `${marker}text${marker}`
    : `${marker}${selectedText}${marker}`;

  editor
    .chain()
    .focus()
    .insertContentAt({ from, to }, replacement)
    .run();
}

export interface TemplateEditorProps {
  value: string;
  onChange: (value: string) => void;
  usedVariables: number[];
  placeholder?: string;
  minHeightClassName?: string;
  disabled?: boolean;
  className?: string;
}

export function TemplateEditor({
  value,
  onChange,
  usedVariables,
  placeholder = 'Write your WhatsApp message',
  minHeightClassName = 'min-h-44',
  disabled = false,
  className,
}: TemplateEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        blockquote: false,
        bulletList: false,
        codeBlock: false,
        heading: false,
        horizontalRule: false,
        orderedList: false,
      }),
    ],
    content: textToHtml(value),
    editable: !disabled,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          'px-3 py-3 text-sm leading-6 outline-none whitespace-pre-wrap break-words',
        'aria-label': placeholder,
      },
    },
    onUpdate: ({ editor: updatedEditor }) => {
      onChange(updatedEditor.getText({ blockSeparator: '\n' }));
    },
  });

  useEffect(() => {
    if (!editor) return;

    const editorText = editor.getText({ blockSeparator: '\n' });
    if (editorText !== value) {
      editor.commands.setContent(textToHtml(value), { emitUpdate: false });
    }
  }, [editor, value]);

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [disabled, editor]);

  const insertVariable = (token: string) => {
    editor?.chain().focus().insertContent(token).run();
  };

  return (
    <div className={cn('rounded-md border border-input bg-background', className)}>
      <div className="flex flex-wrap items-center gap-1 border-b border-border p-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => insertWrappedText(editor, '*')}
          disabled={disabled}
          aria-label="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => insertWrappedText(editor, '_')}
          disabled={disabled}
          aria-label="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => insertWrappedText(editor, '`')}
          disabled={disabled}
          aria-label="Code"
        >
          <Code2 className="h-4 w-4" />
        </Button>
        <Separator orientation="vertical" className="mx-1 h-6" />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => editor?.chain().focus().undo().run()}
          disabled={disabled || !editor?.can().undo()}
          aria-label="Undo"
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => editor?.chain().focus().redo().run()}
          disabled={disabled || !editor?.can().redo()}
          aria-label="Redo"
        >
          <Redo2 className="h-4 w-4" />
        </Button>
        <div className="ml-auto">
          <VariablePicker
            usedVariables={usedVariables}
            onInsert={insertVariable}
            disabled={disabled}
          />
        </div>
      </div>
      <div
        className={cn(
          'relative',
          minHeightClassName,
          disabled && 'cursor-not-allowed opacity-60',
          '[&_.ProseMirror]:min-h-[inherit]',
        )}
      >
        {!value && (
          <span className="pointer-events-none absolute left-3 top-3 text-sm leading-6 text-muted-foreground">
            {placeholder}
          </span>
        )}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
