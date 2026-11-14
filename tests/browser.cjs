const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { chromium, firefox, webkit } = require("playwright");
const root = path.resolve(__dirname, "..");
const out = path.join(root, "test-results");
fs.mkdirSync(out, { recursive: true });
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".woff": "font/woff",
  ".jpg": "image/jpeg",
  ".png": "image/png",
};
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(
    new URL(req.url, "http://localhost").pathname,
  );
  const filename = path.resolve(
    root,
    "." + (pathname === "/" ? "/index.html" : pathname),
  );
  if (!filename.startsWith(root + path.sep)) {
    res.writeHead(403).end();
    return;
  }
  fs.readFile(filename, (error, data) => {
    res.writeHead(error ? 404 : 200, {
      "Content-Type":
        types[path.extname(filename)] || "application/octet-stream",
    });
    res.end(error ? "Not found" : data);
  });
});
(async () => {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  const summary = [];
  try {
    for (const [name, engine] of Object.entries({
      chromium,
      firefox,
      webkit,
    })) {
      const browser = await engine.launch();
      try {
        const page = await browser.newPage({
          viewport: { width: 1440, height: 1000 },
        });
        const errors = [];
        page.on("pageerror", (error) => errors.push(String(error)));
        page.on("response", (response) => {
          if (response.status() >= 400)
            errors.push(`${response.status()} ${response.url()}`);
        });
        for (const width of [320, 390, 768, 1024, 1440]) {
          await page.setViewportSize({ width, height: 1000 });
          await page.goto(url);
          await page.evaluate(() => document.fonts.ready);
          assert.equal(await page.locator("h1").innerText(), "José Neto.");
          assert.equal(await page.locator(".project").count(), 3);
          const overflow = await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth,
          );
          if (overflow) {
            const offenders = await page
              .locator("body *")
              .evaluateAll((elements) =>
                elements
                  .map((el) => ({
                    tag: el.tagName,
                    cls: el.className,
                    left: el.getBoundingClientRect().left,
                    right: el.getBoundingClientRect().right,
                  }))
                  .filter((el) => el.left < -1 || el.right > innerWidth + 1),
              );
            console.error(JSON.stringify({ name, width, offenders }, null, 2));
            await page.screenshot({
              path: path.join(out, `${name}-${width}-failure.png`),
              fullPage: true,
              animations: "disabled",
            });
          }
          assert.equal(
            overflow,
            false,
            `${name}/${width}: horizontal overflow`,
          );
          // Scroll lazy images into view before validating/saving the full page.
          for (const image of await page.locator("main img").all()) {
            await image.scrollIntoViewIfNeeded();
            await image.evaluate((img) => img.decode());
          }
          await page.evaluate(() => window.scrollTo(0, 0));
          await page.screenshot({
            path: path.join(out, `${name}-${width}.png`),
            fullPage: true,
            animations: "disabled",
          });
          await page.addScriptTag({
            path: require.resolve("axe-core/axe.min.js"),
          });
          const axe = await page.evaluate(() =>
            axe.run(document, {
              runOnly: {
                type: "tag",
                values: [
                  "wcag2a",
                  "wcag2aa",
                  "wcag21a",
                  "wcag21aa",
                  "best-practice",
                ],
              },
            }),
          );
          fs.writeFileSync(
            path.join(out, `axe-${name}-${width}.json`),
            JSON.stringify(axe, null, 2),
          );
          assert.deepEqual(
            axe.violations.map((v) => `${v.id}: ${v.description}`),
            [],
            `${name}/${width}: accessibility`,
          );
          summary.push(`${name} ${width}px: layout, images, axe PASS`);
        }
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto(url);
        const toggle = page.locator(".menu-toggle");
        await toggle.click();
        assert.equal(await toggle.getAttribute("aria-expanded"), "true");
        await toggle.press("Escape");
        assert.equal(await toggle.getAttribute("aria-expanded"), "false");
        assert.equal(
          await toggle.evaluate((el) => el === document.activeElement),
          true,
        );
        await toggle.click();
        await page.locator('.nav a[href="#projetos"]').click();
        assert.equal(await toggle.getAttribute("aria-expanded"), "false");
        await page.locator("[data-certificate]").first().click();
        assert.equal(
          await page.locator("dialog").evaluate((el) => el.open),
          true,
        );
        await page.locator(".dialog-image").evaluate((img) => img.decode());
        await page
          .getByRole("button", { name: "Fechar certificado" })
          .press("Escape");
        assert.equal(
          await page.locator("dialog").evaluate((el) => el.open),
          false,
        );
        assert.equal(
          await page
            .locator("[data-certificate]")
            .first()
            .evaluate((el) => el === document.activeElement),
          true,
        );
        await page.locator("[data-certificate]").last().click();
        await page.getByRole("button", { name: "Fechar certificado" }).click();
        assert.equal(
          await page.locator("dialog").evaluate((el) => el.open),
          false,
        );
        await page.emulateMedia({ reducedMotion: "reduce" });
        assert.equal(
          await page.evaluate(
            () => getComputedStyle(document.documentElement).scrollBehavior,
          ),
          "auto",
        );
        assert.equal(
          await page
            .locator(".hero-copy")
            .evaluate((el) => getComputedStyle(el).animationName),
          "none",
        );
        assert.deepEqual(errors, [], `${name}: browser/network errors`);
        // Progressive enhancement: all content and menu links remain accessible without JS.
        const noJS = await browser.newContext({
          javaScriptEnabled: false,
          viewport: { width: 390, height: 844 },
        });
        const fallback = await noJS.newPage();
        await fallback.goto(url);
        assert.equal(
          await fallback.locator('.nav a[href="#projetos"]').isVisible(),
          true,
        );
        assert.equal(await fallback.locator(".menu-toggle").isVisible(), false);
        assert.equal(await fallback.locator(".project").count(), 3);
        assert.equal(
          await fallback
            .locator("[data-certificate]")
            .first()
            .getAttribute("href"),
          "assets/certificado-java.jpg",
        );
        await noJS.close();
        summary.push(
          `${name}: menu/Escape/focus, certificates, reduced motion, no-JS PASS`,
        );
      } finally {
        await browser.close();
      }
    }
    fs.writeFileSync(path.join(out, "summary.txt"), summary.join("\n") + "\n");
    console.log(summary.join("\n"));
  } finally {
    server.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
