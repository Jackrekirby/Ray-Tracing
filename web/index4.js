const newId = () => uuid.v4();
function logObj(obj) { console.log(JSON.stringify(obj, null, 4)); }

function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

const pane = new Tweakpane.Pane({
    container: document.getElementById('gui'),
});

const controls = {
    shape: {
        name: 'undefined',
        id: 'undefined',
        shape: 'undefined',
        material: 'undefined',
        origin: { x: -1.23, y: -4.56, z: -7.89 },
        radius: -0.12,
    },
    material: {
        name: 'mirror',
        id: '88d54e2a-a589-466d-af72-fcbd8e2508c8',
        type: 'single',
        material: 'metal',
        single: {
            color: { r: 200, g: 200, b: 200 },
            roughness: 0.5,
            refractiveIndex: 1.5,
        },
        range: [
            {
                color: { r: 200, g: 200, b: 200 },
                roughness: 0.5,
                refractiveIndex: 1.5,
            },
            {
                color: { r: 200, g: 200, b: 200 },
                roughness: 0.5,
                refractiveIndex: 1.5,
            }
        ],
        group: [
            {
                id: '88d54e2a-a589-466d-af72-fcbd8e2508c8',
                propensity: 0.5,
            },
            {
                id: '88d54e2a-a589-466d-af72-fcbd8e2508c8',
                propensity: 0.5,
            },
            {
                id: '88d54e2a-a589-466d-af72-fcbd8e2508c8',
                propensity: 0.5,
            }
        ]
    }
}

const controllers = {
    shape: { list: { items: [] } },
    material: { list: { items: [] }, single: {}, range: {}, group: {} },
}

const objects = {
    materials: [
        {
            id: '732a4348-6e70-47f7-96ea-adca184b6221',
            name: 'ground',
            type: 'single',
            material: 'lambert',
            color: { r: 128, g: 128, b: 128 },
        },
        {
            id: 'bd351f34-815e-42a8-b17d-da37c6db56dd',
            name: 'blue lambert',
            type: 'single',
            material: 'lambert',
            color: { r: 128, g: 128, b: 255 },
        },
        {
            id: '69eaca0e-ced1-4578-afe3-a89359d085aa',
            name: 'mirror',
            type: 'single',
            material: 'metal',
            color: { r: 128, g: 128, b: 128 },
            roughness: 0.0,
        },
        {
            id: '93d3c46b-dbcc-40ef-8a1d-b3a39e329131',
            name: 'glass',
            type: 'single',
            material: 'dielectric',
            refractive_index: 1.5,
        },
        {
            id: '93d3c46b-dbcc-40ef-4463-b3a39e329131',
            name: 'metal rainbow',
            type: 'range',
            material: 'metal',
            range: [
                {
                    color: { r: 200, g: 200, b: 200 },
                    roughness: 0.0,
                },
                {
                    color: { r: 255, g: 255, b: 255 },
                    roughness: 0.1,
                }
            ],
        },
        {
            id: '2a357c2d-dbcc-40ef-4463-b3a39e329131',
            name: 'random material',
            type: 'group',
            group: [
                {
                    id: '88d54e2a-a589-466d-af72-fcbd8e2508c8',
                    propensity: 0.1,
                },
                {
                    id: '88d54e2a-a589-466d-af72-fcbd8e2508c8',
                    propensity: 0.5,
                },
                {
                    id: '88d54e2a-a589-466d-af72-fcbd8e2508c8',
                    propensity: 0.4,
                }
            ]
        }
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

{ // SHAPE EDITOR FOLDER
    controllers.shape.folder = pane.addFolder({
        title: 'Shape Editor',
        expanded: true,
    });

    const c = controllers.shape;
    const v = controls.shape
    const f = c.folder;

    c.name = f.addInput(v, 'name').on('change', (ev) => {
        const shape = objects.shapes.find(shape => shape.id === controls.shape.id);
        shape.name = controls.shape.name;
        c.list.items.find(item => item.id === v.id).title = shape.name;
    });
    c.id = f.addInput(v, 'id');
    c.shape = f.addInput(v, 'shape',
        { options: { sphere: 'sphere' } }
    );
    c.origin = f.addInput(v, 'origin', {
        x: { step: 0.01 },
        y: { step: 0.01 },
        z: { step: 0.01 }
    });
    c.radius = f.addInput(v, 'radius', { step: 0.01 }).on('change', (ev) => {
        const shape = objects.shapes.find(shape => shape.id === controls.shape.id);
        shape.radius = controls.shape.radius;
    });
    c.material = f.addBlade({
        view: 'list',
        label: 'material',
        options: objects.materials.map(material => {
            return {
                text: material.name,
                value: material.id
            }
        }),
        value: 'undefined',
    }).on('change', (ev) => {
        const shape = objects.shapes.find(shape => shape.id === controls.shape.id);
        controls.shape.material = ev.value;
        shape.material = ev.value;
    });

    c.duplicate = f.addButton({
        title: 'duplicate',
    }).on('click', () => {
        const shape = deepClone(objects.shapes.find(shape => shape.id === controls.shape.id));
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
        addShapeToList(shape);
        selectShape(shape);
        c.delete.disabled = false;
    });

    c.delete = f.addButton({
        title: 'delete',
    }).on('click', () => {
        objects.shapes = objects.shapes.filter(
            item => item.id !== v.id
        );

        c.list.items.find(item => item.id === v.id).dispose();
        selectShape(objects.shapes[0]);
        if (objects.shapes.length == 1) c.delete.disabled = true;
    });

    // SHAPE LIST FOLDER
    controllers.shape.list.folder = pane.addFolder({
        title: 'Shape List',
        expanded: true,
    });

    const selectShape = shape => {
        v.name = shape.name;
        v.id = shape.id;
        v.shape = shape.shape;
        v.origin = shape.origin;
        v.radius = shape.radius;
        v.material = shape.material;
        c.material.value = shape.material;
        pane.refresh();
    }

    const addShapeToList = shape => {
        const item = c.list.folder.addButton({
            title: shape.name
        }).on('click', () => selectShape(shape));
        item.id = shape.id;
        c.list.items.push(item);
    }

    objects.shapes.forEach(shape => addShapeToList(shape));
    selectShape(objects.shapes[0]);
}


{
    controllers.material.folder = pane.addFolder({
        title: 'Material Editor',
        expanded: true,
    });

    const c = controllers.material;
    const v = controls.material
    const f = c.folder;

    c.name = f.addInput(v, 'name');
    c.id = f.addInput(v, 'id');

    const changeType = (type) => {
        const fnc = {
            single: () => {
                c.material.hidden = false;
                c.single.color.hidden = false;
                c.single.roughness.hidden = false;
                c.single.refractiveIndex.hidden = false;

                c.range.materials[0].folder.hidden = true;
                c.range.materials[1].folder.hidden = true;
                c.group.materials[0].folder.hidden = true;
                c.group.materials[1].folder.hidden = true;
                c.group.materials[2].folder.hidden = true;
            },
            range: () => {
                c.material.hidden = false;
                c.single.color.hidden = true;
                c.single.roughness.hidden = true;
                c.single.refractiveIndex.hidden = true;

                c.range.materials[0].folder.hidden = false;
                c.range.materials[1].folder.hidden = false;
                c.group.materials[0].folder.hidden = true;
                c.group.materials[1].folder.hidden = true;
                c.group.materials[2].folder.hidden = true;
            },
            group: () => {
                c.material.hidden = true;
                c.single.color.hidden = true;
                c.single.roughness.hidden = true;
                c.single.refractiveIndex.hidden = true;

                c.range.materials[0].folder.hidden = true;
                c.range.materials[1].folder.hidden = true;
                c.group.materials[0].folder.hidden = false;
                c.group.materials[1].folder.hidden = false;
                c.group.materials[2].folder.hidden = false;
            },
        }
        fnc[type]();
        c.type.value = type;
        v.type = type;
    }

    c.type = f.addBlade({
        view: 'list',
        label: 'type',
        options: [
            {
                text: 'single',
                value: 'single',
            },
            {
                text: 'range',
                value: 'range',
            },
            {
                text: 'group',
                value: 'group',
            }
        ],
        value: 'undefined',
    }).on('change', ev => { changeType(ev.value); });


    const changeMaterial = (type, material) => {
        const fnc = {
            single: {
                lambert: () => {
                    c.single.color.hidden = false;
                    c.single.roughness.hidden = true;
                    c.single.refractiveIndex.hidden = true;
                },
                metal: () => {
                    c.single.color.hidden = false;
                    c.single.roughness.hidden = false;
                    c.single.refractiveIndex.hidden = true;
                },
                dielectric: () => {
                    c.single.color.hidden = true;
                    c.single.roughness.hidden = true;
                    c.single.refractiveIndex.hidden = false;
                },
            },
            range: {
                lambert: () => {
                    c.range.materials[0].color.hidden = false;
                    c.range.materials[0].roughness.hidden = true;
                    c.range.materials[0].refractiveIndex.hidden = true;
                    c.range.materials[1].color.hidden = false;
                    c.range.materials[1].roughness.hidden = true;
                    c.range.materials[1].refractiveIndex.hidden = true;
                },
                metal: () => {
                    c.range.materials[0].color.hidden = false;
                    c.range.materials[0].roughness.hidden = false;
                    c.range.materials[0].refractiveIndex.hidden = true;
                    c.range.materials[1].color.hidden = false;
                    c.range.materials[1].roughness.hidden = false;
                    c.range.materials[1].refractiveIndex.hidden = true;
                },
                dielectric: () => {
                    c.range.materials[0].color.hidden = true;
                    c.range.materials[0].roughness.hidden = true;
                    c.range.materials[0].refractiveIndex.hidden = false;
                    c.range.materials[1].color.hidden = true;
                    c.range.materials[1].roughness.hidden = true;
                    c.range.materials[1].refractiveIndex.hidden = false;
                },
            }
        }
        fnc[type][material]();
        v.material = material;
        c.material.value = material;
    }

    c.material = f.addBlade({
        view: 'list',
        label: 'material',
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
        value: 'undefined',
    }).on('change', ev => { changeMaterial(v.type, ev.value) });

    c.single.color = f.addInput(v.single, 'color');

    c.single.roughness = f.addInput(v.single, 'roughness', {
        min: 0.0,
        max: 1.0,
        step: 0.01,
    });
    c.single.refractiveIndex = f.addInput(v.single, 'refractiveIndex', {
        label: 'refraction',
        min: 1.0,
        max: 5.0,
        step: 0.01,
    });

    c.range.materials = [];
    const rangeNames = ['Material A', 'Material B'];
    rangeNames.forEach((name, i) => {
        const a = {};
        a.folder = f.addFolder({
            title: name,
            expanded: true,
        });
        a.color = a.folder.addInput(v.range[i], 'color');
        a.roughness = a.folder.addInput(v.range[i], 'roughness', {
            min: 0.0,
            max: 1.0,
            step: 0.01,
        });
        a.refractiveIndex = a.folder.addInput(v.range[i], 'refractiveIndex', {
            label: 'refraction',
            min: 1.0,
            max: 5.0,
            step: 0.01,
        });
        c.range.materials.push(a);
    });

    c.group.materials = [];
    const groupNames = ['Material A', 'Material B', 'Material C'];
    groupNames.forEach((name, i) => {
        const a = {};
        a.folder = f.addFolder({
            title: name,
            expanded: true,
        });

        a.id = a.folder.addBlade({
            view: 'list',
            label: 'name',
            options: objects.materials.map(material => {
                return {
                    text: material.name,
                    value: material.id
                }
            }),
            value: 'undefined',
        }).on('change', ev => { });

        a.propensity = a.folder.addInput(v.group[i], 'propensity', {
            min: 0.0,
            max: 1.0,
            step: 0.01,
        });
        c.group.materials.push(a);
    });

    c.duplicate = f.addButton({
        title: 'duplicate',
    });
    c.delete = f.addButton({
        title: 'delete',
    });

    // MATERIAL LIST FOLDER
    controllers.material.list.folder = pane.addFolder({
        title: 'Material List',
        expanded: true,
    });

    const selectMaterial = material => {
        v.name = material.name;
        v.id = material.id;
        v.type = material.type;

        const fnc2 = {
            lambert: (a, material) => {
                a.color = material.color;
            },
            metal: (a, material) => {
                a.color = material.color;
                a.roughness = material.roughness;
            },
            dielectric: (a, material) => {
                a.refractiveIndex = material.refractiveIndex;
            },
        }

        const fnc = {
            single: () => {
                v.material = material.material;
                fnc2[v.material](v.single, material);
                changeMaterial(v.type, v.material);
            },
            range: () => {
                v.material = material.material;
                fnc2[v.material](v.range[0], material.range[0]);
                fnc2[v.material](v.range[1], material.range[1]);
                changeMaterial(v.type, v.material);
            },
            group: () => {
                for (let i = 0; i < 3; i++) {
                    v.group[i].id = material.group[i].id;
                    v.group[i].propensity = material.group[i].propensity;
                }
            }
        }

        changeType(v.type);
        fnc[v.type]();
        pane.refresh();
    }

    const addMaterialToList = material => {
        const item = c.list.folder.addButton({
            title: material.name
        }).on('click', () => selectMaterial(material));
        item.id = material.id;
        c.list.items.push(item);
    }

    objects.materials.forEach(material => addMaterialToList(material));
    selectMaterial(objects.materials[0]);
}

// controllers.material.list.folder = pane.addFolder({
//     title: 'Material List',
//     expanded: true,
// });

// objects.materials.forEach(material => {
//     controllers.material.list.items.push(controllers.material.list.folder.addButton({
//         title: material.name,
//     }));
// });

console.log(controllers);
console.log(controls);