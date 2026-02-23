'use client';

import { useEffect, useRef, useState } from 'react';

interface WysiwygEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Simple WYSIWYG editor using contentEditable.
 * For a production app, consider TipTap or Slate.
 */
export default function WysiwygEditor({ value, onChange, placeholder, className }: WysiwygEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const execCommand = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  return (
    <div className={`rounded-[var(--radius)] border border-[var(--color-border)] ${className || ''}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-2 py-1">
        <ToolbarButton onClick={() => execCommand('bold')} title="Bold">
          <b>B</b>
        </ToolbarButton>
        <ToolbarButton onClick={() => execCommand('italic')} title="Italic">
          <i>I</i>
        </ToolbarButton>
        <ToolbarButton onClick={() => execCommand('underline')} title="Underline">
          <u>U</u>
        </ToolbarButton>
        <span className="mx-1 border-r border-[var(--color-border)]" />
        <ToolbarButton onClick={() => execCommand('formatBlock', 'h2')} title="Heading 2">
          H2
        </ToolbarButton>
        <ToolbarButton onClick={() => execCommand('formatBlock', 'h3')} title="Heading 3">
          H3
        </ToolbarButton>
        <ToolbarButton onClick={() => execCommand('formatBlock', 'p')} title="Paragraph">
          P
        </ToolbarButton>
        <span className="mx-1 border-r border-[var(--color-border)]" />
        <ToolbarButton onClick={() => execCommand('insertUnorderedList')} title="Bullet list">
          • List
        </ToolbarButton>
        <ToolbarButton onClick={() => execCommand('insertOrderedList')} title="Numbered list">
          1. List
        </ToolbarButton>
        <span className="mx-1 border-r border-[var(--color-border)]" />
        <ToolbarButton
          onClick={() => {
            const url = window.prompt('URL посилання:');
            if (url) execCommand('createLink', url);
          }}
          title="Link"
        >
          🔗
        </ToolbarButton>
        <ToolbarButton onClick={() => execCommand('removeFormat')} title="Clear formatting">
          ✕
        </ToolbarButton>
      </div>

      {/* Editor area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`min-h-[200px] p-4 text-sm outline-none ${
          !value && !isFocused ? 'text-[var(--color-text-secondary)]' : ''
        }`}
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />
    </div>
  );
}

function ToolbarButton({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="rounded px-2 py-0.5 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)] hover:text-[var(--color-text)]"
    >
      {children}
    </button>
  );
}
