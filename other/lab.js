let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');

canvas.width = 2048;
canvas.height = 1080;

ctx.font = "30px Arial";
ctx.textBaseline = 'top';

const textArea = document.getElementById('text');
const graphHeight = 500;
const margin = 50;
let hoverX = 0;
let padding = 0;
let sortedWords = [];

const stopWords = ["a", "пс","about","all","am","an","and","any","are","as","at","be","been","but","by","can","could","do","for","from","has","have","i","if","in","is","it","me","my","no","not","of","on","one","or","so","that","the","them","there","they","this","to","was","we","what","which","will","with","would","you","а","будем","будет","будете","будешь","буду","будут","будучи","будь","будьте","бы","был","была","были","было","быть","в","вам","вами","вас","весь","во","вот","все","всё","всего","всей","всем","всём","всеми","всему","всех","всею","всея","всю","вся","вы","да","для","до","его","едим","едят","ее","её","ей","ел","ела","ем","ему","емъ","если","ест","есть","ешь","еще","ещё","ею","же","за","и","из","или","им","ими","имъ","их","к","как","кем","ко","когда","кого","ком","кому","комья","которая","которого","которое","которой","котором","которому","которою","которую","которые","который","которым","которыми","которых","кто","меня","мне","мной","мною","мог","моги","могите","могла","могли","могло","могу","могут","мое","моё","моего","моей","моем","моём","моему","моею","можем","может","можете","можешь","мои","мой","моим","моими","моих","мочь","мою","моя","мы","на","нам","нами","нас","наса","наш","наша","наше","нашего","нашей","нашем","нашему","нашею","наши","нашим","нашими","наших","нашу","не","него","нее","неё","ней","нем","нём","нему","нет","нею","ним","ними","них","но","о","об","один","одна","одни","одним","одними","одних","одно","одного","одной","одном","одному","одною","одну","он","она","оне","они","оно","от","по","при","с","сам","сама","сами","самим","самими","самих","само","самого","самом","самому","саму","свое","своё","своего","своей","своем","своём","своему","своею","свои","свой","своим","своими","своих","свою","своя","себе","себя","собой","собою","та","так","такая","такие","таким","такими","таких","такого","такое","такой","таком","такому","такою","такую","те","тебе","тебя","тем","теми","тех","то","тобой","тобою","того","той","только","том","томах","тому","тот","тою","ту","ты","у","уже","чего","чем","чём","чему","что","чтобы","эта","эти","этим","этими","этих","это","этого","этой","этом","этому","этот","этою","эту","я","мені","наші","нашої","нашій","нашою","нашім","ті","тієї","тією","тії","теє","будете","будучи","едим","едят","ел","ела","ем","емъ","ест","ешь","имъ","комья","наса","оне","сама","сами","самим","самими","самих","само","самого","самом","самому","саму","томах","тою","этою","am","could","me","them","мені","наші","нашої","нашій","нашою","нашім","ті","тієї","тією","тії","теє"]

function computed() {
    let text = textArea.value;
    let wordCounter = {};

    if (!text) return;

    text.split(/[\n, ' ']/).map(word => {
        word = word.replace(/[.,\/#!?$%\^&\*;:{}=\-_`@~()«»–“”…—]/g,'').toLowerCase();

        const isStopWord = stopWords.find(stopWord => stopWord === word);
        const isNumber = Number.isInteger(+word);

        if (isNumber) {
            word = null;
        }
    
        if (!isStopWord && word) {
            wordCounter[word] = wordCounter[word] + 1 || 1;
        }
    
        return word;
    })

    sortedWords = Object.entries(wordCounter).sort((a, b) => b[1] - a[1]);

    padding = canvas.width / sortedWords.length;

    loop();
}

function loop() {
    ctx.fillStyle = '#000';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgba(255, 255, 255, .3)';
    ctx.fillRect(hoverX * padding, margin, padding, graphHeight);

    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#fff';
    
    if (!sortedWords.length) return;

    let x = 0;

    const maxCount = sortedWords[0][1];
    const startPos = sortedWords[0][1] / maxCount * graphHeight;

    ctx.beginPath();
    ctx.moveTo(x + padding / 2, graphHeight - startPos + margin);

    for (let i = 1; i < sortedWords.length; i++) {
        x += padding;

        const pos = sortedWords[i][1] / maxCount * graphHeight;

        ctx.lineTo(x + padding / 2, graphHeight - pos + margin);
    }

    ctx.stroke();
    ctx.fillText(`${ sortedWords[hoverX][0] }:${ sortedWords[hoverX][1] }`, 0, graphHeight + margin)

    requestAnimationFrame(loop);
}

canvas.addEventListener('mousemove', ({ offsetX }) => {
    hoverX = Math.floor(offsetX / window.innerWidth * canvas.width / padding);

    if (!Number.isFinite(hoverX)) {
        hoverX = 0;
    }
});

textArea.addEventListener('input', () => {
    computed();
});

computed();
loop();