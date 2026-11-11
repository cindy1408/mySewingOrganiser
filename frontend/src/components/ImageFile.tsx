import { useBlobUrl } from '../hooks/useBlobUrl';

export function ImageFile({ path, name, className }: { path: string; name: string; className?: string }) {
    const url = useBlobUrl(path);
    return url ? <img src={url} alt={name} className={className} /> : null;
}