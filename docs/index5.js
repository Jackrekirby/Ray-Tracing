const worker = new Worker('./worker.js', { type: 'module' });

worker.init = false;
worker.postMessage({ action: 'init' });

worker.onmessage = (e) => {
    const fnc = {
        'init': () => {
            worker.init = true;
        },
        render: () => {
            const T = scene.image.elapsedSamplesPerPixel;
            const t = scene.image.samplesPerPixel;
            if (T == 0) {
                pCanvas.user.pixels = e.data.output;
            } else {
                pCanvas.user.pixels = pCanvas.user.pixels.map((pixel, i) => {
                    // console.log(pixel, i);
                    const [r1, g1, b1] = pixel;
                    const [r2, g2, b2] = e.data.output[i];
                    const r = (r1 * T + r2 * t) / (T + t);
                    const g = (g1 * T + g2 * t) / (T + t);
                    const b = (b1 * T + b2 * t) / (T + t);
                    return [r, g, b];
                });
            }

            // console.log(pCanvas.user.pixels);
            scene.image.elapsedSamplesPerPixel += scene.image.samplesPerPixel;

            // pCanvas.user.pixels = e.data.output;
            pCanvas.draw();

            const t1 = performance.now();
            console.log(`Complete: ${((t1 - e.data.start) / 1000).toPrecision(3)} s`);
        }
    }
    fnc[e.data.action]();
}

const newId = () => uuid.v4();
// console.log(newId());
const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

const objects = {
    materials: [
        {
            id: '732a4348-6e70-47f7-96ea-adca184b6221',
            name: 'ground',
            surface: 'lambert',
            color: { r: 128, g: 128, b: 128 },
        },
        {
            id: 'bd351f34-815e-42a8-b17d-da37c6db56dd',
            name: 'blue lambert',
            surface: 'lambert',
            color: { r: 128, g: 128, b: 255 },
        },
        {
            id: '69eaca0e-ced1-4578-afe3-a89359d085aa',
            name: 'mirror',
            surface: 'metal',
            color: { r: 125, g: 125, b: 125 },
            roughness: 0.0,
        },
        {
            id: '93d3c46b-dbcc-40ef-8a1d-b3a39e329131',
            name: 'glass',
            surface: 'dielectric',
            refractiveIndex: 1.5,
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

objects.materials.sort((a, b) => {
    if (a.name < b.name) { return -1; }
    if (a.name > b.name) { return 1; }
    return 0;
});

const scene = {
    image: {
        width: 256,
        height: 256,
        postScale: 2,
        samplesPerPixel: 30,
        elapsedSamplesPerPixel: 0,
        rayDepth: 30,
    }
}

const flatGui = {};
const gui = {
    uname: 'pane',
    type: 'pane',
    domId: 'gui',
    children: [
        {
            uname: 'shape.folder',
            type: 'folder',
            options: {
                title: 'Shape Editor',
                expanded: true,
            },
            children: [
                {
                    uname: 'shape.list',
                    type: 'list',
                    label: 'object',
                    value: objects.shapes[0].id,
                    shape: objects.shapes[0],
                    options: objects.shapes.map(shape => {
                        return {
                            text: shape.name,
                            value: shape.id
                        }
                    }),
                    onChange: (e) => {
                        if (e.value != undefined) {
                            const shape = objects.shapes.find(shape =>
                                shape.id === e.value
                            );
                            flatGui.shape.list.shape = shape;
                            flatGui.shape.type.tp.value = shape.type;

                            const fnc = {
                                sphere: () => {
                                    flatGui.shape.radius.value = shape.radius;
                                    flatGui.shape.origin.value = shape.origin;
                                },
                            }
                            fnc[shape.type]();
                            flatGui.shape.name.value = shape.name;
                            flatGui.shape.material.tp.value = shape.material;
                            flatGui.pane.tp.refresh();
                        }
                    },
                    onGuiBuilt: () => {
                        flatGui.shape.list.tp.value = objects.shapes[3].id;
                    }
                },
                {
                    uname: 'shape.name',
                    type: 'input',
                    value: objects.shapes[0].name,
                    options: {
                        label: 'name',
                    },
                    onChange: (e) => {
                        const shape = flatGui.shape.list.shape;
                        if (e.value !== shape.name) {
                            shape.name = e.value;
                            const options = flatGui.shape.list.tp.options.map(option => {
                                if (option.value == flatGui.shape.list.tp.value) {
                                    option.text = e.value;
                                }
                                return option;
                            });

                            options.sort((a, b) => {
                                if (a.text < b.text) { return -1; }
                                if (a.text > b.text) { return 1; }
                                return 0;
                            });
                            flatGui.shape.list.tp.options = options;
                            flatGui.shape.list.tp.value = undefined;
                            flatGui.shape.list.tp.value = shape.id;
                        }
                    },
                },
                {
                    uname: 'shape.type',
                    type: 'list',
                    label: 'type',
                    value: objects.shapes[0].type,
                    options: [
                        {
                            text: 'sphere',
                            value: 'sphere',
                        },
                    ],
                    onChange: (e) => {
                        const shape = flatGui.shape.list.shape;
                        shape.type = e.value;
                    },
                },
                {
                    uname: 'shape.origin',
                    type: 'input',
                    value: { x: 0.12, y: 3.45, z: 6.78 },
                    options: {
                        label: 'origin',
                    },
                    onChange: (e) => {
                        const shape = flatGui.shape.list.shape;
                        shape.origin = e.value;
                    },
                },
                {
                    uname: 'shape.radius',
                    type: 'input',
                    value: 1.0,
                    options: {
                        label: 'radius',
                        step: 0.01,
                    },
                    onChange: (e) => {
                        const shape = flatGui.shape.list.shape;
                        shape.radius = e.value;
                    },
                },
                {
                    uname: 'shape.material',
                    type: 'list',
                    label: 'material',
                    value: objects.shapes[0].material,
                    options: objects.materials.map(material => {
                        return {
                            text: material.name,
                            value: material.id
                        }
                    }),
                    onChange: (e) => {
                        const shape = flatGui.shape.list.shape;
                        shape.material = e.value;
                    },
                    onGuiBuilt: () => {
                        flatGui.shape.material.tp.value = objects.shapes[0].material;
                    }
                },
                {
                    uname: 'shape.duplicate',
                    type: 'button',
                    options: {
                        title: 'duplicate',
                    },
                    onClick: (e) => {
                        const shape = deepClone(flatGui.shape.list.shape);
                        shape.id = newId();
                        shape.name = shape.name.replace(/ *\([^)]*\) */g, "");
                        const numCopies = objects.shapes.filter(
                            item => {
                                const otherName = item.name.replace(/ *\([^)]*\) */g, "");;
                                return otherName === shape.name;
                            }
                        ).length;
                        shape.name += ` (${numCopies})`;

                        objects.shapes.push(shape);

                        const options = [
                            ...flatGui.shape.list.tp.options, {
                                text: shape.name,
                                value: shape.id,
                            }
                        ];
                        options.sort((a, b) => {
                            if (a.text < b.text) { return -1; }
                            if (a.text > b.text) { return 1; }
                            return 0;
                        });
                        flatGui.shape.list.tp.options = options;
                        flatGui.shape.list.tp.value = shape.id;
                        flatGui.shape.delete.tp.disabled = false;
                    }
                },
                {
                    uname: 'shape.delete',
                    type: 'button',
                    options: {
                        title: 'delete',
                    },
                    onClick: (e) => {
                        const shape = flatGui.shape.list.shape;

                        objects.shapes = objects.shapes.filter(other =>
                            other.id !== shape.id);

                        flatGui.shape.list.tp.options =
                            flatGui.shape.list.tp.options.filter(option =>
                                option.value !== shape.id);
                        flatGui.shape.list.tp.value = objects.shapes[0].id;
                        if (objects.shapes.length == 1) {
                            flatGui.shape.delete.tp.disabled = true;
                        }
                    }
                },

            ]
        },
        {
            uname: 'materialFolder',
            type: 'folder',
            options: {
                title: 'Material Editor',
                expanded: true,
            },
            children: [
                {
                    uname: 'materialList',
                    type: 'list',
                    label: 'material',
                    value: objects.materials[0].id,
                    material: objects.materials[0],
                    options: objects.materials.map(material => {
                        return {
                            text: material.name,
                            value: material.id
                        }
                    }),
                    onChange: (e) => {
                        if (e.value != undefined) {
                            const material = objects.materials.find(material =>
                                material.id === e.value
                            );
                            flatGui.materialList.material = material;
                            flatGui.surface.tp.value = material.surface;

                            const fnc = {
                                lambert: () => {
                                    flatGui.color.value = material.color;
                                },
                                metal: () => {
                                    flatGui.color.value = material.color;
                                    flatGui.roughness.value = material.roughness;
                                },
                                dielectric: () => {
                                    flatGui.refractiveIndex.value = material.refractiveIndex;
                                }
                            }
                            fnc[material.surface]();
                            flatGui.name.value = material.name;
                            flatGui.pane.tp.refresh();
                        }
                    },
                    onGuiBuilt: () => {
                        flatGui.materialList.tp.value = objects.materials[1].id;
                    }
                },
                {
                    uname: 'name',
                    type: 'input',
                    value: objects.materials[0].name,
                    options: {
                        label: 'name',
                    },
                    onChange: (e) => {
                        const material = flatGui.materialList.material;
                        if (e.value !== material.name) {
                            material.name = e.value;
                            const options = flatGui.materialList.tp.options.map(option => {
                                if (option.value == flatGui.materialList.tp.value) {
                                    option.text = e.value;
                                }
                                return option;
                            });

                            options.sort((a, b) => {
                                if (a.text < b.text) { return -1; }
                                if (a.text > b.text) { return 1; }
                                return 0;
                            });
                            flatGui.materialList.tp.options = options;
                            flatGui.shape.material.tp.options = options;
                            flatGui.materialList.tp.value = undefined;
                            flatGui.materialList.tp.value = material.id;
                        }
                    },
                },
                {
                    uname: 'surface',
                    type: 'list',
                    label: 'surface',
                    value: objects.materials[0].surface,
                    options: [
                        {
                            text: 'lambert',
                            value: 'lambert',
                        },
                        {
                            text: 'metal',
                            value: 'metal',
                        },
                        {
                            text: 'dielectric',
                            value: 'dielectric',
                        }
                    ],
                    setDependencyVisibility: (surface) => {
                        const material = flatGui.materialList.material;
                        const fnc = {
                            lambert: () => {
                                if (material.color === undefined) material.color = flatGui.color.value;
                                if (material.roughness !== undefined) delete material.roughness;
                                if (material.refractiveIndex !== undefined) delete material.refractiveIndex;

                                flatGui.color.tp.hidden = false;
                                flatGui.roughness.tp.hidden = true;
                                flatGui.refractiveIndex.tp.hidden = true;
                            },
                            metal: () => {
                                flatGui.color.tp.hidden = false;
                                flatGui.roughness.tp.hidden = false;
                                flatGui.refractiveIndex.tp.hidden = true;
                            },
                            dielectric: () => {
                                flatGui.color.tp.hidden = true;
                                flatGui.roughness.tp.hidden = true;
                                flatGui.refractiveIndex.tp.hidden = false;
                            }
                        }
                        fnc[surface]();
                        // console.log(material);
                    },
                    onChange: (e) => {
                        const material = flatGui.materialList.material;
                        flatGui.surface.setDependencyVisibility(e.value);
                        material.surface = e.value;
                    },
                },
                {
                    uname: 'color',
                    type: 'input',
                    value: { r: 150, g: 150, b: 255 },
                    options: {
                        label: 'color',
                    },
                    onChange: (e) => {
                        const material = flatGui.materialList.material;
                        material.color = flatGui.color.value;
                    },
                },
                {
                    uname: 'roughness',
                    type: 'input',
                    value: 0.5,
                    options: {
                        label: 'roughness',
                        min: 0.0,
                        max: 1.0,
                        step: 0.01,
                    },
                    onChange: (e) => {
                        const material = flatGui.materialList.material;
                        material.roughness = flatGui.roughness.value;
                    },
                },
                {
                    uname: 'refractiveIndex',
                    type: 'input',
                    value: 1.5,
                    options: {
                        label: 'refraction',
                        min: 1.0,
                        max: 5.0,
                        step: 0.01,
                    },
                    onChange: (e) => {
                        const material = flatGui.materialList.material;
                        material.refractiveIndex = flatGui.refractiveIndex.value;
                    },
                },
                {
                    uname: 'duplicate',
                    type: 'button',
                    options: {
                        title: 'duplicate',
                    },
                    onClick: (e) => {
                        const material = deepClone(flatGui.materialList.material);
                        material.id = newId();
                        material.name = material.name.replace(/ *\([^)]*\) */g, "");
                        const numCopies = objects.materials.filter(
                            item => {
                                const otherName = item.name.replace(/ *\([^)]*\) */g, "");;
                                return otherName === material.name;
                            }
                        ).length;
                        material.name += ` (${numCopies})`;

                        objects.materials.push(material);

                        const options = [
                            ...flatGui.materialList.tp.options, {
                                text: material.name,
                                value: material.id,
                            }
                        ];
                        options.sort((a, b) => {
                            if (a.text < b.text) { return -1; }
                            if (a.text > b.text) { return 1; }
                            return 0;
                        });
                        flatGui.materialList.tp.options = options;
                        flatGui.materialList.tp.value = material.id;
                        flatGui.delete.tp.disabled = false;

                        flatGui.shape.material.tp.options = options;
                    }
                },
                {
                    uname: 'delete',
                    type: 'button',
                    options: {
                        title: 'delete',
                    },
                    onClick: (e) => {
                        const material = flatGui.materialList.material;

                        objects.materials = objects.materials.filter(other =>
                            other.id !== material.id);

                        const options = flatGui.materialList.tp.options.filter(option =>
                            option.value !== material.id);
                        flatGui.materialList.tp.options = options;
                        flatGui.shape.material.tp.options = options;

                        if (flatGui.shape.material.tp.value == material.id) {
                            flatGui.shape.material.tp.value = objects.materials[0].id;
                        }

                        flatGui.materialList.tp.value = objects.materials[0].id;
                        if (objects.materials.length == 1) {
                            flatGui.delete.tp.disabled = true;
                        }
                    }
                },

            ]

        },
        {
            uname: 'image.folder',
            type: 'folder',
            options: {
                title: 'Image Editor',
                expanded: true,
            },
            update: (sizeChanged) => {
                clearTimeout(flatGui.image.folder.timeout);
                flatGui.image.folder.timeout = setTimeout(() => {
                    if (sizeChanged) {
                        pCanvas.user.pixels = new Array(scene.image.width * scene.image.height).
                            fill([187, 188, 196]);
                    }
                    pCanvas.resizeCanvas(scene.image.width * scene.image.postScale,
                        scene.image.height * scene.image.postScale);
                }, 1000)
            },
            children: [
                {
                    uname: 'image.size',
                    type: 'input',
                    value: { x: scene.image.width, y: scene.image.height },
                    options: {
                        label: 'size',
                        x: { min: 0, max: 3840, step: 1 },
                        y: { min: 0, max: 2160, step: 1 },
                    },
                    onChange: (e) => {
                        scene.image.width = e.value.x;
                        scene.image.height = e.value.y;
                        flatGui.image.folder.update(true);
                    },
                },
                {
                    uname: 'image.rayDepth',
                    type: 'input',
                    value: scene.image.rayDepth,
                    options: {
                        label: 'ray depth',
                        min: 1, max: 500, step: 1,
                    },
                    onChange: (e) => {
                        scene.image.rayDepth = e.value;
                    },
                },
                {
                    uname: 'image.samplesPerPixel',
                    type: 'input',
                    value: scene.image.samplesPerPixel,
                    options: {
                        label: 'rays/pixel',
                        min: 1, max: 500, step: 1,
                    },
                    onChange: (e) => {
                        scene.image.samplesPerPixel = e.value;
                    },
                },
                {
                    uname: 'image.postScale',
                    type: 'input',
                    value: scene.image.postScale,
                    options: {
                        label: 'post scale',
                        min: 1, max: 5, step: 1,
                    },
                    onChange: (e) => {
                        scene.image.postScale = e.value;
                        flatGui.image.folder.update(false);
                    },
                },
            ],
        },
        {
            uname: 'log',
            type: 'button',
            options: {
                title: 'log',
            },
            onClick: (e) => {
                console.log('gui', gui);
                console.log('flatgui', flatGui);
                console.log('objects', objects);
            }
        },
        {
            uname: 'clear',
            type: 'button',
            options: {
                title: 'clear',
            },
            onClick: (e) => {
                pCanvas.user.pixels = new Array(scene.image.width * scene.image.height).
                    fill([187, 188, 196]);
                scene.image.elapsedSamplesPerPixel = 0;
                pCanvas.draw();
            }
        },
        {
            uname: 'render',
            type: 'button',
            options: {
                title: 'render',
            },
            onClick: (e) => {
                call_raytracer();
            }
        }
    ]
};

const handle = (object, parent) => {
    const handleChildren = () => object.children.forEach(child => handle(child, object));
    const fnc = {
        pane: () => {
            object.tp = new Tweakpane.Pane({
                container: document.getElementById(object.domId),
            });
            handleChildren();
        },
        folder: () => {
            object.tp = parent.tp.addFolder(object.options);
            handleChildren();
        },
        input: () => {
            object.tp = parent.tp.addInput(object, 'value', object.options);
            object.tp.on('change', (e) => object.onChange(e));
        },
        list: () => {
            object.tp = parent.tp.addBlade({
                view: 'list',
                label: object.label,
                options: object.options,
                value: object.value,
            });
            object.tp.on('change', (e) => object.onChange(e));
        },
        button: () => {
            object.tp = parent.tp.addButton(object.options);
            object.tp.on('click', (e) => object.onClick(e));
        }
    }
    fnc[object.type]();
    const ukeys = object.uname.split('.');
    let flatGuiNode = flatGui;
    if (ukeys.length > 1) {
        ukeys.slice(0, -1).forEach(key => {
            if (!(key in flatGuiNode)) flatGuiNode[key] = {};
            flatGuiNode = flatGuiNode[key];
        })
    }
    flatGuiNode[ukeys.at(-1)] = object;
    if (object.onBuilt !== undefined) { object.onBuilt() };
}

handle(gui, undefined);

Object.values(flatGui).forEach(object => {
    if (object.onGuiBuilt) { object.onGuiBuilt() };
});















function logObj(obj) { console.log(JSON.stringify(obj, null, 4)); }

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
                    color: [material.color.r, material.color.g, material.color.b].map(c => c / 255),
                }
            );
        },
        metal: (material) => {
            newObjects.metals.push(
                {
                    color: [material.color.r, material.color.g, material.color.b].map(c => c / 255),
                    roughness: material.roughness,
                }
            );
        },
        dielectric: (material) => {
            newObjects.dielectrics.push(
                {
                    refractive_index: material.refractiveIndex,
                }
            );
        },
    };

    const capitalizeFirstLetter = s => s.charAt(0).toUpperCase() + s.slice(1);

    const seperateMaterials = {
        lambert: objects.materials.filter(material => material.surface === 'lambert'),
        metal: objects.materials.filter(material => material.surface === 'metal'),
        dielectric: objects.materials.filter(material => material.surface === 'dielectric'),
    }

    objects.shapes.map(shape => {
        const surface = objects.materials.find(
            material => material.id === shape.material).surface;
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
        add[material.surface](material);
    });

    // logObj(newObjects);
    return newObjects;
}

const pCanvasFnc = (p) => {
    p.user = {
        pixels: [],
    }

    p.setup = () => {
        p.createCanvas(
            Math.floor(scene.image.width * scene.image.postScale),
            Math.floor(scene.image.height * scene.image.postScale),
        );

        p.user.pixels = new Array(scene.image.width * scene.image.height).
            fill([187, 188, 196]);

        p.noStroke();
        p.noLoop();
    }

    p.draw = () => {
        for (let j = 0; j < scene.image.height; j++) {
            for (let i = 0; i < scene.image.width; i++) {
                const [r, g, b] = p.user.pixels[i + j * scene.image.width];
                p.fill(r, g, b);
                p.rect(i * scene.image.postScale, j * scene.image.postScale,
                    scene.image.postScale, scene.image.postScale);
            }
        }
    }
}

let pCanvas = new p5(pCanvasFnc, 'canvas');

function call_raytracer() {
    const newObjects = formatObjects();
    // console.log(JSON.stringify(newObjects));

    if (worker.init) {
        worker.postMessage({
            action: 'render',
            start: performance.now(),
            arguments: {
                width: scene.image.width,
                height: scene.image.height,
                samples: scene.image.samplesPerPixel,
                depth: scene.image.rayDepth,
                objects: newObjects
            }
        })
    } else {
        console.error('worker not initiated');
    }


}