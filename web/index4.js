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
        type: 'metal',
        color: { r: 200, g: 200, b: 200 },
        roughness: 0.5,
        refractiveIndex: 1.5,
        propensity: 0.5,
    }
}

const controllers = {
    shape: { list: { items: [] } },
    material: { list: { items: [] }, tabs: { single: {}, range: {}, group: {} } },
}

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

{ // SHAPE EDITOR FOLDER
    controllers.shape.folder = pane.addFolder({
        title: 'Shape Editor',
        expanded: true,
    });

    const c = controllers.shape;
    const v = controls.shape
    const f = c.folder;

    c.name = f.addInput(v, 'name');
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

    c.tabs.tabs = f.addTab({
        pages: [
            { title: 'Single' },
            { title: 'Range' },
            { title: 'Group' },
        ],
    });

    c.tabs.single.tab = c.tabs.tabs.pages[0];
    c.tabs.range.tab = c.tabs.tabs.pages[1];
    c.tabs.group.tab = c.tabs.tabs.pages[2];

    {
        const s = c.tabs.single;
        const t = s.tab;
        s.name = t.addInput(v, 'name');
        s.id = t.addInput(v, 'id');
        s.type = t.addInput(
            v, 'type',
            { options: { lambert: 'lambert', metal: 'metal', dielectric: 'dielectric' } }
        ).on('change', ev => {
            const fnc = {
                lambert: () => {
                    s.color.hidden = false;
                    s.roughness.hidden = true;
                    s.refractiveIndex.hidden = true;
                },
                metal: () => {
                    s.color.hidden = false;
                    s.roughness.hidden = false;
                    s.refractiveIndex.hidden = true;
                },
                dielectric: () => {
                    s.color.hidden = true;
                    s.roughness.hidden = true;
                    s.refractiveIndex.hidden = false;
                },
            }
            fnc[ev.value]();
        });

        s.color = t.addInput(controls.material, 'color');

        s.roughness = t.addInput(controls.material, 'roughness', {
            min: 0.0,
            max: 1.0,
            step: 0.01,
        });
        s.refractiveIndex = t.addInput(controls.material, 'refractiveIndex', {
            label: 'refraction',
            min: 1.0,
            max: 5.0,
            step: 0.01,
        });
    }

    {
        const s = c.tabs.range;
        const t = s.tab;

        s.name = t.addInput(controls.material, 'name');
        s.id = t.addInput(controls.material, 'id');
        s.type = t.addInput(
            v, 'type',
            { options: { lambert: 'lambert', metal: 'metal', dielectric: 'dielectric' } }
        );
        s.materials = [];
        const names = ['Material A', 'Material B'];
        names.forEach(name => {
            const a = {};
            a.folder = t.addFolder({
                title: name,
                expanded: true,
            });

            a.color = a.folder.addInput(controls.material, 'color');
            a.roughness = a.folder.addInput(controls.material, 'roughness', {
                min: 0.0,
                max: 1.0,
                step: 0.01,
            });
            a.refractiveIndex = a.folder.addInput(controls.material, 'refractiveIndex', {
                label: 'refraction',
                min: 1.0,
                max: 5.0,
                step: 0.01,
            });
            s.materials.push(a);
        });
    }

    {
        const s = c.tabs.group;
        const t = s.tab;

        s.name = t.addInput(controls.material, 'name');
        s.id = t.addInput(controls.material, 'id');

        s.materials = [];
        const names = ['Material A', 'Material B', 'Material C'];
        names.forEach(name => {
            const a = {};
            a.folder = t.addFolder({
                title: name,
                expanded: true,
            });

            a.color = a.folder.addInput(
                controls.material, 'name',
                { options: { mirror: 'dc84976c-27ce-41d6-916a-40d4778fda2c' } }
            );

            a.propensity = a.folder.addInput(controls.material, 'propensity', {
                min: 0.0,
                max: 1.0,
                step: 0.01,
            });
            s.materials.push(a);
        });
    }
}


console.log(controllers);

controllers.material.duplicate = controllers.material.folder.addButton({
    title: 'duplicate',
});
controllers.material.delete = controllers.material.folder.addButton({
    title: 'delete',
});

controllers.material.list.folder = pane.addFolder({
    title: 'Material List',
    expanded: true,
});



objects.materials.forEach(material => {
    controllers.material.list.items.push(controllers.material.list.folder.addButton({
        title: material.name,
    }));
})
