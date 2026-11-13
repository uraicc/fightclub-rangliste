#!/usr/bin/env node
/**
 * Fightclub → kie.ai video generation CLI
 *
 * Usage:
 *   node kie/generate-video.mjs --dry-run
 *   node kie/generate-video.mjs --model wan/3-0-video --refs url1,url2,...
 *   node kie/generate-video.mjs --model veo-3-1 --tier veo3_fast --refs url1,url2,url3
 *
 * Env:
 *   KIE_API_KEY  (required for real calls; never commit)
 */

import { createTask, getCredits, getTask, waitForTask } from "./client.mjs";
import {
  CHATTYGERUESTE_PROMPT,
  REFERENCE_ORDER,
} from "./prompts/chattygerueste.mjs";

function parseArgs(argv) {
  const out = {
    model: "wan/3-0-video",
    tier: "veo3_fast",
    duration: 8,
    resolution: "720P",
    aspectRatio: "16:9",
    audio: true,
    wait: false,
    dryRun: false,
    credits: false,
    refs: [],
    prompt: CHATTYGERUESTE_PROMPT,
  };

  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    const next = argv[i + 1];
    if (a === "--dry-run") out.dryRun = true;
    else if (a === "--wait") out.wait = true;
    else if (a === "--credits") out.credits = true;
    else if (a === "--model" && next) {
      out.model = next;
      i++;
    } else if (a === "--tier" && next) {
      out.tier = next;
      i++;
    } else if (a === "--duration" && next) {
      out.duration = Number(next);
      i++;
    } else if (a === "--resolution" && next) {
      out.resolution = next;
      i++;
    } else if (a === "--aspect" && next) {
      out.aspectRatio = next;
      i++;
    } else if (a === "--refs" && next) {
      out.refs = next.split(",").map((s) => s.trim()).filter(Boolean);
      i++;
    } else if (a === "--prompt-file" && next) {
      // reserved for future file prompts
      i++;
    } else if (a === "--help" || a === "-h") {
      printHelp();
      process.exit(0);
    }
  }
  return out;
}

function printHelp() {
  console.log(`Fightclub kie.ai video generator

Options:
  --model <id>         wan/3-0-video (default) | veo-3-1
  --tier <id>          veo only: veo3_fast | veo3_lite | veo3
  --refs <urls>        comma-separated public image URLs
  --duration <sec>     duration (model-dependent)
  --resolution <res>   e.g. 720P / 1080P
  --aspect <ratio>     e.g. 16:9
  --wait               poll until finished
  --credits            print remaining credits and exit
  --dry-run            print payload only, no API call

Reference order for Chattygerüste:
  ${REFERENCE_ORDER.map((n, i) => `${i + 1}. ${n}`).join("\n  ")}

Note: Veo REFERENCE_2_VIDEO supports max 3 images.
      Wan reference_image_urls supports up to 10 images.
`);
}

function buildPayload(opts) {
  if (opts.model === "veo-3-1") {
    const input = {
      model: opts.tier,
      prompt: opts.prompt,
      aspect_ratio: opts.aspectRatio,
    };
    if (opts.refs.length) {
      if (opts.refs.length > 3) {
        throw new Error(
          "Veo REFERENCE_2_VIDEO erlaubt max. 3 Refs. Nutze --model wan/3-0-video für bis zu 10."
        );
      }
      input.generation_type = "REFERENCE_2_VIDEO";
      input.image_urls = opts.refs;
    } else {
      input.generation_type = "TEXT_2_VIDEO";
    }
    return { model: "veo-3-1", input };
  }

  // Default: Wan 3.0 — best for up to 10 character refs
  const input = {
    prompt: opts.prompt,
    resolution: opts.resolution,
    aspect_ratio: opts.aspectRatio,
    duration: opts.duration,
    audio: opts.audio,
  };
  if (opts.refs.length) {
    if (opts.refs.length > 10) {
      throw new Error("Wan reference_image_urls: max. 10 Bilder");
    }
    input.reference_image_urls = opts.refs;
  }
  return { model: "wan/3-0-video", input };
}

async function main() {
  const opts = parseArgs(process.argv);

  if (opts.credits) {
    const credits = await getCredits();
    console.log(JSON.stringify(credits, null, 2));
    return;
  }

  const payload = buildPayload(opts);

  if (opts.dryRun) {
    console.log(
      JSON.stringify(
        {
          note: "dry-run — kein API-Call",
          referenceOrder: REFERENCE_ORDER,
          payload,
        },
        null,
        2
      )
    );
    return;
  }

  if (!process.env.KIE_API_KEY?.trim()) {
    console.error(
      "KIE_API_KEY fehlt. Secret im Cursor-Dashboard setzen oder lokal exportieren."
    );
    process.exit(1);
  }

  const created = await createTask(payload);
  const taskId =
    created?.data?.taskId || created?.data?.task_id || created?.taskId;
  console.log(JSON.stringify({ created, taskId }, null, 2));

  if (!opts.wait || !taskId) return;

  const result = await waitForTask(taskId);
  console.log(JSON.stringify({ result }, null, 2));
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
