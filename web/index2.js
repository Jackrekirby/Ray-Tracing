const gui = new dat.GUI({ name: "Scene Menu" });

function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

const objects = {
    "ledger": [{
        'name': 'marble',
        "surface": "Lambertian",
        "geometry_index": 0,
        "material_index": 0,
        'action': () => { }
    }, {
        'name': 'planet',
        "surface": "Lambertian",
        "geometry_index": 1,
        "material_index": 1,
        'action': () => { }
    }],
    "spheres": [{
        "origin": { x: 0.0, y: 0.0, z: 0.0 },
        "radius": 1000.0
    },
    {
        "origin": { x: 1.0, y: 2.0, z: 3.0 },
        "radius": 500.0
    }],
    "lambertians": [
        {
            "color": [0.5, 0.5, 0.5].map(x => x * 255.0)
        }, {
            "color": [0.4963225, 0.088527836, 0.025218708].map(x => x * 255.0)
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

const controllers = { objects: {}, sphere: {}, material: {}, materials: {} };
controllers.objects.folder = gui.addFolder('Objects');
controllers.objects.folder.open();
for (const item of objects.ledger) {
    item.action = () => {
        currentItem = item;
        const sphere = objects.spheres[currentItem.geometry_index];
        controls.sphere.origin.x = sphere.origin.x;
        controls.sphere.origin.y = sphere.origin.y;
        controls.sphere.origin.z = sphere.origin.z;
        controls.sphere.radius = sphere.radius;

        const updateMaterial = {
            'Lambertian': () => {
                const lambertian = objects.lambertians[currentItem.material_index];
                controls.material.color = lambertian.color;
            },
            'Metal': () => {
                const metal = objects.metals[currentItem.material_index];
                controls.material.color = metal.color;
                controls.material.roughness = metal.roughness;
            },
            'Dielectric': () => {
                const dielectric = objects.dielectrics[currentItem.material_index];
                controls.material.refractive_index = dielectric.refractive_index;
            },
        };
        updateMaterial[currentItem.surface]();
    };
    controllers.objects.folder.add(item, 'action').name(item.name);
    console.log(item);
}

const controls = {
    objects: {
        add: () => {
            objects.ledger.push(deepClone(currentItem));
            console.log(objects);
        }
    },
    sphere: {
        origin: { x: 0.0, y: 0.0, z: 0.0 }, radius: 5.0,
    },
    material: {
        surface: 'Lambertian',
        color: [125, 125, 255],
        roughness: 0.0,
        refractive_index: 1.5,
        add: () => {
            const addMaterial = {
                'Lambertian': () => {
                    objects.lambertians.push({ color: controls.material.color });
                },
                'Metal': () => {
                    objects.lambertians.push({
                        color: controls.material.color,
                        roughness: controls.material.roughness
                    });
                },
                'Dielectric': () => {
                    objects.lambertians.push({
                        refractive_index: controls.material.refractive_index,
                    });
                },
            };
            addMaterial[currentItem.surface];
        }
    }
};

gui.add(controls.objects, 'add').name('New Object');

let currentItem = objects.ledger[0];

controllers.sphere.folder = gui.addFolder('Sphere');
controllers.sphere.folder.add(controls.sphere.origin, 'x').listen().onChange(newValue => {
    const sphere = objects.spheres[currentItem.geometry_index];
    sphere.origin.x = newValue;
});
controllers.sphere.folder.add(controls.sphere.origin, 'y').listen().onChange(newValue => {
    const sphere = objects.spheres[currentItem.geometry_index];
    sphere.origin.y = newValue;
});
controllers.sphere.folder.add(controls.sphere.origin, 'z').listen().onChange(newValue => {
    const sphere = objects.spheres[currentItem.geometry_index];
    sphere.origin.z = newValue;
});
controllers.sphere.folder.add(controls.sphere, 'radius').listen().onChange(newValue => {
    const sphere = objects.spheres[currentItem.geometry_index];
    sphere.radius = newValue;
});
controllers.sphere.folder.open();


controllers.material.folder = gui.addFolder('Material Settings');
controllers.material.folder.open();

controllers.material.folder.add(controls.material, 'surface', ['Lambertian', 'Metal', 'Dielectric']).listen().onChange(newValue => {
    currentItem.surface = newValue;

    const updateMaterial = {
        'Lambertian': () => {
            showController(getController(controllers.material.folder, 'color'));
            hideController(getController(controllers.material.folder, 'roughness'));
            hideController(getController(controllers.material.folder, 'refractive_index'));
        },
        'Metal': () => {
            showController(getController(controllers.material.folder, 'color'));
            showController(getController(controllers.material.folder, 'roughness'));
            hideController(getController(controllers.material.folder, 'refractive_index'));
        },
        'Dielectric': () => {
            hideController(getController(controllers.material.folder, 'color'));
            hideController(getController(controllers.material.folder, 'roughness'));
            showController(getController(controllers.material.folder, 'refractive_index'));
        },
    };
    updateMaterial[currentItem.surface]();
});

function getController(folder, name) {
    return folder.__controllers.find(controller => {
        // console.log(controller.property, name);
        return controller.property === name
    });
}

const hideController = (controller) => {
    controller.__li.style.display = "none";
}

const showController = (controller) => {
    controller.__li.style.display = "";
}

controllers.material.color = controllers.material.folder.addColor(controls.material, 'color').listen().onChange(newValue => {
    const updateMaterial = {
        'Lambertian': () => {
            const material = objects.lambertians[currentItem.material_index];
            material.color = newValue;
        },
        'Metal': () => {
            const material = objects.metals[currentItem.material_index];
            material.color = newValue;
        },
        'Dielectric': () => {

        },
    };
    updateMaterial[currentItem.surface]();
});

controllers.material.roughness = controllers.material.folder.add(controls.material, 'roughness').listen().onChange(newValue => {
    const material = objects.metals[currentItem.material_index];
    material.roughness = newValue;
});
controllers.material.roughness.min(0.0).max(1.0).step(0.01);

controllers.material.refractive_index = controllers.material.folder.add(controls.material, 'refractive_index');
controllers.material.refractive_index.listen().onChange(newValue => {
    const material = objects.dielectrics[currentItem.refractive_index];
    material.refractive_index = newValue;
});

controllers.material.refractive_index.min(1.0).max(5.0).step(0.01).name('refractive index');

showController(getController(controllers.material.folder, 'color'));
hideController(getController(controllers.material.folder, 'roughness'));
hideController(getController(controllers.material.folder, 'refractive_index'));

controllers.material.folder.add(controls.material, 'add').name('new material');


// MATERIALS LIST

controllers.materials.folder = gui.addFolder('List of Materials');
controllers.materials.folder.open();

for (const lambertian in objects.lambertians) {

}

console.log(uuid.v4());
const objects2 = {
    object: [
        {
            geometry_id: 0,
            material_index: 0,
        }
    ],
    geometries: [
        {
            id: 0,
            type: 'sphere',
            index: 0
        }
    ],
    materials: [
        {
            id: 0,
            type: 'lambert',
            index: 0,
        }
    ],
    spheres: [
        {
            id: 0,
            origin: { x: 0.0, y: 0.0, z: 0.0 },
            radius: 1000.0
        },
        {
            id: 0,
            origin: { x: 1.0, y: 2.0, z: 3.0 },
            radius: 500.0
        }
    ],
    lamberts: [
        {
            id: 0,
            color: [0.5, 0.5, 0.5].map(x => x * 255.0)
        }, {
            id: 0,
            color: [0.4963225, 0.088527836, 0.025218708].map(x => x * 255.0)
        }
    ],
    metals: [
        {
            id: 0,
            color: [0.5, 0.5, 0.5],
            roughness: 0.0
        }
    ],
    dielectrics: [
        {
            id: 0,
            refractive_index: 1.5
        }
    ]
}