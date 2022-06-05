use glam::Vec3A;
use std::time::Instant;

mod raytracer;

// to build call
// cargo run --bin raytracer_bin
// cargo run --bin raytracer_bin --release

fn main() {
    println!("Raytracer");
    let now = Instant::now();

    // let scale = 2;
    let width = 1920;
    let height = 1080;
    let samples_per_pixel = 20;
    let depth = 10;

    let mut objects = raytracer::Objects::new();

    raytracer::random_scene(&mut objects, 0);

    let aspect_ratio: f32 = (width as f32) / (height as f32);

    let position = Vec3A::new(13.0, 2.0, 3.0);
    let lookat = Vec3A::new(0.0, 0.0, 0.0);
    let vup = Vec3A::new(0.0, 1.0, 0.0);
    let vfov = 20.0;
    let aperture = 0.1;
    let focal_length = 10.0;

    let camera = raytracer::Camera::new(
        position,
        lookat,
        vup,
        vfov,
        aspect_ratio,
        aperture,
        focal_length,
    );

    let image = raytracer::Image::render_scene(
        width,
        height,
        samples_per_pixel,
        depth,
        &mut objects,
        &camera,
    );

    image.write();
    println!("Complete: {} s", now.elapsed().as_micros() as f32 / 1e6);
}
