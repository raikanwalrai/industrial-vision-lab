# Industrial Vision — Filter Lab

Interactive Chapter 3 companion for image filtering, derivatives, Laplacian, sharpening, noise and CNN intuition.

## Local development

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

## Cloudflare Pages + GitHub

Recommended deployment model: **Cloudflare Pages Git integration**.

1. Create a GitHub repository, for example `industrial-vision-filter-lab`.
2. Push this project to the `main` branch.
3. In Cloudflare Dashboard open **Workers & Pages → Create application → Pages → Connect to Git**.
4. Authorize GitHub and select the repository.
5. Production branch: `main`.
6. Build command: `npm run build`.
7. Build output directory: `dist`.
8. Save and deploy.

After that, pushes to `main` automatically build and deploy production. Pull requests/preview branches can receive Cloudflare preview URLs.

## Current features

- Multiple synthetic images/scenes
- Box 3×3 and 9×9
- Gaussian
- Sobel X/Y
- Prewitt X/Y
- first and second derivative kernels
- Laplacian 4/8 neighbour
- LoG-like kernel
- sharpening
- custom kernel editor
- optional kernel normalization
- kernel sum / energy / noise-gain statistics
- input/output image statistics
- per-pixel convolution arithmetic
- browser-only processing

## Next planned modules

1. Gaussian-noise and salt-and-pepper controls
2. Median filtering
3. Gradient magnitude
4. Thresholding
5. Unsharp masking
6. Laplacian decomposition check
7. Receptive-field visualizer
8. CNN learned-filter demo
9. Chapter navigation and theory panels
