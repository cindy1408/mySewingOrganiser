import { useEffect, useRef } from 'react';
import { pdfjsLib } from '../lib/pdf';
import { loadBytes } from '../api/files';

export function PdfPage({ path, width, className }: { path: string; width: number; className?: string }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        let cancelled = false;
        let task: ReturnType<typeof pdfjsLib.getDocument> | undefined;
        (async () => {
            const bytes = await loadBytes(path);
            if (cancelled) return;
            task = pdfjsLib.getDocument({ data: bytes });
            const pdf = await task.promise;
            const page = await pdf.getPage(1);
            const base = page.getViewport({ scale: 1 });
            const viewport = page.getViewport({
                scale: (width * window.devicePixelRatio) / base.width,
            });
            const canvas = canvasRef.current;
            if (!canvas || cancelled) return;
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            await page.render({ canvas, viewport }).promise;
        })()
            .catch(console.error)
            .finally(() => task?.destroy());
        return () => {
            cancelled = true;
        };
    }, [path, width]);

    return <canvas ref={canvasRef} className={className} />;
}