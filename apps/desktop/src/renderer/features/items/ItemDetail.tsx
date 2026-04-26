import { ScrollArea } from '../../components/ui/scroll-area';
import { useUiStore } from '../../store/ui.store';
import { useItemDetail } from './hooks/useItemDetail';
import { DetailAudit } from './sections/DetailAudit';
import { DetailBody } from './sections/DetailBody';
import { DetailComments } from './sections/DetailComments';
import { DetailHeader } from './sections/DetailHeader';
import { DetailLinks } from './sections/DetailLinks';
import { DetailMeta } from './sections/DetailMeta';
import { DetailSubtasks } from './sections/DetailSubtasks';
import { DetailTags } from './sections/DetailTags';

function SectionDivider() {
  return <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '0 16px' }} />;
}

export function ItemDetail() {
  const { selectedItemId } = useUiStore();
  const { item, comments, events, links } = useItemDetail(selectedItemId);

  if (!selectedItemId) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-muted)' }}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ opacity: 0.3 }}
        >
          <rect width="18" height="18" x="3" y="3" rx="2" />
          <path d="M9 3v18" />
          <path d="m16 15-3-3 3-3" />
        </svg>
        <span className="text-sm">Select an item to view details</span>
      </div>
    );
  }

  if (item.isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-sm" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-muted)' }}>
        Loading…
      </div>
    );
  }

  if (!item.data) {
    return (
      <div className="flex items-center justify-center h-full text-sm" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-muted)' }}>
        Item not found
      </div>
    );
  }

  return (
    <ScrollArea className="h-full" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div style={{ padding: '16px' }}>
        <DetailHeader item={item.data} />
      </div>
      <SectionDivider />
      <div style={{ padding: '16px' }}>
        <DetailBody item={item.data} />
      </div>
      <SectionDivider />
      <div style={{ padding: '16px' }}>
        <DetailTags itemId={item.data.id} />
      </div>
      <SectionDivider />
      <div style={{ padding: '16px' }}>
        <DetailMeta item={item.data} />
      </div>
      <SectionDivider />
      <div style={{ padding: '16px' }}>
        <DetailSubtasks itemId={item.data.id} />
      </div>
      <SectionDivider />
      <div style={{ padding: '16px' }}>
        <DetailLinks itemId={item.data.id} links={links.data ?? []} />
      </div>
      <SectionDivider />
      <div style={{ padding: '16px' }}>
        <DetailComments itemId={item.data.id} comments={comments.data ?? []} />
      </div>
      <SectionDivider />
      <div style={{ padding: '16px' }}>
        <DetailAudit itemId={item.data.id} events={events.data ?? []} isLoading={events.isLoading} />
      </div>
    </ScrollArea>
  );
}
