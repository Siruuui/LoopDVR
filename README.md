# LoopDVR project page

Open `index.html` directly in a browser. The repository is a static site, with all scripts, data used by the page, and media included.

```text
index.html          Page entry point
css/                Page and Results styles
js/                 Gallery, video players, Results chart, and benchmark data
assets/
  cases/            9 original JPEGs with task annotations and a canvas renderer
  charts/           Benchmark comparison figures
  figures/          Method figure
  videos/           Qualitative, Method, and Looped Inference videos
```

For GitHub Pages, select **Deploy from a branch** in **Settings → Pages**, then choose the branch and **/ (root)**. The repository root is ready to serve as-is.

The interactive Results data is in `js/results-data.js`. The case images are in `assets/cases/images/`.
