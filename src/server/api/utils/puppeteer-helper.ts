import puppeteer from "puppeteer";
import puppeteerCore from "puppeteer-core";
import chromium from "@sparticuz/chromium-min";
import type { Browser as CoreBrowser } from "puppeteer-core";

export async function getBrowser(): Promise<CoreBrowser> {
    if (process.env.NODE_ENV === "development") {
      console.log("Using regular Puppeteer in development mode");
      return (await puppeteer.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--disable-gpu",
        ],
      })) as unknown as CoreBrowser;
    } else {
      console.log("Using Puppeteer Core in production mode");
      const options = {
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
        ignoreHTTPSErrors: true,
      };
      return await puppeteerCore.launch(options);
    }
  }