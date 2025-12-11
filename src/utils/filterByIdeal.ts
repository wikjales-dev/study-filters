import type { ImageMatrix } from "./type";

function fft1d(re, im) { /* ... */ }
function ifft1d(re, im) { /* ... */ }
function fft2d(re, im) { /* ... */ }
function ifft2d(re, im) { /* ... */ }

async function fileReaderToMatrix(fileReader) { /* ... */ }

function applyIdealLowPass(re, im, cutoff) {
    const h = re.length;
    const w = re[0].length;
    const cy = h / 2;
    const cx = w / 2;

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const d = Math.sqrt((x - cx)**2 + (y - cy)**2);
            if (d > cutoff) {
                re[y][x] = 0;
                im[y][x] = 0;
            }
        }
    }
}

function matrixToImageMatrix(mat) {
    return { width: mat[0].length, height: mat.length, data: mat };
}

export function filterIdeal(file: FileReader): ImageMatrix {
    return (async () => {
        const img = await fileReaderToMatrix(file);

        const re = img.data.map(r => Float64Array.from(r));
        const im = img.data.map(r => new Float64Array(r.length));

        fft2d(re, im);
        applyIdealLowPass(re, im, 50);
        ifft2d(re, im);

        const result = re.map(row =>
            Float64Array.from(row.map(v => Math.max(0, Math.min(255, v))))
        );

        return matrixToImageMatrix(result);
    })();
}
