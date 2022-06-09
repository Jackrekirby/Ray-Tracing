use glam::Vec3A;
use std::time::Instant;
extern crate queues;
use queues::*;

mod raytracer;

// to build call
// cargo run --bin raytracer_bin
// cargo run --bin raytracer_bin --release

#[allow(dead_code)]
fn call_bv(bvs: &mut [raytracer::BoundingVolume; 2], spheres: &mut Vec<raytracer::Sphere>) {
    bvs.iter_mut().for_each(|bv| {
        let spheres_slice = bv.slice(spheres);
        if spheres_slice.len() > 1 {
            let mut bvs2 = raytracer::bounding_hierachy(bv, spheres_slice);
            call_bv(&mut bvs2, spheres);
        }
    });
}

#[allow(dead_code)]
fn ttt(bvs: &mut Vec<raytracer::BoundingVolume>, spheres: &mut Vec<raytracer::Sphere>, i: usize) {
    let ss: &mut [raytracer::Sphere] = &mut spheres[bvs[i].mini..bvs[i].maxi];
    let (min, max, cov, k) = raytracer::calc_test(ss);
    let j = raytracer::bounding_hierachy2(ss, k, cov);

    // let (j, min, max) = raytracer::bounding_hierachy2(&mut objects.spheres);
    println!("{}, {}, {}, {}, {}", min, max, cov, k, j);
    let aa = raytracer::BoundingVolume::new(bvs[i].mini, bvs[i].mini + j);
    bvs.push(aa);
    let ab = raytracer::BoundingVolume::new(bvs[i].mini + j, bvs[i].maxi);
    bvs.push(ab);

    bvs[i].min = min;
    bvs[i].max = max;
}

#[allow(dead_code)]
fn call_bv2(
    index: usize,
    spheres: &mut Vec<raytracer::Sphere>,
    bvs: &mut Vec<raytracer::BoundingVolume>,
    bvt: &mut Vec<usize>,
) {
    let mini = bvs[index].mini;
    let maxi = bvs[index].maxi;
    let s: &[raytracer::Sphere] = &spheres[mini..maxi];
    let cov = raytracer::calc_cov(s);
    let k = raytracer::calc_k(s);
    let ss: &mut [raytracer::Sphere] = &mut spheres[mini..maxi];
    let j = raytracer::bounding_hierachy2(ss, k, cov);

    let bvslen = bvs.len();
    bvt[index] = bvslen;

    raytracer::add_bounding_volume(bvs, &spheres, mini, mini + j);
    bvt.push(0);
    raytracer::add_bounding_volume(bvs, &spheres, mini + j, maxi);
    bvt.push(0);

    println!("a: {}\t{}\t{}", cov, k, j);
    println!("b: {}\t{}\t{}", mini, mini + j, maxi);
    if j > 1 && maxi != (mini + j) {
        call_bv2(bvslen, spheres, bvs, bvt);
    }
    if j != 0 && maxi - (mini + j) > 1 {
        call_bv2(bvslen + 1, spheres, bvs, bvt);
    }
}

#[allow(dead_code)]
fn init_raytracer() {
    println!("Raytracer");
    let now = Instant::now();

    let scale = 8;
    let width = 1920 / scale;
    let height = 1080 / scale;
    let samples_per_pixel = 255;
    let depth = 50;

    let mut objects = raytracer::Objects::new();

    let aspect_ratio: f32 = (width as f32) / (height as f32);

    let position = Vec3A::new(13.0, 1.5, 7.0);
    let lookat = Vec3A::new(0.0, 0.0, 0.0);
    let vup = Vec3A::new(0.0, 1.0, 0.0);
    let vfov = 20.0;
    let aperture = 0.0;
    let focal_length = 10.0;

    let mut rng = raytracer::RngCha::new(1);

    let camera = raytracer::Camera::new(
        position,
        lookat,
        vup,
        vfov,
        aspect_ratio,
        aperture,
        focal_length,
    );

    raytracer::random_scene(&mut objects, 10, position, &mut rng);
    objects.calculate_bounding_volumes();

    println!("built random scene");

    let images = raytracer::render_scene2(
        width,
        height,
        samples_per_pixel,
        depth,
        &mut objects,
        &camera,
    );

    images[0].write_png(String::from("image_color.png"));
    images[1].write_png(String::from("image_samples.png"));
    // image.write_ppm(String::from("image.ppm"));

    println!("Complete: {} s", now.elapsed().as_micros() as f32 / 1e6);
}

#[allow(dead_code)]
fn test_bv() {
    let mut objects = raytracer::Objects::new();
    let position = Vec3A::new(13.0, 1.5, 7.0);
    let mut rng = raytracer::RngCha::new(1);

    raytracer::random_scene(&mut objects, 0, position, &mut rng);

    // let mut bvt: Vec<usize> = Vec::new();
    // let mut bvs: Vec<raytracer::BoundingVolume> = Vec::new();

    objects.calculate_bounding_volumes();

    // raytracer::add_bounding_volume(&mut bvs, &objects.spheres, 0, objects.spheres.len());
    // bvt.push(0);
    // objects.calc_bvh(index: usize)

    // call_bv2(0, &mut objects.spheres, &mut bvs, &mut bvt);

    // println!("no. spheres: {}", objects.spheres.len());
    // // println!("{:?}", bvt);
    // // println!("{:?}", bvs);

    let mut intersection = raytracer::Intersection::default();
    let ray = raytracer::Ray::new(position, -position);

    hit_test(0, &ray, &mut intersection, &mut objects);
}

fn hit_test(
    index: usize,
    ray: &raytracer::Ray,
    intersection: &mut raytracer::Intersection,
    objects: &mut raytracer::Objects,
) {
    let mut queue: Queue<usize> = queue![];
    queue.add(0).expect("could not add zero to queue");
    while queue.size() > 0 {
        // println!("queue: {:?}", queue);
        let i = queue.remove().expect("could not remove from queue");
        let t_max = intersection.time.clone();
        let hit = objects.bvs[i].hit(&ray, 0.0, t_max);
        if hit {
            let j = objects.bvi[i];
            if j != 0 {
                queue.add(j).expect("could not add j to queue");
                queue.add(j + 1).expect("could not add j+1 to queue");
            } else {
                let k = objects.bvs[i].mini;
                let hit_sphere = objects.spheres[k].hit(&ray, intersection, 0.0, t_max);
                if hit_sphere {
                    println!("hit {}, {} {}", k, t_max, intersection.time);
                }
            }
        }
    }

    // let t_max = intersection.time.clone();
    //     let hit = bvs[index].hit(&ray, 0.0, t_max);
    //     if hit {
    //         let j = bvt[index];
    //         if j != 0 {
    //             hit_test(j, &ray, intersection, bvs, bvt, &spheres);
    //             hit_test(j + 1, &ray, intersection, bvs, bvt, &spheres);
    //         } else {
    //             let k = bvs[index].mini;
    //             let hit_sphere = spheres[k].hit(&ray, intersection, 0.0, t_max);
    //             println!("{} {}", k, hit_sphere);
    //         }
    //     }
}

fn main() {
    // test_bv();
    init_raytracer();
}
