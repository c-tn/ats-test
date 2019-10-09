const v = ['a', 'e', 'i', 'o', 'u'];
const c = ['b', 'c', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm', 'n', 'p', 'q', 'r', 's', 't', 'v', 'w', 'x', 'z'];

function generateName(seed) {
    const length = ~~(seed.unit() * 3) + 4;
    let name = '';

    for (let i = 0; i < length; i++) {
        if (i % 2 === 0) {
            const id = ~~(c.length * seed.unit());
            name += c[id];

            if (seed.unit() > 0.5) {
                name += 'th';
            }
        }
        else {
            const id = ~~(v.length * seed.unit());
            name += v[id];
        }
    }

    return name;
}