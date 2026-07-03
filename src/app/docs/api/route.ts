/**
 * Interactive OpenAPI reference (Scalar). A plain HTML shell loading the
 * standalone Scalar bundle from CDN against our /openapi.json — kept out of
 * the Next bundle so the docs stay dependency-free.
 */
const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>API reference — ExerciseAPI</title>
  <link rel="icon" href="/icon.svg" type="image/svg+xml" />
  <style>body { margin: 0; background: #0b0d10; }</style>
</head>
<body>
  <div id="app"></div>
  <script
    src="https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.62.3/dist/browser/standalone.min.js"
    integrity="sha384-62cw6KEINVUwy5jIeAaFn/t2BG+1UJdsrFITwC9HzgUKeVvq2jf8eYVDcxzAluqR"
    crossorigin="anonymous"></script>
  <script>
    Scalar.createApiReference('#app', {
      url: '/openapi.json',
      theme: 'deepSpace',
      hideDarkModeToggle: true,
      metaData: { title: 'API reference — ExerciseAPI' },
    })
  </script>
</body>
</html>`;

export function GET(): Response {
  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
