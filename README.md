# Ray Tracing

An implementation of [Ray Tracing in One Weekend](https://raytracing.github.io/books/RayTracingInOneWeekend.html) using Rust, with a web user interface to build scenes using WASM and [Tweakpane](https://cocopon.github.io/tweakpane/).

To build the web version run [lib.rs](src/lib.rs) by caling: `wasm-pack build --target web`.

To build the native version run [main.rs](src/main.rs) by caling: `cargo run --bin raytracer_bin --release`. The native version utilises multithreading via [Rayon](https://github.com/rayon-rs/rayon).
