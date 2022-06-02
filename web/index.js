import init, { run_raytracer } from "../pkg/raytracer_lib.js";

const gui = new dat.GUI({ name: "Scene Menu" });

// geometry
const sphere = { radius: 1.0, origin: { x: 0.0, y: 0.0, z: 0.0 } };
const maxRadius = 10.0, maxOrigin = 10.0, step = 0.5;

const controllers = { sphere: { origin: {} }, lambertian: {}, metal: {}, dielectric: {} };

const sphereFolder = gui.addFolder('Sphere');
controllers.sphere.radius = sphereFolder.add(sphere, 'radius', 0.0, maxRadius).step(step).listen();
controllers.sphere.origin.x = sphereFolder.add(sphere.origin, 'x', -maxOrigin, maxOrigin).step(step).listen();
controllers.sphere.origin.y = sphereFolder.add(sphere.origin, 'y', -maxOrigin, maxOrigin).step(step).listen();
controllers.sphere.origin.z = sphereFolder.add(sphere.origin, 'z', -maxOrigin, maxOrigin).step(step).listen();
sphereFolder.open();

// materials
// const objects = [];
const item = { name: 'object', material: 'Lambertian' }
gui.add(item, 'name');
controllers.material = gui.add(item, 'material', ['Lambertian', 'Metal', 'Dielectric']);
controllers.material.onChange((material) => {
    switch (material) {
        case 'Lambertian':
            lambertianFolder.show();
            metalFolder.hide();
            dielectricFolder.hide();
            break;
        case 'Metal':
            lambertianFolder.hide();
            metalFolder.show();
            dielectricFolder.hide();
            break;
        case 'Dielectric':
            lambertianFolder.hide();
            metalFolder.hide();
            dielectricFolder.show();
            break;
    }
});

const lambertian = { color: [0, 128, 255] };
controllers.lambertian.folder = gui.addFolder('Lambertian');
controllers.lambertian.color = controllers.lambertian.folder.addColor(lambertian, 'color');
controllers.lambertian.folder.open();

const metal = { color: [128, 128, 128], roughness: 0.0 };
controllers.metal.folder = gui.addFolder('Metal');
controllers.metal.color = controllers.metal.folder.addColor(metal, 'color');
controllers.metal.roughness = controllers.metal.folder.add(metal, 'roughness', 0.0, 1.0).step(0.05);
controllers.metal.folder.open();
controllers.metal.folder.hide();

const dielectric = { refractive_index: 1.5 };
controllers.dielectric.folder = gui.addFolder('Dielectric');
controllers.dielectric.refractive_index = controllers.dielectric.folder.add(dielectric, 'refractive_index', 1.0, 3.0).step(0.05);
controllers.dielectric.folder.open();
controllers.dielectric.folder.hide();

const actions = { 'add': () => { } };
const addController = gui.add(actions, 'add');
addController.name('Add Object To Scene')
const objectsFolder = gui.addFolder('Objects');
objectsFolder.open();

const objects = {
    "ledger": [{
        "surface": "Lambertian",
        "geometry_index": 0,
        "material_index": 0
    }, {
        "surface": "Lambertian",
        "geometry_index": 1,
        "material_index": 1
    }],
    "spheres": [{
        "origin": { x: 0.0, y: 0.0, z: 0.0 },
        "radius": 1000.0
    },
    {
        "origin": { x: 1.0, y: 2.0, z: 3.0 },
        "radius": 500.0
    }],
    "lambertians": [],
    "metals": [],
    "dielectrics": []
};

const objects2 = {
    "ledger": [
        {
            "surface": "Lambertian",
            "geometry_index": 0,
            "material_index": 0
        },
        {
            "surface": "Lambertian",
            "geometry_index": 1,
            "material_index": 1
        },
        {
            "surface": "Metal",
            "geometry_index": 2,
            "material_index": 0
        },
        {
            "surface": "Dielectric",
            "geometry_index": 3,
            "material_index": 0
        }
    ],
    "spheres": [
        {
            "origin": [0.0, -1000.0, 0.0],
            "radius": 1000.0
        },
        {
            "origin": [-4.0, 1.0, 0.0],
            "radius": 1.0
        }, {
            "origin": [4.0, 1.0, 0.0],
            "radius": 1.0
        }, {
            "origin": [0.0, 1.0, 0.0],
            "radius": 1.0
        }
    ],
    "lambertians": [
        {
            "color": [0.5, 0.5, 0.5]
        }, {
            "color": [0.4963225, 0.088527836, 0.025218708]
        }
    ],
    "metals": [
        {
            "color": [0.5, 0.5, 0.5],
            "roughness": 0.0
        }
    ],
    "dielectrics": [
        {
            "refractive_index": 1.5
        }
    ]
};

const getMaterialArrayName = {
    'Lambertian': "lambertians",
    'Metal': 'metals',
    'Dielectric': 'dielectrics'
};

const addMaterialData = {
    'Lambertian': () => { objects.lambertians.push(deepClone(lambertian)) },
    'Metal': () => { objects.metals.push(deepClone(metal)) },
    'Dielectric': () => { objects.dielectrics.push(deepClone(dielectric)) }
};

function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

let test = { val: 0 };

const guiControls = {
    x: objects.spheres[objects.ledger[test.val].geometry_index].origin.x
};

gui.add(test, "val").min(0).max(1).step(1).listen().onChange(newValue => {
    console.log(guiControls, newValue);
    guiControls.x = objects.spheres[objects.ledger[test.val].geometry_index].origin.x;
});

gui.add(guiControls, "x").listen()
    .onChange(newValue => {
        objects.spheres[objects.ledger[test.val].geometry_index].origin.x = newValue;
        // console.log('b', guiControls.x, objects.spheres[objects.ledger[test.val].geometry_index].origin.x);
        console.log(objects);
    });

actions.add = () => {
    const object = {
        name: item.name,
        material: item.material,
        geometry_index: objects.spheres.length,
        material_index: objects[getMaterialArrayName[item.material]].length,
        action: () => { }
    };

    object.action = () => {
        const thisSphere = objects.spheres[object.geometry_index];
        controllers.sphere.origin.x.setValue(thisSphere.origin.x);
        controllers.sphere.origin.y.setValue(thisSphere.origin.y);
        controllers.sphere.origin.z.setValue(thisSphere.origin.z);
        controllers.sphere.radius.setValue(thisSphere.radius);
    };

    // console.log(object);

    const count = objects.ledger.filter((obj) => {
        return obj.name === object.name
    }).length;

    objects.ledger.push(object);
    objects.spheres.push(deepClone(sphere));
    addMaterialData[object.material]();

    const actionController = objectsFolder.add(object, 'action');
    if (count > 0) {
        actionController.name(`${object.name} [${count}]`);
    } else {
        actionController.name(`${object.name}`);
    }
    console.log(objectsFolder);
};




// const t0 = performance.now();

// await init()
// console.log('Raytracer');

// const prescale = 1;
// const width = 512 * prescale;
// const height = 256 * prescale;
// const samples_per_pixel = 50;
// const depth = 50;
// const scale = 2;

// const data = run_raytracer(width, height, samples_per_pixel, depth);

// const pCanvasFnc = (p) => {
//     p.setup = () => {
//         p.createCanvas(
//             width * scale,
//             height * scale);

//         p.noStroke();
//         for (let j = 0; j < height; j++) {
//             for (let i = 0; i < width; i++) {
//                 const [r, g, b] = data[i + j * width];
//                 p.fill(r, g, b);
//                 // p.point(i * scale, j * scale);
//                 p.rect(i * scale, j * scale, scale, scale);
//             }
//         }
//     }

//     p.draw = () => {
//     }
// }

// let pCanvas = new p5(pCanvasFnc, 'canvas');

// // console.log(data);
// // console.log(pCanvas);

// const t1 = performance.now();
// console.log(`Complete: ${(t1 - t0) / 1000} s`);