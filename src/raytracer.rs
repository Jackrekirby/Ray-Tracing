use glam::{Vec2, Vec3A};
use rand::prelude::*;
use rand_chacha::ChaCha8Rng;
use serde::{Deserialize, Serialize};
use std::fs::File;
use std::io::{BufWriter, Write};
extern crate queues;
use queues::*;

#[cfg(not(target_family = "wasm"))]
use indicatif::{ProgressBar, ProgressStyle};
#[cfg(not(target_family = "wasm"))]
use rayon::iter::{IntoParallelRefMutIterator, ParallelIterator};
#[cfg(not(target_family = "wasm"))]
use rayon::prelude::*;

#[derive(Serialize, Deserialize)]
pub struct Image {
    pub width: usize,
    pub height: usize,
    pub pixels: Vec<[u8; 3]>,
}

pub fn point_on_sphere(
    min_longitude: f32,
    max_longitude: f32,
    min_latitude: f32,
    max_latitude: f32,
    rng: &mut RngCha,
) -> Vec3A {
    let longitude = rng.range_f32(min_longitude, max_longitude); // longitude = rotation around y
                                                                 // let latitude = rand(min_latitude, max_latitude); // latitude = x

    let latitude = min_latitude + rng.range_f32(0.0, 1.0).sqrt() * (max_latitude - min_latitude);

    Vec3A::new(
        longitude.cos() * latitude.sin(),
        latitude.cos(),
        longitude.sin() * latitude.sin(),
    )
}

#[allow(dead_code)]
pub fn random_scene(objects: &mut Objects, n: i16, position: Vec3A, rng: &mut RngCha) {
    let pi = std::f32::consts::PI;

    objects.add_lambert_sphere(
        Sphere {
            origin: Vec3A::new(-4.0, 1.0, 0.0),
            radius: 1.0,
        },
        Lambert {
            color: Vec3A::new(150.0 / 255.0, 150.0 / 255.0, 1.0),
        },
    );

    objects.add_metal_sphere(
        Sphere {
            origin: Vec3A::new(4.0, 1.0, 0.0),
            radius: 1.0,
        },
        Metal {
            color: Vec3A::new(0.5, 0.5, 0.5),
            roughness: 0.0,
        },
    );

    objects.add_dielectric_sphere(
        Sphere {
            origin: Vec3A::new(0.0, 1.0, 0.0),
            radius: 1.0,
        },
        Dielectric {
            refractive_index: 1.5,
        },
    );

    // let mut spheres: Vec<Sphere> = Vec::new();

    let max_latitude = (20.0 / 1000.0 as f32).asin();
    let offset = Vec3A::new(0.0, 1000.0, 0.0);

    for _ in 0..n {
        loop {
            // let radius = 0.2;
            let radius = rng.f32() * 0.8 + 0.3;
            let point = point_on_sphere(0.0, 2.0 * pi, 0.0, max_latitude, rng);
            let origin = (1000.0 + radius) * point - offset;

            let d: f32 = ((origin - position) / 30.0).length().abs().clamp(0.1, 1.0);
            let radius = radius * d;
            let origin = (1000.0 + radius) * point - offset;

            let intersected = objects.spheres.iter().any(|other| -> bool {
                let r = other.radius + radius;
                (other.origin - origin).length_squared() < (r * r)
            });
            if !intersected {
                let sphere = Sphere {
                    origin: origin,
                    radius: radius,
                };

                let r = rng.f32();
                if r < 0.5 {
                    objects.add_lambert_sphere(
                        sphere,
                        Lambert {
                            color: rng.range_vec3a(0.0, 1.0) * rng.range_vec3a(0.0, 1.0),
                        },
                    );
                } else if r < 0.8 {
                    objects.add_metal_sphere(
                        sphere,
                        Metal {
                            color: rng.range_vec3a(0.5, 1.0),
                            roughness: rng.range_f32(0.0, 0.5),
                        },
                    );
                } else {
                    objects.add_dielectric_sphere(
                        sphere,
                        Dielectric {
                            refractive_index: 1.5,
                        },
                    );
                }
                break;
            }
        }
    }

    objects.add_lambert_sphere(
        Sphere {
            origin: Vec3A::new(0.0, -1000.0, 0.0),
            radius: 1000.0,
        },
        Lambert {
            color: Vec3A::new(0.5, 0.5, 0.5),
        },
    );

    // for y in (-n..n).step_by(1) {
    //     for x in (-n..n).step_by(1) {
    //         if x.abs() < 6 && y.abs() < 1 {
    //             continue;
    //         };
    //         let radius = rng.f32() * 0.3 + 0.05;
    //         let origin = point_on_sphere(1000.0 + radius, 0.0, 2.0 * pi, 0.0, 0.02)
    //             - Vec3A::new(0.0, 1000.0, 0.0);
    //         // println!("origin: {}", origin);
    //         // let origin = Vec3A::new(
    //         //     x as f32 + 0.7 * rng.f32(),
    //         //     radius,
    //         //     y as f32 + 0.6 * rng.f32(),
    //         // );
    //         let sphere = Sphere {
    //             origin: origin,
    //             radius: radius,
    //         };

    //         let intersected = spheres.iter().any(|other| -> bool {
    //             let r = other.radius + sphere.radius;
    //             (other.origin - sphere.origin).length_squared() < (r * r)
    //         });
    //         if !intersected {
    //             spheres.push(sphere);
    //         }
    //     }
    // }
}

#[allow(dead_code)]
pub fn default_scene(objects: &mut Objects, rng: &mut RngCha) {
    objects.add_lambert_sphere(
        Sphere {
            origin: Vec3A::new(0.0, -1000.0, 0.0),
            radius: 1000.0,
        },
        Lambert {
            color: Vec3A::new(0.5, 0.5, 0.5),
        },
    );

    objects.add_lambert_sphere(
        Sphere {
            origin: Vec3A::new(-4.0, 1.0, 0.0),
            radius: 1.0,
        },
        Lambert {
            color: rng.range_vec3a(0.0, 1.0) * rng.range_vec3a(0.0, 1.0),
        },
    );

    objects.add_metal_sphere(
        Sphere {
            origin: Vec3A::new(4.0, 1.0, 0.0),
            radius: 1.0,
        },
        Metal {
            color: Vec3A::new(0.5, 0.5, 0.5),
            roughness: 0.0,
        },
    );

    objects.add_dielectric_sphere(
        Sphere {
            origin: Vec3A::new(0.0, 1.0, 0.0),
            radius: 1.0,
        },
        Dielectric {
            refractive_index: 1.5,
        },
    );

    objects.add_dielectric_sphere(
        Sphere {
            origin: Vec3A::new(0.0, 1.0, 0.0),
            radius: -0.9,
        },
        Dielectric {
            refractive_index: 1.5,
        },
    );
}

#[derive(Clone)]
pub struct PixelDelta {
    pixel: Vec3A,
    delta: u8,
}

impl PixelDelta {
    pub fn new() -> Self {
        Self {
            pixel: Vec3A::new(0.0, 0.0, 0.0),
            delta: 0,
        }
    }
}

// impl std::iter::Sum for Vec3A {

// }

#[derive(Serialize, Deserialize, Debug)]
pub struct BoundingVolume {
    pub min: Vec3A,
    pub max: Vec3A,
    pub mini: usize,
    pub maxi: usize,
    pub index: usize,
}

pub fn add_bounding_volume(
    bvs: &mut Vec<BoundingVolume>,
    spheres: &Vec<Sphere>,
    mini: usize,
    maxi: usize,
) {
    let mut min = Vec3A::new(f32::MAX, f32::MAX, f32::MAX);
    let mut max = Vec3A::new(f32::MIN, f32::MIN, f32::MIN);
    for sphere in &spheres[mini..maxi] {
        min = min.min(sphere.origin - sphere.radius);
        max = max.max(sphere.origin + sphere.radius);
    }
    let index = bvs.len();
    bvs.push(BoundingVolume {
        min: min,
        max: max,
        mini: mini,
        maxi: maxi,
        index: index,
    });
}

impl BoundingVolume {
    pub fn new(mini: usize, maxi: usize) -> Self {
        Self {
            min: Vec3A::new(f32::MIN, f32::MIN, f32::MIN),
            max: Vec3A::new(f32::MAX, f32::MAX, f32::MAX),
            mini: mini,
            maxi: maxi,
            index: 0,
        }
    }

    pub fn hit(&self, ray: &Ray, t_min: f32, t_max: f32) -> bool {
        for i in 0..3 {
            let inv_dir = 1.0 / ray.direction[i];
            let min = if inv_dir < 0.0 {
                self.max[i]
            } else {
                self.min[i]
            };
            let max = if inv_dir < 0.0 {
                self.min[i]
            } else {
                self.max[i]
            };
            let t0 = (min - ray.origin[i]) * inv_dir;
            let t1 = (max - ray.origin[i]) * inv_dir;
            // println!("{} {}", t0, t1);
            if t1.min(t_max) <= t0.max(t_min) {
                return false;
            };
        }
        true
    }

    pub fn calc_dims(&mut self, spheres: &[Sphere]) {
        let mut min = Vec3A::new(f32::MAX, f32::MAX, f32::MAX);
        let mut max = Vec3A::new(f32::MIN, f32::MIN, f32::MIN);
        for sphere in spheres {
            min = min.min(sphere.origin - sphere.radius);
            max = max.max(sphere.origin + sphere.radius);
        }
        self.min = min;
        self.max = max;
    }

    pub fn calc_origins_range(&mut self, spheres: &[Sphere]) -> Vec3A {
        let mut min = Vec3A::new(f32::MAX, f32::MAX, f32::MAX);
        let mut max = Vec3A::new(f32::MIN, f32::MIN, f32::MIN);
        for sphere in spheres {
            min = min.min(sphere.origin);
            max = max.max(sphere.origin);
        }
        max - min
    }

    pub fn calc_cov(&self, spheres: &[Sphere]) -> Vec3A {
        let mut total_volume = 0.0;
        let mut cov = Vec3A::new(0.0, 0.0, 0.0);
        for sphere in spheres {
            let volume = 8.0 * sphere.radius.powi(3);
            cov += sphere.origin * volume;
            total_volume += volume;
        }
        cov /= total_volume;
        cov
    }

    pub fn slice<'a>(&self, spheres: &'a mut Vec<Sphere>) -> &'a mut [Sphere] {
        &mut spheres[self.mini..self.maxi]
    }
}

pub fn calc_cov(spheres: &[Sphere]) -> Vec3A {
    let mut total_volume = 0.0;
    let mut cov = Vec3A::new(0.0, 0.0, 0.0);
    for sphere in spheres {
        let volume = 8.0 * sphere.radius.powi(3);
        cov += sphere.origin * volume;
        total_volume += volume;
    }
    cov /= total_volume;

    cov
}

pub fn calc_k(spheres: &[Sphere]) -> usize {
    let mut minr = Vec3A::new(f32::MAX, f32::MAX, f32::MAX);
    let mut maxr = Vec3A::new(f32::MIN, f32::MIN, f32::MIN);
    for sphere in spheres {
        minr = minr.min(sphere.origin);
        maxr = maxr.max(sphere.origin);
    }
    let range = maxr - minr;
    let k: usize = if range.x > range.y {
        if range.x > range.z {
            0
        } else {
            2
        }
    } else {
        if range.y > range.z {
            1
        } else {
            2
        }
    };

    k
}

pub fn calc_test(spheres: &[Sphere]) -> (Vec3A, Vec3A, Vec3A, usize) {
    let mut min = Vec3A::new(f32::MAX, f32::MAX, f32::MAX);
    let mut max = Vec3A::new(f32::MIN, f32::MIN, f32::MIN);

    let mut minr = Vec3A::new(f32::MAX, f32::MAX, f32::MAX);
    let mut maxr = Vec3A::new(f32::MIN, f32::MIN, f32::MIN);

    let mut total_volume = 0.0;
    let mut cov = Vec3A::new(0.0, 0.0, 0.0);
    for sphere in spheres {
        min = min.min(sphere.origin - sphere.radius);
        max = max.max(sphere.origin + sphere.radius);
        minr = minr.min(sphere.origin);
        maxr = maxr.max(sphere.origin);
        let volume = 8.0 * sphere.radius.powi(3);
        cov += sphere.origin * volume;
        total_volume += volume;
    }
    cov /= total_volume;
    let range = maxr - minr;
    let k: usize = if range.x > range.y {
        if range.x > range.z {
            0
        } else {
            2
        }
    } else {
        if range.y > range.z {
            1
        } else {
            2
        }
    };

    (min, max, cov, k)
}

#[allow(dead_code)]
pub fn bounding_hierachy2(spheres: &mut [Sphere], k: usize, cov: Vec3A) -> usize {
    let mut j = 0;
    for i in 0..spheres.len() {
        if spheres[i].origin[k] - spheres[i].radius < cov[k] {
            spheres.swap(i, j);
            j += 1;
        }
    }
    j
}

#[allow(dead_code)]
pub fn bounding_hierachy(bv: &mut BoundingVolume, spheres: &mut [Sphere]) -> [BoundingVolume; 2] {
    bv.calc_dims(&spheres);
    let cov = bv.calc_cov(&spheres);
    let range = bv.calc_origins_range(&spheres);

    // println!("{},\t {}", bv.mini, bv.maxi);

    // println!("xrange: {}", range);

    let mut j = 0;

    if range.x > range.y && range.x > range.z {
        for i in 0..spheres.len() {
            let sphere: &Sphere = &spheres[i];
            if sphere.origin.x - sphere.radius < cov.x {
                spheres.swap(i, j);
                j += 1;
            }
        }
    } else if range.y > range.z {
        for i in 0..spheres.len() {
            let sphere: &Sphere = &spheres[i];
            if sphere.origin.y - sphere.radius < cov.y {
                spheres.swap(i, j);
                j += 1;
            }
        }
    } else {
        for i in 0..spheres.len() {
            let sphere: &Sphere = &spheres[i];
            if sphere.origin.z - sphere.radius < cov.z {
                spheres.swap(i, j);
                j += 1;
            }
        }
    }

    println!("{}\t{}\t{}", bv.mini, bv.mini + j, bv.maxi);

    if j == 0 || j == spheres.len() {
        [BoundingVolume::new(0, 0), BoundingVolume::new(0, 0)]
    } else {
        [
            BoundingVolume::new(bv.mini, bv.mini + j),
            BoundingVolume::new(bv.mini + j, bv.maxi),
        ]
    }

    // bounding_hierachy(bv, s1);
    // bounding_volume.calc_dims();
}

pub fn render_scene2(
    width: usize,
    height: usize,
    samples_per_pixel: u16,
    depth: u16,
    objects: &mut Objects,
    camera: &Camera,
) -> [Image; 2] {
    let mut color_image = Image::new(width, height);
    let mut samples_image = Image::new(width, height);
    // const CM: f32 = 255.999; // color multiplier
    let cm2: f32 = 1.0 / 255.0;

    let w = (width - 1) as f32;
    let h = (height - 1) as f32;

    let mut pixels: Vec<PixelDelta> = vec![PixelDelta::new(); width * height];
    // let mut delta: Vec<Vec3A> = vec![Vec3A::new(0.0, 0.0, 0.0); width * height];
    #[cfg(not(target_family = "wasm"))]
    {
        let pb = ProgressBar::new(samples_per_pixel as u64);
        pb.set_style(
            ProgressStyle::default_bar()
                .template("[{elapsed_precise} / {duration_precise}] {bar} {percent}%"),
        );
        for spp in 0..samples_per_pixel {
            pixels.par_iter_mut().enumerate().for_each(|(k, pixel)| {
                if pixel.delta <= 10 {
                    let mut rng = RngThread::new();
                    let j = k / width;
                    let i = k - j * width;
                    let u = (i as f32 + rng.f32()) / w;
                    let v = 1.0 - (j as f32 + rng.f32()) / h;
                    let ray = Ray::new_from_camera(&camera, u, v, &mut rng);

                    if spp == 0 {
                        pixel.pixel += ray_color(&objects, &ray, depth, &mut rng);
                    } else {
                        let p0 = pixel.pixel.clone() / (spp as f32);
                        pixel.pixel += ray_color(&objects, &ray, depth, &mut rng);
                        let p1 = pixel.pixel.clone() / ((spp + 1) as f32);
                        let dp = (p1 - p0).abs();
                        if dp.x < cm2 && dp.y < cm2 && dp.z < cm2 {
                            pixel.delta += 1;
                            if pixel.delta > 10 {
                                pixel.delta = (spp + 1) as u8;
                                // println!("{}, {}, {}, {}, {}, {}", i, j, spp, pixel.delta, p0, p1);
                            }
                        } else {
                            pixel.delta = 0;
                        }
                    }
                }
            });
            pb.inc(1);
            // println!(">> {}, {}", pixels[7200].pixel, pixels[7200].delta);
        }
        pb.finish();
        color_image.pixels = pixels
            .par_iter_mut()
            .map(|pixel| {
                if pixel.delta <= 10 {
                    pixel.pixel.to_u8rgb(samples_per_pixel)
                } else {
                    pixel.pixel.to_u8rgb(pixel.delta as u16)
                }
            })
            .collect::<Vec<[u8; 3]>>();

        samples_image.pixels = pixels
            .par_iter_mut()
            .map(|pixel| {
                if pixel.delta <= 10 {
                    // let cc: u8 = ((pixel.delta as f32 / 10.0) * 255.0) as u8;
                    [255 - pixel.delta, 255 - pixel.delta, 255 - pixel.delta]
                } else {
                    // let cc: u8 =
                    //     ((pixel.delta as f32 / samples_per_pixel as f32) * 255.0) as u8;
                    [pixel.delta, pixel.delta, pixel.delta]
                }
            })
            .collect::<Vec<[u8; 3]>>();
    }
    [color_image, samples_image]
}

#[allow(dead_code)]
impl Image {
    pub fn new(width: usize, height: usize) -> Self {
        Self {
            width,
            height,
            pixels: vec![[0; 3]; width * height],
        }
    }

    pub fn generate_test(width: usize, height: usize) -> Self {
        let mut image = Image::new(width, height);
        const CM: f32 = 255.999; // color multiplier

        let w = (image.width - 1) as f32;
        let h = (image.height - 1) as f32;
        for j in 0..image.height {
            for i in 0..image.width {
                let r = (((i as f32) / w) * CM) as u8;
                let g = (((h - j as f32) / h as f32) * CM) as u8;
                let b = ((0.5) * CM) as u8;
                image.pixels[i + j * width] = [r, g, b];
            }
        }
        image
    }

    pub fn render_scene(
        width: usize,
        height: usize,
        samples_per_pixel: u16,
        depth: u16,
        objects: &mut Objects,
        camera: &Camera,
    ) -> Self {
        let mut image = Image::new(width, height);
        const CM: f32 = 255.999; // color multiplier

        let w = (image.width - 1) as f32;
        let h = (image.height - 1) as f32;

        // let serialized = serde_json::to_string(&objects).unwrap();
        // println!("{}", serialized);
        // let mut indices: Vec<usize> = vec![0; width * height];
        // indices
        //     .iter_mut()
        //     .enumerate()
        //     .for_each(|(k, index)| *index = k);

        // let calc_pixel_color = |k: &usize| -> [u8; 3] {
        //     let mut color: Vec3A = Vec3A::new(0.0, 0.0, 0.0);
        //     for _ in 0..samples_per_pixel {
        //         let j = k / width;
        //         let i = k - j * width;
        //         let u = (i as f32 + rng.f32()) / w;
        //         let v = 1.0 - (j as f32 + rng.f32()) / h;
        //         let ray = Ray::new_from_camera(&camera, u, v);
        //         color += ray_color(&objects, &ray, depth);
        //     }
        //     color.to_u8rgb(samples_per_pixel)
        // };

        // #[cfg(not(target_family = "wasm"))]
        // {
        //     let pb = ProgressBar::new(indices.len() as u64);
        //     pb.set_style(
        //         ProgressStyle::default_bar()
        //             .template("[{elapsed_precise} / {duration_precise}] {bar}"),
        //     );
        //     image.pixels = indices
        //         .par_iter()
        //         .progress_with(pb)
        //         .map(|k: &usize| -> [u8; 3] { calc_pixel_color(&k) })
        //         .collect::<Vec<[u8; 3]>>();
        // }

        // #[cfg(target_family = "wasm")]
        // {
        //     image.pixels = indices
        //         .iter()
        //         .map(|k: &usize| -> [u8; 3] { calc_pixel_color(&k) })
        //         .collect::<Vec<[u8; 3]>>();
        // }

        // let calc_sample = |pixels: &mut Vec<Vec3A>| {
        //     for j in 0..height {
        //         for i in 0..width {
        //             let u = (i as f32 + rng.f32()) / w;
        //             let v = 1.0 - (j as f32 + rng.f32()) / h;
        //             let ray = Ray::new_from_camera(&camera, u, v);
        //             pixels[i + j * width] += ray_color(&objects, &ray, depth);
        //         }
        //     }
        // };

        let mut pixels: Vec<Vec3A> = vec![Vec3A::new(0.0, 0.0, 0.0); width * height];
        // let mut delta: Vec<Vec3A> = vec![Vec3A::new(0.0, 0.0, 0.0); width * height];
        #[cfg(not(target_family = "wasm"))]
        {
            let pb = ProgressBar::new(samples_per_pixel as u64);
            pb.set_style(
                ProgressStyle::default_bar()
                    .template("[{elapsed_precise} / {duration_precise}] {bar} {percent}%"),
            );
            for _ in 0..samples_per_pixel {
                pixels.par_iter_mut().enumerate().for_each(|(k, pixel)| {
                    let mut rng = RngThread::new();
                    let j = k / width;
                    let i = k - j * width;
                    let u = (i as f32 + rng.f32()) / w;
                    let v = 1.0 - (j as f32 + rng.f32()) / h;
                    let ray = Ray::new_from_camera(&camera, u, v, &mut rng);
                    *pixel += ray_color(&objects, &ray, depth, &mut rng);
                });
                pb.inc(1);
            }
            pb.finish();
            image.pixels = pixels
                .par_iter_mut()
                .map(|pixel| pixel.to_u8rgb(samples_per_pixel))
                .collect::<Vec<[u8; 3]>>();
        }

        #[cfg(target_family = "wasm")]
        {
            let mut rng = RngThread::new();
            for _ in 0..samples_per_pixel {
                pixels.iter_mut().enumerate().for_each(|(k, pixel)| {
                    let j = k / width;
                    let i = k - j * width;
                    let u = (i as f32 + rng.f32()) / w;
                    let v = 1.0 - (j as f32 + rng.f32()) / h;
                    let ray = Ray::new_from_camera(&camera, u, v);
                    *pixel += ray_color(&objects, &ray, depth);
                });
            }
            image.pixels = pixels
                .iter_mut()
                .map(|pixel| pixel.to_u8rgb(samples_per_pixel))
                .collect::<Vec<[u8; 3]>>();
        }
        image
    }

    pub fn write_ppm(&self, filename: String) {
        let mut data: String = format!("P3\n{} {}\n255\n", self.width, self.height);
        for [r, g, b] in &self.pixels {
            data.push_str(&format!("{} {} {}\n", r, g, b));
        }
        let mut f = File::create(filename).expect("Unable to create file");
        f.write_all(data.as_bytes()).expect("Unable to write data");
    }

    pub fn write_png(&self, filename: String) {
        let mut data: Vec<u8> = vec![0; self.width * self.height * 3];
        let mut i: usize = 0;
        for [r, g, b] in &self.pixels {
            data[i] = *r;
            i += 1;
            data[i] = *g;
            i += 1;
            data[i] = *b;
            i += 1;
        }
        // let mut f = File::create("image.ppm").expect("Unable to create file");
        // f.write_all(data.as_bytes()).expect("Unable to write data");

        let file = File::create(filename).expect("Unable to create file");
        let ref mut w = BufWriter::new(file);

        let mut encoder = png::Encoder::new(w, self.width as u32, self.height as u32); // Width is 2 pixels and height is 1.
        encoder.set_color(png::ColorType::Rgb);
        encoder.set_depth(png::BitDepth::Eight);
        encoder.set_trns(vec![0xFFu8, 0xFFu8, 0xFFu8, 0xFFu8]);
        encoder.set_source_gamma(png::ScaledFloat::from_scaled(45455)); // 1.0 / 2.2, scaled by 100000
        encoder.set_source_gamma(png::ScaledFloat::new(1.0 / 2.2)); // 1.0 / 2.2, unscaled, but rounded
        let source_chromaticities = png::SourceChromaticities::new(
            // Using unscaled instantiation here
            (0.31270, 0.32900),
            (0.64000, 0.33000),
            (0.30000, 0.60000),
            (0.15000, 0.06000),
        );
        encoder.set_source_chromaticities(source_chromaticities);
        let mut writer = encoder.write_header().unwrap();

        // let data = [255, 0, 0, 255, 0, 0, 0, 255]; // An array containing a RGBA sequence. First pixel is red and second pixel is black.
        writer
            .write_image_data(&data)
            .expect("Unable to save image.png"); // Save
    }
}

#[derive(Serialize, Deserialize, Debug)]
pub enum Surface {
    Lambert,
    Metal,
    Dielectric,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Lambert {
    color: Vec3A,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Metal {
    color: Vec3A,
    roughness: f32,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Dielectric {
    refractive_index: f32,
}

#[derive(Serialize, Deserialize, Debug)]
#[allow(dead_code)]
pub struct Object {
    surface: Surface,
    geometry_index: usize,
    material_index: usize,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Objects {
    pub ledger: Vec<Object>,
    pub spheres: Vec<Sphere>,
    pub lamberts: Vec<Lambert>,
    pub metals: Vec<Metal>,
    pub dielectrics: Vec<Dielectric>,
    pub bvs: Vec<BoundingVolume>,
    pub bvi: Vec<usize>, // bounding volume left child index
}

impl Objects {
    #[allow(dead_code)]
    pub fn new() -> Self {
        Self {
            ledger: Vec::new(),
            spheres: Vec::new(),
            lamberts: Vec::new(),
            metals: Vec::new(),
            dielectrics: Vec::new(),
            bvs: Vec::new(),
            bvi: Vec::new(),
        }
    }

    pub fn record(&mut self, surface: Surface) {
        let material_index = match surface {
            Surface::Lambert => self.lamberts.len(),
            Surface::Metal => self.metals.len(),
            Surface::Dielectric => self.dielectrics.len(),
        };
        self.ledger.push(Object {
            surface: surface,
            geometry_index: self.spheres.len(),
            material_index: material_index,
        })
    }

    pub fn add_lambert_sphere(&mut self, sphere: Sphere, lambert: Lambert) {
        self.record(Surface::Lambert);
        self.spheres.push(sphere);
        self.lamberts.push(lambert);
    }

    pub fn add_metal_sphere(&mut self, sphere: Sphere, metal: Metal) {
        self.record(Surface::Metal);
        self.spheres.push(sphere);
        self.metals.push(metal);
    }

    pub fn add_dielectric_sphere(&mut self, sphere: Sphere, dielectric: Dielectric) {
        self.record(Surface::Dielectric);
        self.spheres.push(sphere);
        self.dielectrics.push(dielectric);
    }

    pub fn add_bh(&mut self, mini: usize, maxi: usize) {
        let mut min = Vec3A::new(f32::MAX, f32::MAX, f32::MAX);
        let mut max = Vec3A::new(f32::MIN, f32::MIN, f32::MIN);
        for sphere in &self.spheres[mini..maxi] {
            min = min.min(sphere.origin - sphere.radius);
            max = max.max(sphere.origin + sphere.radius);
        }
        let index = self.bvs.len();
        self.bvs.push(BoundingVolume {
            min: min,
            max: max,
            mini: mini,
            maxi: maxi,
            index: index,
        });
        self.bvi.push(0);
    }

    pub fn calculate_bounding_volumes(&mut self) {
        self.add_bh(0, self.spheres.len());
        self.calc_bvh(0);
    }

    #[allow(dead_code)]
    pub fn calc_bvh(&mut self, index: usize) {
        let mini = self.bvs[index].mini;
        let maxi = self.bvs[index].maxi;
        let s: &[Sphere] = &self.spheres[mini..maxi];
        let cov = calc_cov(s);
        let k = calc_k(s);
        let ss: &mut [Sphere] = &mut self.spheres[mini..maxi];
        let j = bounding_hierachy2(ss, k, cov);

        let bvslen = self.bvs.len();
        self.bvi[index] = bvslen;

        self.add_bh(mini, mini + j);
        self.add_bh(mini + j, maxi);

        println!("a: {}\t{}\t{}", cov, k, j);
        println!("b: {}\t{}\t{}", mini, mini + j, maxi);
        if j > 1 && maxi != (mini + j) {
            self.calc_bvh(bvslen);
        }
        if j != 0 && maxi - (mini + j) > 1 {
            self.calc_bvh(bvslen + 1);
        }
    }

    fn obj_hit_index(&self, ray: &Ray, intersection: &mut Intersection) -> (usize, bool) {
        let mut queue: Queue<usize> = queue![];
        let mut obj_index = 0;
        let mut hit_anything = false;
        queue.add(0).expect("could not add zero to queue");
        while queue.size() > 0 {
            // println!("queue: {:?}", queue);
            let i = queue.remove().expect("could not remove from queue");
            let t_max = intersection.time.clone();
            let hit = self.bvs[i].hit(&ray, 0.001, t_max);
            if hit {
                let j = self.bvi[i];
                if j != 0 {
                    queue.add(j).expect("could not add j to queue");
                    queue.add(j + 1).expect("could not add j+1 to queue");
                } else {
                    let k = self.bvs[i].mini;
                    let hit_sphere = self.spheres[k].hit(&ray, intersection, 0.0, t_max);
                    if hit_sphere {
                        obj_index = k;
                        hit_anything = true;
                        // println!("hit {}, {} {}", k, t_max, intersection.time);
                    }
                }
            }
        }
        (obj_index, hit_anything)
    }
}

pub struct RngCha {
    rng: ChaCha8Rng,
}

#[allow(dead_code)]
impl RngCha {
    pub fn new(seed: u64) -> Self {
        Self {
            rng: ChaCha8Rng::seed_from_u64(seed),
        }
    }

    pub fn f32(&mut self) -> f32 {
        self.rng.gen::<f32>()
    }

    pub fn range_f32(&mut self, min: f32, max: f32) -> f32 {
        self.f32() * (max - min) + min
    }

    pub fn range_vec3a(&mut self, min: f32, max: f32) -> Vec3A {
        Vec3A::new(
            self.range_f32(min, max),
            self.range_f32(min, max),
            self.range_f32(min, max),
        )
    }

    pub fn unit_f32(&mut self) -> f32 {
        self.f32() * 2.0 - 1.0
    }
    pub fn unit_vec3a(&mut self) -> Vec3A {
        Vec3A::new(self.unit_f32(), self.unit_f32(), self.unit_f32()).normalize()
    }
    pub fn unit_vec2(&mut self) -> Vec2 {
        Vec2::new(self.unit_f32(), self.unit_f32()).normalize()
    }
}

pub struct RngThread {
    rng: ThreadRng,
}

#[allow(dead_code)]
impl RngThread {
    pub fn new() -> Self {
        Self {
            rng: rand::thread_rng(),
        }
    }

    pub fn f32(&mut self) -> f32 {
        self.rng.gen::<f32>()
    }

    pub fn range_f32(&mut self, min: f32, max: f32) -> f32 {
        self.f32() * (max - min) + min
    }

    pub fn range_vec3a(&mut self, min: f32, max: f32) -> Vec3A {
        Vec3A::new(
            self.range_f32(min, max),
            self.range_f32(min, max),
            self.range_f32(min, max),
        )
    }

    pub fn unit_f32(&mut self) -> f32 {
        self.f32() * 2.0 - 1.0
    }
    pub fn unit_vec3a(&mut self) -> Vec3A {
        Vec3A::new(self.unit_f32(), self.unit_f32(), self.unit_f32()).normalize()
    }
    pub fn unit_vec2(&mut self) -> Vec2 {
        Vec2::new(self.unit_f32(), self.unit_f32()).normalize()
    }
}

pub fn reflect(direction: Vec3A, normal: Vec3A) -> Vec3A {
    direction - 2.0 * direction.dot(normal) * normal
}

pub fn ray_color_lambert(
    intersection: &Intersection,
    material: &Lambert,
    objects: &Objects,
    depth: u16,
    rng: &mut RngThread,
) -> Vec3A {
    let scatter_direction: Vec3A = intersection.normal + rng.unit_vec3a();
    let scatter_ray = {
        if scatter_direction.length_squared() < 1e-8 {
            // catch degenerate scatter direction
            Ray::new(intersection.origin, intersection.normal)
        } else {
            Ray::new(intersection.origin, scatter_direction)
        }
    };
    material.color * ray_color(&objects, &scatter_ray, depth - 1, rng)
}

pub fn ray_color_metal(
    intersection: &Intersection,
    material: &Metal,
    objects: &Objects,
    ray: &Ray,
    depth: u16,
    rng: &mut RngThread,
) -> Vec3A {
    let reflect_direction = reflect(ray.direction.normalize(), intersection.normal);
    let reflect_ray = Ray::new(
        intersection.origin,
        reflect_direction + material.roughness * rng.unit_f32() * rng.unit_vec3a(),
    );
    if reflect_ray.direction.dot(intersection.normal) > 0.0 {
        material.color * ray_color(&objects, &reflect_ray, depth - 1, rng)
    } else {
        Vec3A::new(0.0, 0.0, 0.0)
    }
}

pub fn ray_color_dielectric(
    intersection: &Intersection,
    material: &Dielectric,
    objects: &Objects,
    ray: &Ray,
    depth: u16,
    rng: &mut RngThread,
) -> Vec3A {
    let refraction_ratio = if intersection.is_external {
        1.0 / material.refractive_index
    } else {
        material.refractive_index
    };

    let unit_direction = ray.direction.normalize();
    let cos_theta = (-1.0 * unit_direction.dot(intersection.normal)).min(1.0);
    let sin_theta = (1.0 - cos_theta * cos_theta).sqrt();

    let cannot_refract = refraction_ratio * sin_theta > 1.0;
    let direction = if cannot_refract || reflectance(cos_theta, refraction_ratio) > rng.f32() {
        reflect(unit_direction, intersection.normal)
    } else {
        // refract(unit_direction, intersection.normal, refraction_ratio);
        let perpendicular_direction =
            refraction_ratio * (unit_direction + cos_theta * intersection.normal);
        let parallel_direction = -(1.0 - perpendicular_direction.length_squared())
            .abs()
            .sqrt()
            * intersection.normal;
        perpendicular_direction + parallel_direction
    };
    let scatter_ray = Ray::new(intersection.origin, direction);
    ray_color(&objects, &scatter_ray, depth - 1, rng)
}

pub fn reflectance(cos_theta: f32, refraction_ratio: f32) -> f32 {
    // Use Schlick's approximation for reflectance.
    let r = (1.0 - refraction_ratio) / (1.0 + refraction_ratio);
    let r2 = r * r;
    r2 + (1.0 - r2) * (1.0 - cos_theta).powi(5)
}

pub fn ray_color(objects: &Objects, ray: &Ray, depth: u16, rng: &mut RngThread) -> Vec3A {
    if depth <= 0 {
        return Vec3A::new(0.0, 0.0, 0.0);
    }
    let mut intersection = Intersection::default();

    let (obj_index, hit_anything) = objects.obj_hit_index(&ray, &mut intersection);

    // let mut hit_anything2 = false;
    // let mut obj_index2: usize = 0;
    // for (i, sphere) in objects.spheres.iter().enumerate() {
    //     let t_max = intersection.time.clone();
    //     if sphere.hit(&ray, &mut intersection, 0.001, t_max) {
    //         hit_anything2 = true;
    //         obj_index2 = i;
    //     }
    // }

    // println!("{} {} {} {}", obj_index, hit_anything, obj_index2, hit_anything2);

    if hit_anything {
        let object = &objects.ledger[obj_index];
        match object.surface {
            Surface::Lambert => {
                let material = &objects.lamberts[object.material_index];
                ray_color_lambert(&intersection, &material, &objects, depth, rng)
            }
            Surface::Metal => {
                let material = &objects.metals[object.material_index];
                ray_color_metal(&intersection, &material, &objects, &ray, depth, rng)
            }
            Surface::Dielectric => {
                let material = &objects.dielectrics[object.material_index];
                ray_color_dielectric(&intersection, &material, &objects, &ray, depth, rng)
            }
        }
    } else {
        let time = 0.5 * (ray.direction.normalize().y + 1.0);
        (1.0 - time) * Vec3A::new(1.0, 1.0, 1.0) + time * Vec3A::new(0.5, 0.7, 1.0)
    }
}

trait Vec3ColorExt {
    fn to_u8rgb(&self, samples: u16) -> [u8; 3];
}

impl Vec3ColorExt for Vec3A {
    fn to_u8rgb(&self, samples: u16) -> [u8; 3] {
        [
            ((256.0 * (self.x / (samples as f32)).sqrt()) as u8).clamp(0, 255),
            ((256.0 * (self.y / (samples as f32)).sqrt()) as u8).clamp(0, 255),
            ((256.0 * (self.z / (samples as f32)).sqrt()) as u8).clamp(0, 255),
        ]
    }
}

pub struct Ray {
    pub origin: Vec3A,
    pub direction: Vec3A,
}

impl Ray {
    #[allow(dead_code)]
    pub fn new(origin: Vec3A, direction: Vec3A) -> Self {
        Self { origin, direction }
    }

    pub fn new_from_camera(camera: &Camera, s: f32, t: f32, rng: &mut RngThread) -> Self {
        let rd = camera.lens_radius * rng.unit_f32() * rng.unit_vec2();
        let offset = camera.u * rd.x + camera.v * rd.y;
        Self {
            origin: camera.origin + offset,
            direction: camera.min_corner - camera.origin - offset
                + s * camera.x_axis
                + t * camera.y_axis,
        }
    }

    pub fn at(&self, time: f32) -> Vec3A {
        return self.origin + time * self.direction;
    }
}

pub struct Camera {
    pub origin: Vec3A,
    pub x_axis: Vec3A,
    pub y_axis: Vec3A,
    pub min_corner: Vec3A,
    pub u: Vec3A,
    pub v: Vec3A,
    pub w: Vec3A,
    pub lens_radius: f32,
}

impl Camera {
    pub fn new(
        position: Vec3A,
        lookat: Vec3A,
        vup: Vec3A,
        vfov: f32,
        aspect_ratio: f32,
        aperture: f32,
        focal_length: f32,
    ) -> Self {
        let theta = vfov.to_radians();
        let h = (theta / 2.0).tan();
        let height = 2.0 * h;
        let width = aspect_ratio * height;

        let w = (position - lookat).normalize();
        let u = vup.cross(w).normalize();
        let v = w.cross(u);

        let x_axis = focal_length * width * u;
        let y_axis = focal_length * height * v;

        let lens_radius = aperture / 2.0;

        Self {
            origin: position,
            x_axis: x_axis,
            y_axis: y_axis,
            min_corner: position - x_axis / 2.0 - y_axis / 2.0 - focal_length * w,
            u: u,
            v: v,
            w: w,
            lens_radius: lens_radius,
        }
    }
}

pub struct Intersection {
    pub origin: Vec3A,
    pub normal: Vec3A,
    pub time: f32,
    pub is_external: bool,
}

impl Default for Intersection {
    fn default() -> Self {
        Self {
            origin: Vec3A::new(0.0, 0.0, 0.0),
            normal: Vec3A::new(0.0, 0.0, 0.0),
            time: f32::MAX,
            is_external: false,
        }
    }
}

impl Intersection {
    pub fn set_normal(&mut self, ray: &Ray, outward_normal: Vec3A) {
        self.is_external = ray.direction.dot(outward_normal) < 0.0;
        self.normal = if self.is_external {
            outward_normal
        } else {
            -1.0 * outward_normal
        };
    }
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Sphere {
    pub origin: Vec3A,
    pub radius: f32,
}

impl Sphere {
    pub fn hit(&self, ray: &Ray, intersection: &mut Intersection, t_min: f32, t_max: f32) -> bool {
        let oc = ray.origin - self.origin;
        let a = ray.direction.length_squared();
        let half_b = oc.dot(ray.direction);
        let c = oc.length_squared() - self.radius * self.radius;
        let discriminant = half_b * half_b - a * c;

        if discriminant < 0.0 {
            return false;
        }

        let sqrtd = discriminant.sqrt();

        // Find the nearest root that lies in the acceptable range.
        let mut root = (-half_b - sqrtd) / a;
        if root < t_min || t_max < root {
            root = (-half_b + sqrtd) / a;
            if root < t_min || t_max < root {
                return false;
            }
        }

        intersection.time = root;
        intersection.origin = ray.at(intersection.time);
        let outward_normal: Vec3A = (intersection.origin - self.origin) / self.radius;
        intersection.set_normal(&ray, outward_normal);
        true
    }
}

// pub struct Box {
//     pub min: Vec3A,
//     pub max: Vec3A,
// }

// impl Box {
//     pub fn hit(&self, ray: &Ray, t_min: f32, t_max: f32) -> bool {
//         for i in 0..3 {
//             let invD = 1.0 / ray.direction[i];
//             let min = if invD < 0.0 { self.max[i] } else { self.min[i] };
//             let max = if invD < 0.0 { self.min[i] } else { self.max[i] };
//             let t0 = (min - ray.origin[i]) * invD;
//             let t1 = (max - ray.origin[i]) * invD;
//             if t1.max(t_max) <= t0.min(t_min) {
//                 return false;
//             };
//         }
//         true
//     }
// }
