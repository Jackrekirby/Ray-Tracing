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

    let image =
        raytracer::Image::render_scene(width, height, samples_per_pixel, depth, &mut objects);

    image.write();
    println!("Complete: {} s", now.elapsed().as_micros() as f32 / 1e6);
}
