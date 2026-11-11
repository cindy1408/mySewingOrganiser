import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { ChooseFolder, ScanFolder, ReadFile } from '../wailsjs/go/main/App';
import { main } from '../wailsjs/go/models';
import './App.css';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

const fileUrl = (path: string) => `/localfile?p=${encodeURIComponent(path)}`;

async function loadBytes(path: string): Promise<Uint8Array> {
    const bin = atob(await ReadFile(path));
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
}

// turns an image file into a URL the <img> tag can use
function useBlobUrl(path: string) {
    const [url, setUrl] = useState<string>();
    useEffect(() => {
        let revoked = false;
        let objectUrl: string | undefined;
        loadBytes(path)
            .then((bytes) => {
                if (revoked) return;
                objectUrl = URL.createObjectURL(new Blob([bytes as BlobPart]));
                setUrl(objectUrl);
            })
            .catch(console.error);
        return () => {
            revoked = true;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [path]);
    return url;
}

function ImageThumb({ path, name }: { path: string; name: string }) {
    const url = useBlobUrl(path);
    return url ? <img src={url} alt={name} /> : null;
}

// true once the element has scrolled into view (so we only render visible PDFs)
function useInView() {
    const ref = useRef<HTMLDivElement>(null);
    const [seen, setSeen] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(([e]) => {
            if (e.isIntersecting) { setSeen(true); obs.disconnect(); }
        }, { rootMargin: '200px' });
        obs.observe(el);
        return () => obs.disconnect();
    }, []);
    return { ref, seen };
}

function PdfThumb({ path }: { path: string }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { ref, seen } = useInView();

    useEffect(() => {
        if (!seen) return;
        let cancelled = false;
        let task: ReturnType<typeof pdfjsLib.getDocument> | undefined;
        (async () => {
            const bytes = await loadBytes(path);
            if (cancelled) return;
            task = pdfjsLib.getDocument({ data: bytes });
            const pdf = await task.promise;
            const page = await pdf.getPage(1);
            const base = page.getViewport({ scale: 1 });
            const viewport = page.getViewport({ scale: 300 / base.width });
            const canvas = canvasRef.current;
            if (!canvas || cancelled) return;
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            await page.render({ canvas, viewport }).promise;
        })()
            .catch(console.error)
            .finally(() => task?.destroy());
        return () => { cancelled = true; };
    }, [seen, path]);

    return <div ref={ref} className="thumb"><canvas ref={canvasRef} /></div>;
}

function App() {
    const [patterns, setPatterns] = useState<main.Pattern[]>([]);

    const pickFolder = async () => {
        const folder = await ChooseFolder();
        if (!folder) return;
        setPatterns(await ScanFolder(folder));
    };

    return (
        <div className="app">
            <button onClick={pickFolder}>Choose patterns folder</button>
            <p>{patterns.length} patterns</p>
            <div className="grid">
                {patterns.map((p) => (
                    <div key={p.path} className="card">
                        {p.type === 'pdf' ? (
                            <PdfThumb path={p.path} />
                        ) : (
                            <div className="thumb">
                                <img src={fileUrl(p.path)} loading="lazy" alt={p.name} />
                            </div>
                        )}
                        <div className="name">{p.name}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default App;