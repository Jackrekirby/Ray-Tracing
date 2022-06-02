use wasm_bindgen::prelude::*;

mod raytracer;

// to build call: wasm-pack build --target web

#[wasm_bindgen]
pub fn run_raytracer(width: usize, height: usize, samples_per_pixel: u16, depth: u16) -> JsValue {
    let image = raytracer::Image::render_scene(width, height, samples_per_pixel, depth);

    JsValue::from_serde(&image.pixels).unwrap()
}
