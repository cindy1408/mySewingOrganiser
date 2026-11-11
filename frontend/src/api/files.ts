import { ReadFile } from '../../wailsjs/go/main/App';

export async function loadBytes(path: string): Promise<Uint8Array> {
    const b64 = await ReadFile(path);
    return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}