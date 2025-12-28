import { renderers } from './renderers.mjs';
import { c as createExports } from './chunks/entrypoint_CxwLsURe.mjs';
import { manifest } from './manifest_CX_YkqwC.mjs';

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/404.astro.mjs');
const _page2 = () => import('./pages/about.astro.mjs');
const _page3 = () => import('./pages/api/send-newsletter.astro.mjs');
const _page4 = () => import('./pages/api/subscribe.astro.mjs');
const _page5 = () => import('./pages/api/test-redis.astro.mjs');
const _page6 = () => import('./pages/api/test-subscribers.astro.mjs');
const _page7 = () => import('./pages/api/unsubscribe.astro.mjs');
const _page8 = () => import('./pages/base.astro.mjs');
const _page9 = () => import('./pages/curated.astro.mjs');
const _page10 = () => import('./pages/post/_slug_.astro.mjs');
const _page11 = () => import('./pages/posts.astro.mjs');
const _page12 = () => import('./pages/projects/cash.astro.mjs');
const _page13 = () => import('./pages/projects/darkrunner.astro.mjs');
const _page14 = () => import('./pages/projects/dozr.astro.mjs');
const _page15 = () => import('./pages/projects/gridgenius.astro.mjs');
const _page16 = () => import('./pages/projects/millenai.astro.mjs');
const _page17 = () => import('./pages/projects/puffnotes.astro.mjs');
const _page18 = () => import('./pages/projects/syncly.astro.mjs');
const _page19 = () => import('./pages/projects/tapsense.astro.mjs');
const _page20 = () => import('./pages/projects/tessro.astro.mjs');
const _page21 = () => import('./pages/projects/ublretail.astro.mjs');
const _page22 = () => import('./pages/projects/unix.astro.mjs');
const _page23 = () => import('./pages/projects.astro.mjs');
const _page24 = () => import('./pages/uses.astro.mjs');
const _page25 = () => import('./pages/index.astro.mjs');

const pageMap = new Map([
    ["node_modules/.pnpm/astro@4.16.19_@types+node@22.19.3_rollup@4.46.2_typescript@5.4.5/node_modules/astro/dist/assets/endpoint/generic.js", _page0],
    ["src/pages/404.astro", _page1],
    ["src/pages/about.astro", _page2],
    ["src/pages/api/send-newsletter.ts", _page3],
    ["src/pages/api/subscribe.ts", _page4],
    ["src/pages/api/test-redis.ts", _page5],
    ["src/pages/api/test-subscribers.ts", _page6],
    ["src/pages/api/unsubscribe.ts", _page7],
    ["src/pages/base.astro", _page8],
    ["src/pages/curated.astro", _page9],
    ["src/pages/post/[slug].astro", _page10],
    ["src/pages/posts.astro", _page11],
    ["src/pages/projects/cash.astro", _page12],
    ["src/pages/projects/darkrunner.astro", _page13],
    ["src/pages/projects/dozr.astro", _page14],
    ["src/pages/projects/gridgenius.astro", _page15],
    ["src/pages/projects/millenai.astro", _page16],
    ["src/pages/projects/puffnotes.astro", _page17],
    ["src/pages/projects/syncly.astro", _page18],
    ["src/pages/projects/tapsense.astro", _page19],
    ["src/pages/projects/tessro.astro", _page20],
    ["src/pages/projects/ublretail.astro", _page21],
    ["src/pages/projects/unix.astro", _page22],
    ["src/pages/projects.astro", _page23],
    ["src/pages/uses.astro", _page24],
    ["src/pages/index.astro", _page25]
]);
const serverIslandMap = new Map();
const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    middleware: () => import('./_noop-middleware.mjs')
});
const _args = {
    "middlewareSecret": "46dc346d-b255-4ea6-8077-5b0d665b1dab",
    "skewProtection": false
};
const _exports = createExports(_manifest, _args);
const __astrojsSsrVirtualEntry = _exports.default;

export { __astrojsSsrVirtualEntry as default, pageMap };
