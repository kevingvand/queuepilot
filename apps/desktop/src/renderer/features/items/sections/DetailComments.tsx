import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Comment } from '@queuepilot/core/types';
import { Button } from '../../../components/ui/button';
import { useApi } from '../../../hooks/useApi';
import { formatRelative } from '../../../lib/utils';

function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return `hsl(${Math.abs(hash) % 360}, 50%, 45%)`;
}

export function DetailComments({
  itemId,
  comments,
}: {
  itemId: string;
  comments: Comment[];
}) {
  const api = useApi();
  const queryClient = useQueryClient();
  const [text, setText] = useState('');

  async function submit() {
    const body = text.trim();
    if (!body) return;
    setText('');
    await api.items.comments.create(itemId, { body });
    queryClient.invalidateQueries({ queryKey: ['comments', itemId] });
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-muted-foreground">Comments</p>
      <div className="space-y-3">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-2.5">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium shrink-0 text-white"
              style={{ backgroundColor: stringToColor(comment.author) }}
            >
              {comment.author[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-medium text-foreground">{comment.author}</span>
                <span className="text-xs text-muted-foreground">{formatRelative(comment.created_at)}</span>
              </div>
              <p className="text-sm text-foreground/80 whitespace-pre-wrap">{comment.body}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Add a comment… (Enter to submit, Shift+Enter for newline)"
          className="w-full bg-muted border border-border rounded px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
          rows={2}
        />
        <Button variant="outline" size="sm" onClick={submit} className="self-end">
          Comment
        </Button>
      </div>
    </div>
  );
}
