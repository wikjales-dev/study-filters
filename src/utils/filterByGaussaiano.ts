import type { ImageMatrix } from "./type";

/* === FFT (mesmo conteúdo da função anterior) === */

function fft1d(re, im) { /* ... igual ao código anterior ... */ }
function ifft1d(re, im) { /* ... */ }
function fft2d(re, im) { /* ... */ }
function ifft2d(re, im) { /* ... */ }

/* === Conversão FileReader → matriz === */

async function fileReaderToMatrix(fileReader) { /* igual ao anterior */ }

/* === Filtro Gaussiano === */

function applyGaussianLowPass(re, im, cutoff) {
    const h = re.length;
    const w = re[0].length;
    const cy = h / 2;
    const cx = w / 2;

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const d2 = (x - cx)**2 + (y - cy)**2;
            const hval = Math.exp(-d2 / (2 * cutoff * cutoff));
            re[y][x] *= hval;
            im[y][x] *= hval;
        }
    }
}

function matrixToImageMatrix(mat) {
    return { width: mat[0].length, height: mat.length, data: mat };
}

/* === Função Final === */

export function filterGaussiano(file: FileReader): ImageMatrix {
    return (async () => {
        const img = await fileReaderToMatrix(file);

        const re = img.data.map(r => Float64Array.from(r));
        const im = img.data.map(r => new Float64Array(r.length));

        fft2d(re, im);
        applyGaussianLowPass(re, im, 50);
        ifft2d(re, im);

        const result = re.map(row =>
            Float64Array.from(row.map(v => Math.max(0, Math.min(255, v))))
        );

        return matrixToImageMatrix(result);
    })();
}
