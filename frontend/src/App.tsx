import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { ChooseFolder, ScanFolder, ReadFile, OpenFile, SaveCopy, RevealFile } from '../wailsjs/go/main/App';
import { main } from '../wailsjs/go/models';
import './App.css';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

async function loadBytes(path: string): Promise<Uint8Array> {
    const bin = atob(await ReadFile(path));
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
}

// turns an image file into a URL an <img> tag can use
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

// true once the element has scrolled into view
function useInView() {
    const ref = useRef<HTMLDivElement>(null);
    const [seen, setSeen] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([e]) => {
                if (e.isIntersecting) { setSeen(true); obs.disconnect(); }
            },
            { rootMargin: '200px' }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, []);
    return { ref, seen };
}

// renders page 1 of a PDF at the given width (used for both thumbnail and preview)
function PdfPage({ path, width, className }: { path: string; width: number; className?: string }) {
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
        return () => { cancelled = true; };
    }, [path, width]);

    return <canvas ref={canvasRef} className={className} />;
}

function PdfThumb({ path }: { path: string }) {
    const { ref, seen } = useInView();
    return (
        <div ref={ref} className="thumb">
            {seen && <PdfPage path={path} width={300} />}
        </div>
    );
}

function ImageThumb({ path, name }: { path: string; name: string }) {
    const url = useBlobUrl(path);
    return <div className="thumb">{url && <img src={url} alt={name} />}</div>;
}

function ImageView({ path, name }: { path: string; name: string }) {
    const url = useBlobUrl(path);
    return url ? <img src={url} className="preview-canvas" alt={name} /> : null;
}

function Preview({ pattern, onClose }: { pattern: main.Pattern; onClose: () => void }) {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    return (
        <div className="overlay" onClick={onClose}>
            <div className="preview" onClick={(e) => e.stopPropagation()}>
                <div className="preview-title">{pattern.name}</div>
                <div className="toolbar">
                    <button onClick={() => OpenFile(pattern.path)} title="Opens in your default PDF app, then press Cmd+P">
                        Print
                    </button>
                    <button onClick={() => SaveCopy(pattern.path)}>Save a copy</button>
                    <button onClick={() => RevealFile(pattern.path)}>Show in folder</button>
                    <button onClick={onClose}>Close</button>
                </div>
                {pattern.type === 'pdf' ? (
                    <PdfPage path={pattern.path} width={900} className="preview-canvas" />
                ) : (
                    <ImageView path={pattern.path} name={pattern.name} />
                )}
            </div>
        </div>
    );
}

function App() {
    const [patterns, setPatterns] = useState<main.Pattern[]>([]);
    const [selected, setSelected] = useState<main.Pattern | null>(null);

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
                    <div key={p.path} className="card" onClick={() => setSelected(p)}>
                        {p.type === 'pdf' ? (
                            <PdfThumb path={p.path} />
                        ) : (
                            <ImageThumb path={p.path} name={p.name} />
                        )}
                        <div className="name">{p.name}</div>
                    </div>
                ))}
            </div>
            {selected && <Preview pattern={selected} onClose={() => setSelected(null)} />}
        </div>
    );
}

export default App;