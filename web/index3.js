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

const objects = {
    materials: [
        {
            id: newId(),
            name: 'grass',
            type: 'lambert',
            color: [125, 255, 125],
        },
        {
            id: newId(),
            name: 'mirror',
            type: 'metal',
            color: [125, 125, 125],
            roughness: 0.5,
        },
        {
            id: newId(),
            name: 'glass',
            type: 'dielectric',
            refractive_index: 1.5,
        },
    ],
    shapes: [
        {
            id: newId(),
            name: 'planet',
            type: 'sphere',
            origin: { x: 1.0, y: 2.0, z: 3.0 },
            radius: 0.5,
        },
    ]
}

const rust = {
    run: () => {

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
        console.log(folders.shape.settings.__controllers[2]);
    });

folders.shape.settings.add(controls.shape.origin, 'x').listen().onChange(newValue => {
    const shape = objects.shapes.find(shape => shape.id === currentShapeId);
    shape.origin.x = newValue;
});

folders.shape.settings.add(controls.shape.origin, 'y').listen().onChange(newValue => {
    const shape = objects.shapes.find(shape => shape.id === currentShapeId);
    shape.origin.x = newValue;
});

folders.shape.settings.add(controls.shape.origin, 'z').listen().onChange(newValue => {
    const shape = objects.shapes.find(shape => shape.id === currentShapeId);
    shape.origin.x = newValue;
});

folders.shape.settings.add(controls.shape, 'radius').listen().onChange(newValue => {
    const shape = objects.shapes.find(shape => shape.id === currentShapeId);
    shape.radius = newValue;
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
        controls.shape.origin.x = shape.origin.x;
        controls.shape.origin.y = shape.origin.y;
        controls.shape.origin.z = shape.origin.z;
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

    objects.materials.forEach(material => {
        const optionElement = document.createElement('option');
        optionElement.innerText = material.name;
        optionElement.value = material.id;
        const selectElement = materialController.domElement.children[0];
        selectElement.appendChild(optionElement);
    });

    materialController.setValue(currentMaterialId);
}
materialOptions();
console.log(objects);

