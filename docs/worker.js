import init, { run_raytracer } from "./raytracer_lib.js";

onmessage = function (e) {
    const fnc = {
        init: () => {
            init().then(() => postMessage({ action: 'init', complete: true }));
        },
        render: () => {
            const a = e.data.arguments;
            console.log(a);
            const output = run_raytracer(
                a.width,
                a.height,
                a.samples,
                a.depth,
                a.objects,
                a.camera,
            );
            postMessage({ action: 'render', start: e.data.start, output: output });
        }

    }
    fnc[e.data.action]();
}