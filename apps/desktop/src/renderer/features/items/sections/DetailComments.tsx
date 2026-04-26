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

const CURRENT_USER = 'You';

function CommentRow({ comment, itemId, onDelete, onEdit }: {
  comment: Comment;
  itemId: string;
  onDelete: () => void;
  onEdit: (body: string) => void;
}) {
  const isOwn = comment.author === CURRENT_USER;
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(comment.body);

  function commit() {
    const trimmed = text.trim();
    if (trimmed && trimmed !== comment.body) onEdit(trimmed);
    else setText(comment.body);
    setEditing(false);
  }

  return (
    <div className="flex gap-2.5 group">
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
          {isOwn && !editing && (
            <span className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setEditing(true)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Edit comment"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button
                onClick={onDelete}
                className="text-muted-foreground hover:text-destructive transition-colors"
                title="Delete comment"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
              </button>
            </span>
          )}
        </div>
        {editing ? (
          <textarea
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commit(); }
              if (e.key === 'Escape') { setText(comment.body); setEditing(false); }
            }}
            className="w-full bg-muted border border-primary rounded px-2 py-1 text-sm text-foreground resize-none focus:outline-none"
            rows={2}
          />
        ) : (
          <p className="text-sm text-foreground/80 whitespace-pre-wrap">{comment.body}</p>
        )}
      </div>
    </div>
  );
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

  async function deleteComment(commentId: string) {
    await api.items.comments.delete(itemId, commentId);
    queryClient.invalidateQueries({ queryKey: ['comments', itemId] });
  }

  async function editComment(commentId: string, body: string) {
    await api.items.comments.update(itemId, commentId, { body });
    queryClient.invalidateQueries({ queryKey: ['comments', itemId] });
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-muted-foreground">Comments</p>
      <div className="space-y-3">
        {comments.map((comment) => (
          <CommentRow
            key={comment.id}
            comment={comment}
            itemId={itemId}
            onDelete={() => deleteComment(comment.id)}
            onEdit={(body) => editComment(comment.id, body)}
          />
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
