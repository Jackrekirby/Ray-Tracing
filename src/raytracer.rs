use glam::{Vec2, Vec3A};
use serde::{Deserialize, Serialize};
use std::fs::File;
use std::io::Write;

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

#[allow(dead_code)]
pub fn random_scene(objects: &mut Objects, n: i16) {
    objects.add_lambert_sphere(
        Sphere {
            origin: Vec3A::new(0.0, -1000.0, 0.0),
            radius: 1000.0,
        },
        Lambert {
            color: Vec3A::new(0.5, 0.5, 0.5),
        },
    );

    for y in (-n..n).step_by(1) {
        for x in (-n..n).step_by(1) {
            if x.abs() < 6 && y.abs() < 1 {
                continue;
            };
            let radius = rand::random::<f32>() * 0.1 + 0.15;
            let origin = Vec3A::new(
                x as f32 + 0.7 * rand::random::<f32>(),
                radius,
                y as f32 + 0.6 * rand::random::<f32>(),
            );
            let sphere = Sphere {
                origin: origin,
                radius: radius,
            };

            let r = rand::random::<f32>();
            if r < 0.5 {
                objects.add_lambert_sphere(
                    sphere,
                    Lambert {
                        color: rand_vec3a(0.0, 1.0) * rand_vec3a(0.0, 1.0),
                    },
                );
            } else if r < 0.8 {
                objects.add_metal_sphere(
                    sphere,
                    Metal {
                        color: rand_vec3a(0.5, 1.0),
                        roughness: rand(0.0, 0.5),
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
        }
    }

    objects.add_lambert_sphere(
        Sphere {
            origin: Vec3A::new(-4.0, 1.0, 0.0),
            radius: 1.0,
        },
        Lambert {
            color: rand_vec3a(0.0, 1.0) * rand_vec3a(0.0, 1.0),
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
}

#[allow(dead_code)]
pub fn default_scene(objects: &mut Objects) {
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
            color: rand_vec3a(0.0, 1.0) * rand_vec3a(0.0, 1.0),
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
    ) -> Self {
        let mut image = Image::new(width, height);
        const CM: f32 = 255.999; // color multiplier

        let w = (image.width - 1) as f32;
        let h = (image.height - 1) as f32;
        let aspect_ratio: f32 = (width as f32) / (height as f32);

        let position = Vec3A::new(13.0, 2.0, 3.0);
        let lookat = Vec3A::new(0.0, 0.0, 0.0);
        let vup = Vec3A::new(0.0, 1.0, 0.0);
        let vfov = 20.0;
        let aperture = 0.1;
        let focal_length = 10.0;

        let camera = Camera::new(
            position,
            lookat,
            vup,
            vfov,
            aspect_ratio,
            aperture,
            focal_length,
        );

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
        //         let u = (i as f32 + rand::random::<f32>()) / w;
        //         let v = 1.0 - (j as f32 + rand::random::<f32>()) / h;
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
        //             let u = (i as f32 + rand::random::<f32>()) / w;
        //             let v = 1.0 - (j as f32 + rand::random::<f32>()) / h;
        //             let ray = Ray::new_from_camera(&camera, u, v);
        //             pixels[i + j * width] += ray_color(&objects, &ray, depth);
        //         }
        //     }
        // };

        let mut pixels: Vec<Vec3A> = vec![Vec3A::new(0.0, 0.0, 0.0); width * height];
        #[cfg(not(target_family = "wasm"))]
        {
            let pb = ProgressBar::new(samples_per_pixel as u64);
            pb.set_style(
                ProgressStyle::default_bar()
                    .template("[{elapsed_precise} / {duration_precise}] {bar} {percent}%"),
            );
            for _ in 0..samples_per_pixel {
                pixels.par_iter_mut().enumerate().for_each(|(k, pixel)| {
                    let j = k / width;
                    let i = k - j * width;
                    let u = (i as f32 + rand::random::<f32>()) / w;
                    let v = 1.0 - (j as f32 + rand::random::<f32>()) / h;
                    let ray = Ray::new_from_camera(&camera, u, v);
                    *pixel += ray_color(&objects, &ray, depth);
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
            for _ in 0..samples_per_pixel {
                pixels.iter_mut().enumerate().for_each(|(k, pixel)| {
                    let j = k / width;
                    let i = k - j * width;
                    let u = (i as f32 + rand::random::<f32>()) / w;
                    let v = 1.0 - (j as f32 + rand::random::<f32>()) / h;
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

    pub fn write(&self) {
        let mut data: String = format!("P3\n{} {}\n255\n", self.width, self.height);
        for [r, g, b] in &self.pixels {
            data.push_str(&format!("{} {} {}\n", r, g, b));
        }
        let mut f = File::create("image.ppm").expect("Unable to create file");
        f.write_all(data.as_bytes()).expect("Unable to write data");
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
}

pub fn rand(min: f32, max: f32) -> f32 {
    rand::random::<f32>() * (max - min) + min
}

pub fn rand_vec3a(min: f32, max: f32) -> Vec3A {
    Vec3A::new(rand(min, max), rand(min, max), rand(min, max))
}

pub fn unit_rand() -> f32 {
    rand::random::<f32>() * 2.0 - 1.0
}

pub fn unit_rand_vec3a() -> Vec3A {
    Vec3A::new(unit_rand(), unit_rand(), unit_rand()).normalize()
}

pub fn unit_rand_vec2() -> Vec2 {
    Vec2::new(unit_rand(), unit_rand()).normalize()
}

pub fn reflect(direction: Vec3A, normal: Vec3A) -> Vec3A {
    direction - 2.0 * direction.dot(normal) * normal
}

pub fn ray_color_lambert(
    intersection: &Intersection,
    material: &Lambert,
    objects: &Objects,
    depth: u16,
) -> Vec3A {
    let scatter_direction: Vec3A = intersection.normal + unit_rand_vec3a();
    let scatter_ray = {
        if scatter_direction.length_squared() < 1e-8 {
            // catch degenerate scatter direction
            Ray::new(intersection.origin, intersection.normal)
        } else {
            Ray::new(intersection.origin, scatter_direction)
        }
    };
    material.color * ray_color(&objects, &scatter_ray, depth - 1)
}

pub fn ray_color_metal(
    intersection: &Intersection,
    material: &Metal,
    objects: &Objects,
    ray: &Ray,
    depth: u16,
) -> Vec3A {
    let reflect_direction = reflect(ray.direction.normalize(), intersection.normal);
    let reflect_ray = Ray::new(
        intersection.origin,
        reflect_direction + material.roughness * unit_rand() * unit_rand_vec3a(),
    );
    if reflect_ray.direction.dot(intersection.normal) > 0.0 {
        material.color * ray_color(&objects, &reflect_ray, depth - 1)
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
    let direction =
        if cannot_refract || reflectance(cos_theta, refraction_ratio) > rand::random::<f32>() {
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
    ray_color(&objects, &scatter_ray, depth - 1)
}

pub fn reflectance(cos_theta: f32, refraction_ratio: f32) -> f32 {
    // Use Schlick's approximation for reflectance.
    let r = (1.0 - refraction_ratio) / (1.0 + refraction_ratio);
    let r2 = r * r;
    r2 + (1.0 - r2) * (1.0 - cos_theta).powi(5)
}

pub fn ray_color(objects: &Objects, ray: &Ray, depth: u16) -> Vec3A {
    if depth <= 0 {
        return Vec3A::new(0.0, 0.0, 0.0);
    }
    let mut hit_anything = false;
    let mut intersection = Intersection::default();
    let mut obj_index: usize = 0;

    for (i, sphere) in objects.spheres.iter().enumerate() {
        let t_max = intersection.time.clone();
        if sphere.hit(&ray, &mut intersection, 0.001, t_max) {
            hit_anything = true;
            obj_index = i;
        }
    }

    if hit_anything {
        let object = &objects.ledger[obj_index];
        match object.surface {
            Surface::Lambert => {
                let material = &objects.lamberts[object.material_index];
                ray_color_lambert(&intersection, &material, &objects, depth)
            }
            Surface::Metal => {
                let material = &objects.metals[object.material_index];
                ray_color_metal(&intersection, &material, &objects, &ray, depth)
            }
            Surface::Dielectric => {
                let material = &objects.dielectrics[object.material_index];
                ray_color_dielectric(&intersection, &material, &objects, &ray, depth)
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

    pub fn new_from_camera(camera: &Camera, s: f32, t: f32) -> Self {
        let rd = camera.lens_radius * unit_rand() * unit_rand_vec2();
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
