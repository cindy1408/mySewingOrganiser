import { useEffect, useState } from 'react';
import { loadBytes } from '../api/files';

// Turns a file on disk into a URL an <img> can use.
export function useBlobUrl(path: string) {
    const [url, setUrl] = useState<string>();
    useEffect(() => {
        let cancelled = false;
        let objectUrl: string | undefined;
        loadBytes(path)
            .then((bytes) => {
                if (cancelled) return;
                objectUrl = URL.createObjectURL(new Blob([bytes as BlobPart]));
                setUrl(objectUrl);
            })
            .catch(console.error);
        return () => {
            cancelled = true;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [path]);
    return url;
}