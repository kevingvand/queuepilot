import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Item } from '@queuepilot/core/types';
import { useApi } from '../../../hooks/useApi';

export function DetailBody({ item }: { item: Item }) {
  const api = useApi();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(item.body);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setBody(item.body);
  }, [item.id, item.body]);

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [editing]);

  async function save() {
    setEditing(false);
    if (body === item.body) return;
    await api.items.update(item.id, { body });
    queryClient.invalidateQueries({ queryKey: ['item', item.id] });
  }

  if (!editing) {
    return (
      <div
        className="cursor-text min-h-[2rem] rounded px-1 -mx-1 hover:bg-muted/40 transition-colors group"
        onClick={() => setEditing(true)}
        title="Click to edit description"
      >
        {body ? (
          <pre className="text-sm text-foreground/80 whitespace-pre-wrap font-sans leading-relaxed">
            {body}
          </pre>
        ) : (
          <span className="text-sm text-muted-foreground/60 italic">+ Add description</span>
        )}
      </div>
    );
  }

  return (
    <textarea
      ref={textareaRef}
      value={body}
      onChange={(e) => {
        setBody(e.target.value);
        e.target.style.height = 'auto';
        e.target.style.height = `${e.target.scrollHeight}px`;
      }}
      onBlur={save}
      className="w-full bg-transparent text-sm text-foreground resize-none focus:outline-none leading-relaxed min-h-[4rem]"
      rows={3}
    />
  );
}
