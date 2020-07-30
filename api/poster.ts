import { NowRequest, NowResponse } from "@vercel/node";
import puppeteer from "puppeteer";
import htm from "htm";
import vhtml from "vhtml";

const html = htm.bind(vhtml);

const browserlessToken = process.env.BROWSERLESS_TOKEN;

function renderHTML({
  headline,
  source,
}: {
  headline: string;
  source: string;
}): string {
  const result = html`<html lang="en">
    <head>
      <meta charset="utf-8" />
      <link rel="preconnect" href="https://rsms.me" />

      <meta name="viewport" content="width=device-width, initial-scale=1" />

      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font: inherit;
        }

        :root {
          font-size: 150%;
          text-rendering: optimizeLegibility;
        }

        @import url("https://rsms.me/inter/inter.css");
        html {
          font-family: "Inter", sans-serif;
        }
        @supports (font-variation-settings: normal) {
          html {
            font-family: "Inter var", sans-serif;
          }
        }

        .cool {
          background-color: rgba(89, 108, 186, 1);
          background-image: linear-gradient(
            150grad,
            rgba(76, 111, 186, 1) 0%,
            rgba(0, 125, 185, 1) 33.33333333333333%,
            rgba(89, 108, 186, 1) 66.66666666666666%,
            rgba(167, 70, 187, 1) 100%
          );
          border: 2rem solid rgba(0, 0, 0, 50%);
        }
      </style>
    </head>
    <body
      class="cool"
      style="display: flex; justify-content: center; width: 1200px; height: 630px;"
    >
      <div style="display: flex; align-content: stretch; padding: 3rem;">
        <div
          style="display: flex; flex-direction: column; justify-content: center; align-items: center;"
        >
          <h1 style="font-size: 3rem; color: white;">${headline}</h1>
          <div style="height: 2rem;"></div>
          <h2 style="font-size: 2.5rem; font-weight: bold; color: white;">
            ${source}
          </h2>
        </div>
      </div>
    </body>
  </html>`;

  const document = new Array<string>().concat(result).join("\n");

  return `<!DOCTYPE html>${document}`;
}

export default async function poster(req: NowRequest, res: NowResponse) {
  let headline = new Array<string>().concat(req.query.headline).join("");
  let source = new Array<string>().concat(req.query.source).join("");

  if (!source) {
    source = "source";
    headline = "headline";
  }

  if (req.query.raw) {
    res.send(renderHTML({ headline, source }));
    return;
  }

  const browser = await puppeteer.connect({
    browserWSEndpoint: `wss://chrome.browserless.io?token=${browserlessToken}`,
  });

  const page = await browser.newPage();

  page.setContent(renderHTML({ headline, source }), {
    waitUntil: "networkidle0",
  });

  page.setViewport({
    width: 1200,
    height: 630,
    deviceScaleFactor: 2,
  });

  // await page.goto('http://www.example.com/');
  const screenshot = await page.screenshot();

  res.end(screenshot, "binary");

  browser.close();
}
