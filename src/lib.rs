use wasm_bindgen::prelude::*;
extern crate web_sys;
use glam::Vec3A;
use serde::{Deserialize, Serialize};

// rustup component add rust-src --toolchain nightly-2022-04-07-x86_64-pc-windows-msvc

// A macro to provide `println!(..)`-style syntax for `console.log` logging.
#[allow(unused_macros)]
macro_rules! log {
    ( $( $t:tt )* ) => {
        web_sys::console::log_1(&format!( $( $t )* ).into());
    }
}

mod raytracer;

#[derive(Serialize, Deserialize, Debug)]
struct CameraBuilder {
    position: Vec3A,
    lookat: Vec3A,
    vup: Vec3A,
    vfov: f32,
    aperture: f32,
    focal_length: f32,
}

// to build call: wasm-pack build --target web

#[wasm_bindgen]
pub fn run_raytracer(
    width: usize,
    height: usize,
    samples_per_pixel: u16,
    depth: u16,
    objects_js: &JsValue,
    camera_js: &JsValue,
) -> JsValue {
    let mut objects2: raytracer::Objects = objects_js.into_serde().unwrap();
    let camera_builder: CameraBuilder = camera_js.into_serde().unwrap();
    // let mut objects = raytracer::Objects::new();
    // raytracer::random_scene(&mut objects, 0);

    let aspect_ratio: f32 = (width as f32) / (height as f32);

    let camera = raytracer::Camera::new(
        camera_builder.position,
        camera_builder.lookat,
        camera_builder.vup,
        camera_builder.vfov,
        aspect_ratio,
        camera_builder.aperture,
        camera_builder.focal_length,
    );

    let image = raytracer::Image::render_scene(
        width,
        height,
        samples_per_pixel,
        depth,
        &mut objects2,
        &camera,
    );

    JsValue::from_serde(&image.pixels).unwrap()
}
