import { ScrollArea } from '../../components/ui/scroll-area';
import { Separator } from '../../components/ui/separator';
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

export function ItemDetail() {
  const { selectedItemId } = useUiStore();
  const { item, comments, events, links } = useItemDetail(selectedItemId);

  if (!selectedItemId) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground bg-background">
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
          className="opacity-30"
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
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground bg-background">
        Loading…
      </div>
    );
  }

  if (!item.data) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground bg-background">
        Item not found
      </div>
    );
  }

  return (
    <ScrollArea className="h-full bg-background">
      <div className="p-4">
        <DetailHeader item={item.data} />
      </div>
      <Separator />
      <div className="p-4">
        <DetailMeta item={item.data} />
      </div>
      <Separator />
      <div className="p-4">
        <DetailBody item={item.data} />
      </div>
      <Separator />
      <div className="p-4">
        <DetailTags itemId={item.data.id} />
      </div>
      <Separator />
      <div className="p-4">
        <DetailSubtasks itemId={item.data.id} />
      </div>
      <Separator />
      <div className="p-4">
        <DetailLinks itemId={item.data.id} links={links.data ?? []} />
      </div>
      <Separator />
      <div className="p-4">
        <DetailComments itemId={item.data.id} comments={comments.data ?? []} />
      </div>
      <Separator />
      <div className="p-4">
        <DetailAudit itemId={item.data.id} events={events.data ?? []} isLoading={events.isLoading} />
      </div>
    </ScrollArea>
  );
}
