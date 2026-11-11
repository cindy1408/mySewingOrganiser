import { main } from '../../wailsjs/go/models';
import { useInView } from '../hooks/useInView';
import { PdfPage } from './PdfPage';
import { ImageFile } from './ImageFile';

export function PatternCard({ pattern, onSelect }: { pattern: main.Pattern; onSelect: () => void }) {
    const { ref, seen } = useInView();
    return (
        <div className="card" onClick={onSelect}>
            <div ref={ref} className="thumb">
                {seen &&
                    (pattern.type === 'pdf' ? (
                        <PdfPage path={pattern.path} width={300} />
                    ) : (
                        <ImageFile path={pattern.path} name={pattern.name} />
                    ))}
            </div>
            <div className="name">{pattern.name}</div>
        </div>
    );
}