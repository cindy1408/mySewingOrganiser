import { useState } from 'react';
import { ChooseFolder, ScanFolder } from '../wailsjs/go/main/App';
import { main } from '../wailsjs/go/models';
import { PatternCard } from './components/PatternCard';
import { Preview } from './components/Preview';
import './App.css';

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
                    <PatternCard key={p.path} pattern={p} onSelect={() => setSelected(p)} />
                ))}
            </div>
            {selected && <Preview pattern={selected} onClose={() => setSelected(null)} />}
        </div>
    );
}

export default App;