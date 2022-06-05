use wasm_bindgen::prelude::*;
extern crate web_sys;

// rustup component add rust-src --toolchain nightly-2022-04-07-x86_64-pc-windows-msvc

// A macro to provide `println!(..)`-style syntax for `console.log` logging.
#[allow(unused_macros)]
macro_rules! log {
    ( $( $t:tt )* ) => {
        web_sys::console::log_1(&format!( $( $t )* ).into());
    }
}

mod raytracer;

// to build call: wasm-pack build --target web

#[wasm_bindgen]
pub fn run_raytracer(
    width: usize,
    height: usize,
    samples_per_pixel: u16,
    depth: u16,
    objects_js: &JsValue,
) -> JsValue {
    let mut objects2: raytracer::Objects = objects_js.into_serde().unwrap();
    // let mut objects = raytracer::Objects::new();
    // raytracer::random_scene(&mut objects, 0);

    let image =
        raytracer::Image::render_scene(width, height, samples_per_pixel, depth, &mut objects2);

    JsValue::from_serde(&image.pixels).unwrap()
}
