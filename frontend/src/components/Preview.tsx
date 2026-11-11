import { useEffect } from 'react';
import { OpenFile, SaveCopy, RevealFile } from '../../wailsjs/go/main/App';
import { main } from '../../wailsjs/go/models';
import { PdfPage } from './PdfPage';
import { ImageFile } from './ImageFile';

export function Preview({ pattern, onClose }: { pattern: main.Pattern; onClose: () => void }) {
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
                    <ImageFile path={pattern.path} name={pattern.name} className="preview-canvas" />
                )}
            </div>
        </div>
    );
}