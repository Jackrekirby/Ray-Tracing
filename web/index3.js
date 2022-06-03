// steps
//  define constants and functions
//  materials settings folder
//  materials list folder
//  add materials and set default

// consts
//  gui
//  controls
//  objects
//  folders

// functions
//  deepClone
//  newId
//  getController(folder, name)
//  hideController = (controller)
//  showController = (controller)
//  updateMaterialType = (material)
//  updateMaterialControls = (material)
//  addMaterialAction(material)

import init, { run_raytracer } from "../pkg/raytracer_lib.js";
await init()

const gui = new dat.GUI({ name: "Scene Menu" });

function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

function newId() {
    return uuid.v4();
}

function getController(folder, name) {
    return folder.__controllers.find(controller => controller.property === name);
}

const hideController = (controller) => {
    controller.__li.style.display = "none";
}

const showController = (controller) => {
    controller.__li.style.display = "";
}

const controls = {
    material: {
        id: 0,
        name: 'test',
        type: 'lambert',
        color: [255, 125, 125],
        roughness: 0.5,
        refractive_index: 1.5,
        duplicate: () => {
            const material = deepClone(objects.materials.find(
                item => {
                    return item.id === currentMaterialId;
                }
            ));
            material.id = newId();
            material.name = material.name.replace(/ *\([^)]*\) */g, "");
            const numCopies = objects.materials.filter(
                item => {
                    const otherName = item.name.replace(/ *\([^)]*\) */g, "");;
                    return otherName === material.name;
                }
            ).length;
            material.name += ` (${numCopies})`;
            material.action = addMaterialAction(material);
            objects.materials.push(material);
            folders.material.list.add(material, 'action').listen().name(material.name);

            material.action();

            const materialController = getController(folders.shape.settings, 'material');
            const selectElement = materialController.domElement.children[0];
            const optionElement = document.createElement('option');
            optionElement.innerText = material.name;
            optionElement.value = material.id;
            selectElement.appendChild(optionElement);

            showController(getController(folders.material.settings, 'delete'));
        },
        delete: () => {
            objects.materials = objects.materials.filter(
                item => {
                    return item.id !== currentMaterialId;
                }
            );

            const itemController = folders.material.list.__controllers.find(
                controller => {
                    return controller.object.id === currentMaterialId
                }
            );

            itemController.remove();

            const materialController = getController(folders.shape.settings, 'material');
            const selectElement = materialController.domElement.children[0];
            const option = Array.from(selectElement.children).find(
                option => option.value == currentMaterialId
            );
            option.remove();

            objects.materials[0].action();

            if (objects.materials.length == 1) {
                hideController(getController(folders.material.settings, 'delete'));
            }

            console.log(objects);
        }
    },
    shape: {
        id: 0,
        name: 'test',
        type: 'sphere',
        material: 'default',
        origin: { x: 0.0, y: 0.0, z: 0.0 },
        radius: 1.0,
        duplicate: () => {
            const shape = deepClone(objects.shapes.find(
                item => {
                    return item.id === currentShapeId;
                }
            ));
            shape.id = newId();
            shape.name = shape.name.replace(/ *\([^)]*\) */g, "");
            const numCopies = objects.shapes.filter(
                item => {
                    const otherName = item.name.replace(/ *\([^)]*\) */g, "");;
                    return otherName === shape.name;
                }
            ).length;
            shape.name += ` (${numCopies})`;
            shape.action = addShapeAction(shape);
            objects.shapes.push(shape);
            folders.shape.list.add(shape, 'action').listen().name(shape.name);
            shape.action();

            showController(getController(folders.shape.settings, 'delete'));
        },
        delete: () => {
            objects.shapes = objects.shapes.filter(
                item => {
                    // console.log(material.id, currentMaterialId);
                    return item.id !== currentMaterialId;
                }
            );

            const itemController = folders.shape.list.__controllers.find(
                controller => {
                    return controller.object.id === currentShapeId
                }
            );

            itemController.remove();
            objects.shapes[0].action();

            if (objects.shapes.length == 1) {
                hideController(getController(folders.shape.settings, 'delete'));
            }

            console.log(objects);
        }
    },
}

console.log(newId());
const objects = {
    materials: [
        {
            id: '732a4348-6e70-47f7-96ea-adca184b6221',
            name: 'ground',
            type: 'lambert',
            color: [128, 128, 128],
        },
        {
            id: 'bd351f34-815e-42a8-b17d-da37c6db56dd',
            name: 'blue lambert',
            type: 'lambert',
            color: [128, 128, 255],
        },
        {
            id: '69eaca0e-ced1-4578-afe3-a89359d085aa',
            name: 'mirror',
            type: 'metal',
            color: [125, 125, 125],
            roughness: 0.0,
        },
        {
            id: '93d3c46b-dbcc-40ef-8a1d-b3a39e329131',
            name: 'glass',
            type: 'dielectric',
            refractive_index: 1.5,
        },
    ],
    shapes: [
        {
            id: '2a357c2d-fd37-4463-9b33-3071fb1342cf',
            name: 'planet',
            type: 'sphere',
            material: '732a4348-6e70-47f7-96ea-adca184b6221',
            origin: { x: 0.0, y: -1000.0, z: 0.0 },
            radius: 1000.0,
        },
        {
            id: 'd0ca38c2-1eca-4156-ba09-d5cd062a0852',
            name: 'lambert ball',
            type: 'sphere',
            material: 'bd351f34-815e-42a8-b17d-da37c6db56dd',
            origin: { x: -4.0, y: 1.0, z: 0.0 },
            radius: 1.0,
        },
        {
            id: '8c341f35-eb92-4e19-bc7a-c0f03df443a7',
            name: 'metal ball',
            type: 'sphere',
            material: '69eaca0e-ced1-4578-afe3-a89359d085aa',
            origin: { x: 4.0, y: 1.0, z: 0.0 },
            radius: 1.0,
        },
        {
            id: '899c7bcd-6629-4803-832a-b3b1bb47ebe0',
            name: 'glass ball',
            type: 'sphere',
            material: '93d3c46b-dbcc-40ef-8a1d-b3a39e329131',
            origin: { x: 0.0, y: 1.0, z: 0.0 },
            radius: 1.0,
        },
    ]
}

const rust = {
    run: () => {
        call_raytracer();
    }
};
gui.add(rust, 'run').name('run ray tracer');

const folders = { material: {}, shape: {} };

// SHAPE SETTINGS FOLDER
folders.shape.main = gui.addFolder('Shape');
folders.shape.main.open();

folders.shape.settings = folders.shape.main.addFolder('Settings');
folders.shape.settings.open();

folders.shape.settings.add(controls.shape, 'name')
    .listen().onChange(newValue => {
        const shape = objects.shapes.find(shape => shape.id === currentShapeId);
        shape.name = newValue;
        const itemController = folders.shape.list.__controllers.find(
            controller => {
                // console.log(controller.object.id, material.id);
                return controller.object.id === shape.id
            }
        );
        itemController.name(shape.name);
    });

folders.shape.settings.add(controls.shape, 'type',
    ['sphere']).listen().onChange(newValue => {
        const shape = objects.shapes.find(shape => shape.id === currentShapeId);
        shape.type = newValue;
        updateShapeType(shape);
    });

folders.shape.settings.add(controls.shape, 'material',
    []).listen().onChange(newValue => {
        const shape = objects.shapes.find(shape => shape.id === currentShapeId);
        shape.material = newValue;
        // console.log(folders.shape.settings.__controllers[2]);
    });

folders.shape.settings.add(controls.shape.origin, 'x').onChange(newValue => {
    const shape = objects.shapes.find(shape => shape.id === currentShapeId);
    shape.origin.x = newValue;
});

folders.shape.settings.add(controls.shape.origin, 'y').onChange(newValue => {
    const shape = objects.shapes.find(shape => shape.id === currentShapeId);
    shape.origin.y = newValue;
});

folders.shape.settings.add(controls.shape.origin, 'z').onChange(newValue => {
    const shape = objects.shapes.find(shape => shape.id === currentShapeId);
    shape.origin.z = newValue;
});

folders.shape.settings.add(controls.shape, 'radius').onChange(newValue => {
    const shape = objects.shapes.find(shape => shape.id === currentShapeId);
    shape.radius = newValue;
    // getController(folders.shape.settings, 'radius').updateDisplay();
});

folders.shape.settings.add(controls.shape, 'duplicate').listen();
folders.shape.settings.add(controls.shape, 'delete').listen();

// SHAPE LIST FOLDER
folders.shape.list = folders.shape.main.addFolder('List');
folders.shape.list.open();

const updateShapeType = (shape) => {
    const fnc = {
        'sphere': () => {
            // showController(getController(folders.shape.settings, 'x'));
            // showController(getController(folders.shape.settings, 'y'));
            // showController(getController(folders.shape.settings, 'z'));
            // showController(getController(folders.shape.settings, 'radius'));
        },
        // other shape types e.g. box
    }
    fnc[shape.type]();
};

const updateShapeControls = (shape) => {
    const fnc = {
        'sphere': () => {
            controls.shape.radius = shape.radius;
            getController(folders.shape.settings, 'radius').updateDisplay();
        },
    }
    fnc[shape.type]();
};

function addShapeAction(shape) {
    return () => {
        currentShapeId = shape.id;
        controls.shape.name = shape.name;
        controls.shape.id = shape.id;
        controls.shape.type = shape.type;
        controls.shape.material = shape.material;
        controls.shape.origin.x = shape.origin.x;
        controls.shape.origin.y = shape.origin.y;
        controls.shape.origin.z = shape.origin.z;

        getController(folders.shape.settings, 'x').updateDisplay();
        getController(folders.shape.settings, 'y').updateDisplay();
        getController(folders.shape.settings, 'z').updateDisplay();

        updateShapeControls(shape);
        updateShapeType(shape);
    };
}

// MATERIAL SETTINGS FOLDER
folders.material.main = gui.addFolder('Material');
folders.material.main.open();

folders.material.settings = folders.material.main.addFolder('Settings');
folders.material.settings.open();

folders.material.settings.add(controls.material, 'name')
    .listen().onChange(newValue => {
        const material = objects.materials.find(material => material.id === currentMaterialId);
        material.name = newValue;
        const itemController = folders.material.list.__controllers.find(
            controller => {
                // console.log(controller.object.id, material.id);
                return controller.object.id === material.id
            }
        );
        itemController.name(material.name);

        const materialController = getController(folders.shape.settings, 'material');
        const selectElement = materialController.domElement.children[0];
        const option = Array.from(selectElement.children).find(
            option => option.value == currentMaterialId
        );
        option.innerText = material.name;
    });

folders.material.settings.add(controls.material, 'type',
    ['lambert', 'metal', 'dielectric']).listen().onChange(newValue => {

        const material = objects.materials.find(material => material.id === currentMaterialId);
        material.type = newValue;
        updateMaterialType(material);
    });

folders.material.settings.addColor(controls.material, 'color').listen().onChange(newValue => {
    const material = objects.materials.find(material => material.id === currentMaterialId);
    material.color = newValue;
});

folders.material.settings.add(controls.material, 'roughness')
    .min(0.0).max(1.0).step(0.01).listen().onChange(newValue => {
        const material = objects.materials.find(material => material.id === currentMaterialId);
        material.roughness = newValue;
    });

folders.material.settings.add(controls.material, 'refractive_index')
    .min(1.0).max(5.0).step(0.01).name('refractive index').listen().onChange(newValue => {
        const material = objects.materials.find(material => material.id === currentMaterialId);
        material.refractive_index = newValue;
    });

folders.material.settings.add(controls.material, 'duplicate').listen();
folders.material.settings.add(controls.material, 'delete').listen();

// MATERIAL LIST FOLDER
folders.material.list = folders.material.main.addFolder('List');
folders.material.list.open();

const updateMaterialType = (material) => {
    const fnc = {
        'lambert': () => {
            showController(getController(folders.material.settings, 'color'));
            hideController(getController(folders.material.settings, 'roughness'));
            hideController(getController(folders.material.settings, 'refractive_index'));
        },
        'metal': () => {
            showController(getController(folders.material.settings, 'color'));
            showController(getController(folders.material.settings, 'roughness'));
            hideController(getController(folders.material.settings, 'refractive_index'));
        },
        'dielectric': () => {
            hideController(getController(folders.material.settings, 'color'));
            hideController(getController(folders.material.settings, 'roughness'));
            showController(getController(folders.material.settings, 'refractive_index'));
        },
    }
    fnc[material.type]();
};

const updateMaterialControls = (material) => {
    const fnc = {
        'lambert': () => {
            controls.material.color = material.color;
        },
        'metal': () => {
            controls.material.color = material.color;
        },
        'dielectric': () => {
            controls.material.refractive_index = material.refractive_index;
        },
    }
    fnc[material.type]();
};

function addMaterialAction(material) {
    return () => {
        currentMaterialId = material.id;
        controls.material.name = material.name;
        controls.material.id = material.id;
        controls.material.type = material.type;
        updateMaterialControls(material);
        updateMaterialType(material);
    };
}

// ADD MATERIALS AND SELECT DEFAULT

objects.materials.forEach(material => {
    material.action = addMaterialAction(material);
    folders.material.list.add(material, 'action').listen().name(material.name);
});

let currentMaterialId = objects.materials[0].id;
objects.materials[0].action();

objects.shapes.forEach(shape => {
    shape.action = addShapeAction(shape);
    folders.shape.list.add(shape, 'action').listen().name(shape.name);
});

let currentShapeId = objects.shapes[0].id;
objects.shapes[0].action();

const materialOptions = () => {
    // console.log(folders.shape.settings, folders.shape.settings.__controllers[2].__select[0]);
    // const material = objects.materials.find(material => material.id === currentMaterialId);
    const materialController = getController(folders.shape.settings, 'material');

    const selectElement = materialController.domElement.children[0];

    objects.materials.forEach(material => {
        const optionElement = document.createElement('option');
        optionElement.innerText = material.name;
        optionElement.value = material.id;
        selectElement.appendChild(optionElement);
    });

    // const selectElement = materialController.domElement.children[0];
    // const option = Array.from(selectElement.children).find(option => option.value == currentMaterialId);
    // console.log(selectElement.children, option);
    // materialController.setValue(currentMaterialId);
}
materialOptions();

function logObj(obj) { console.log(JSON.stringify(obj, null, 4)); }

// logObj(objects);

function formatObjects() {
    const newObjects = {
        ledger: [],
        spheres: [],
        lamberts: [],
        metals: [],
        dielectrics: [],
    };

    const add = {
        sphere: (shape) => {
            newObjects.spheres.push(
                {
                    origin: [shape.origin.x, shape.origin.y, shape.origin.z],
                    radius: shape.radius,
                }
            );
        },
        lambert: (material) => {
            newObjects.lamberts.push(
                {
                    color: material.color.map(c => c / 255),
                }
            );
        },
        metal: (material) => {
            newObjects.metals.push(
                {
                    color: material.color.map(c => c / 255),
                    roughness: material.roughness,
                }
            );
        },
        dielectric: (material) => {
            newObjects.dielectrics.push(
                {
                    refractive_index: material.refractive_index,
                }
            );
        },
    };

    const capitalizeFirstLetter = s => s.charAt(0).toUpperCase() + s.slice(1);

    const seperateMaterials = {
        lambert: objects.materials.filter(material => material.type === 'lambert'),
        metal: objects.materials.filter(material => material.type === 'metal'),
        dielectric: objects.materials.filter(material => material.type === 'dielectric'),
    }

    objects.shapes.map(shape => {
        const surface = objects.materials.find(
            material => material.id === shape.material).type;
        newObjects.ledger.push({
            surface: capitalizeFirstLetter(surface),
            geometry_index: newObjects[`${shape.type}s`].length,
            material_index: seperateMaterials[surface].map(
                material => material.id).indexOf(shape.material),
        })
        // objects.materials.map(material => material.id).indexOf(shape.material)
        add[shape.type](shape);
    });

    objects.materials.map(material => {
        add[material.type](material);
    });

    // logObj(newObjects);
    return newObjects;
}



const pCanvasFnc = (p) => {
    p.user = {
        scale: 2,
        width: 256 * 1.25,
        height: 256,
        pixels: [],
    }


    p.setup = () => {
        p.createCanvas(
            p.user.width * p.user.scale,
            p.user.height * p.user.scale
        );

        p.user.pixels = new Array(p.user.width * p.user.height).fill([125, 125, 125]),

            p.noStroke();
        p.noLoop();
    }

    p.draw = () => {
        for (let j = 0; j < p.user.height; j++) {
            for (let i = 0; i < p.user.width; i++) {
                const [r, g, b] = p.user.pixels[i + j * p.user.width];
                p.fill(r, g, b);
                p.rect(i * p.user.scale, j * p.user.scale, p.user.scale, p.user.scale);
            }
        }
    }
}

let pCanvas = new p5(pCanvasFnc, 'canvas');

function call_raytracer() {
    const t0 = performance.now();

    const samples_per_pixel = 100;
    const depth = 50;
    const newObjects = formatObjects();

    pCanvas.user.pixels = run_raytracer(
        pCanvas.user.width,
        pCanvas.user.height,
        samples_per_pixel,
        depth,
        newObjects
    );

    pCanvas.draw();
    // console.log(data);
    // console.log(pCanvas);

    const t1 = performance.now();
    console.log(`Complete: ${(t1 - t0) / 1000} s`);
}