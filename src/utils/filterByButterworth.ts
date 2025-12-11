import type { ImageMatrix } from "./type";

function fft1d(re, im) {
    const n = re.length;
    if (n <= 1) return;

    const half = n / 2;
    const er = new Float64Array(half);
    const ei = new Float64Array(half);
    const or = new Float64Array(half);
    const oi = new Float64Array(half);

    for (let i = 0; i < half; i++) {
        er[i] = re[2*i];
        ei[i] = im[2*i];
        or[i] = re[2*i+1];
        oi[i] = im[2*i+1];
    }

    fft1d(er, ei);
    fft1d(or, oi);

    for (let k = 0; k < half; k++) {
        const t = -2 * Math.PI * k / n;
        const c = Math.cos(t);
        const s = Math.sin(t);

        const tr = c * or[k] - s * oi[k];
        const ti = s * or[k] + c * oi[k];

        re[k] = er[k] + tr;
        im[k] = ei[k] + ti;

        re[k + half] = er[k] - tr;
        im[k + half] = ei[k] - ti;
    }
}

function ifft1d(re, im) {
    for (let i = 0; i < im.length; i++) im[i] = -im[i];
    fft1d(re, im);
    for (let i = 0; i < re.length; i++) {
        re[i] /= re.length;
        im[i] = -im[i] / re.length;
    }
}

function fft2d(re, im) {
    const h = re.length;
    const w = re[0].length;

    for (let y = 0; y < h; y++) fft1d(re[y], im[y]);

    for (let x = 0; x < w; x++) {
        const colRe = new Float64Array(h);
        const colIm = new Float64Array(h);
        for (let y = 0; y < h; y++) {
            colRe[y] = re[y][x];
            colIm[y] = im[y][x];
        }

        fft1d(colRe, colIm);

        for (let y = 0; y < h; y++) {
            re[y][x] = colRe[y];
            im[y][x] = colIm[y];
        }
    }
}

function ifft2d(re, im) {
    const h = re.length;
    const w = re[0].length;

    for (let y = 0; y < h; y++) ifft1d(re[y], im[y]);

    for (let x = 0; x < w; x++) {
        const colRe = new Float64Array(h);
        const colIm = new Float64Array(h);
        for (let y = 0; y < h; y++) {
            colRe[y] = re[y][x];
            colIm[y] = im[y][x];
        }

        ifft1d(colRe, colIm);

        for (let y = 0; y < h; y++) {
            re[y][x] = colRe[y];
            im[y][x] = colIm[y];
        }
    }
}

async function fileReaderToMatrix(fileReader) {
    return new Promise(resolve => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);

            const imgData = ctx.getImageData(0, 0, img.width, img.height);
            const data = imgData.data;

            const matrix = [];
            for (let y = 0; y < img.height; y++) {
                const row = new Float64Array(img.width);
                for (let x = 0; x < img.width; x++) {
                    const idx = (y * img.width + x) * 4;
                    row[x] = (data[idx] + data[idx+1] + data[idx+2]) / 3;
                }
                matrix.push(row);
            }

            resolve({ width: img.width, height: img.height, data: matrix });
        };
        img.src = fileReader.result;
    });
}

function applyButterworthLowPass(re, im, cutoff, order = 2) {
    const h = re.length;
    const w = re[0].length;
    const cy = h / 2;
    const cx = w / 2;

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const d = Math.sqrt((x - cx)**2 + (y - cy)**2);
            const hval = 1 / (1 + (d / cutoff)**(2*order));
            re[y][x] *= hval;
            im[y][x] *= hval;
        }
    }
}

function matrixToImageMatrix(mat) {
    return {
        width: mat[0].length,
        height: mat.length,
        data: mat
    };
}

export function filterButterworth(file: FileReader): ImageMatrix {
    return (async () => {
        const img = await fileReaderToMatrix(file);

        const re = img.data.map(r => Float64Array.from(r));
        const im = img.data.map(r => new Float64Array(r.length));

        fft2d(re, im);
        applyButterworthLowPass(re, im, 50, 2);
        ifft2d(re, im);

        const result = re.map(row =>
            Float64Array.from(row.map(v => Math.max(0, Math.min(255, v))))
        );

        return matrixToImageMatrix(result);
    })();
}
