import dayjs from "dayjs";
import ejs from "ejs";
import { sampleSize } from "es-toolkit";
import pino from "pino";

const logger = pino({ timestamp: () => `,"time":"${dayjs().format()}"` });

const DATA_FILE = Bun.file("data/list.md");
const TEMPLATE_FILE = Bun.file("templates/index.ejs");
const OUTPUT_PATH = "out/logs.json";

function parseStrArray(str: string | undefined) {
  return str
    ? str
        .split("|")
        .map((token) => token.trim())
        .filter((token) => !!token)
    : [];
}
const LINE_INCLUDE_FILTERS = parseStrArray(process.env.LINE_INCLUDE_FILTERS);
const LINE_EXCLUDE_FILTERS = parseStrArray(process.env.LINE_EXCLUDE_FILTERS);
const ACTIONS = parseStrArray(process.env.ACTIONS);
logger.info({ LINE_INCLUDE_FILTERS, LINE_EXCLUDE_FILTERS, ACTIONS });

async function getLineToHref() {
  const content = await DATA_FILE.text();

  const entries: [string, string][] = [];
  for (let line of content.split("\n")) {
    line = line.trimStart();
    if (line.startsWith("- ")) line = line.slice(2);
    if (LINE_INCLUDE_FILTERS.some((filter) => !line.includes(filter))) continue;
    if (LINE_EXCLUDE_FILTERS.some((filter) => line.includes(filter))) continue;

    // extract href
    const m = line.match(/https?:\/\/[^\s\>\)]+/);
    if (!m) continue;

    entries.push([line, m[0]]);
  }

  return Object.fromEntries(entries);
}

const server = Bun.serve({
  port: parseInt(process.env.PORT ?? "3000"),
  routes: {
    "/": {
      GET: async () => {
        const lineToHref = await getLineToHref();
        const lines = Object.keys(lineToHref);
        logger.info({ "lines.length": lines.length });

        const selectedLineToHref = Object.fromEntries(
          sampleSize(lines, 10).map((line) => [line, lineToHref[line]!]),
        );

        return new Response(
          ejs.render(await TEMPLATE_FILE.text(), {
            selectedLineToHref,
            ACTIONS,
          }),
          {
            headers: {
              "Content-Type": "text/html; charset=utf-8",
            },
          },
        );
      },
      POST: async (req) => {
        const body = (await req.json()) as {
          href: string;
          text: string;
        };
        logger.info(body);

        const OUTPUT_FILE = Bun.file(OUTPUT_PATH); // see https://github.com/oven-sh/bun/issues/23902
        const logs: { [K: string]: string } = (await OUTPUT_FILE.exists())
          ? await OUTPUT_FILE.json()
          : {};
        logs[body.href] = body.text;
        await Bun.write(OUTPUT_FILE, JSON.stringify(logs, null, 2), {
          createPath: true,
        });

        return new Response("ok");
      },
    },
  },
});
logger.info(`Server running at ${server.url}`);
