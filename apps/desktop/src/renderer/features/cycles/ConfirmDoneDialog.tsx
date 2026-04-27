import * as Dialog from '@radix-ui/react-dialog';
import type { Item } from '@queuepilot/core/types';

export function ConfirmDoneDialog({
  item,
  onConfirm,
  onCancel,
}: {
  item: Item | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Dialog.Root open={!!item} onOpenChange={(open) => { if (!open) onCancel(); }}>
      <Dialog.Portal>
        <Dialog.Overlay
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 50,
          }}
        />
        <Dialog.Content
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '24px',
            width: '400px',
            maxWidth: '90vw',
            zIndex: 51,
            boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
          }}
        >
          <Dialog.Title
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: '8px',
            }}
          >
            Mark as Done?
          </Dialog.Title>
          <Dialog.Description
            style={{
              fontSize: '14px',
              color: 'var(--text-secondary)',
              marginBottom: '20px',
              lineHeight: 1.5,
            }}
          >
            Confirm that &ldquo;{item?.title}&rdquo; has been reviewed and is complete.
          </Dialog.Description>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              onClick={onCancel}
              style={{
                padding: '6px 16px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                backgroundColor: 'transparent',
                color: 'var(--text-primary)',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              style={{
                padding: '6px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: 'var(--accent)',
                color: '#ffffff',
                fontSize: '13px',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              Done
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
