class Position {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    ModuloPosition(){
        if (this.x > canvas.width){
            this.x = -hubSize;
        }
    }
}

const hubSize = 130;

var speed, frame, score, canvas, ctx, x_cloud, x_obs, rand_height, min, max, size, velocity, figwidth, s;
var highscore = 0;
var is_ready = 1;

const width = 1920;
const height = 1080;

var helis = [];
const numHelis = 10;

let gun = {
    x: width / 2,
    y: height - 50
};

let bullets = [];

function drawGun() {
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(gun.x, gun.y, 20, 0, 2 * Math.PI);
    ctx.fill();
}

function Shoot(){
    bullets.push({
        x: gun.x,
        y: gun.y - 20
    });
}

function init(){
    helis = [];
    for (let index = 0; index < numHelis; index++) {
        helis.push(GetRandomPosition());
    }

    speed = -4;
    frame = 0;
    canvas = document.getElementById("canvas1");
    ctx = canvas.getContext("2d");

    canvas.width = width;
    canvas.height = height;
    
    x_cloud = canvas.width;
    x_obs = canvas.width;
    rand_height = Math.floor(Math.random() * (max - min + 1)) + min;
    rand_height = canvas.height - rand_height;
    min = 10;
    max = 50;
    size = 80;
    velocity = 0;
    s = size/100;
    figwidth = 500;
    score = 0;
}

init();

window.addEventListener('resize',
    function(){
        init();
    }
)

window.addEventListener('keydown', function(event) {
    if (event.key === 'ArrowLeft') {
        gun.x = Math.max(gun.x - 10, 20);
    } else if (event.key === 'ArrowRight') {
        gun.x = Math.min(gun.x + 10, width - 20);
    }
});

function GetRandomPosition(){
    return {
        position: new Position(-hubSize, Math.random()*height*0.6),
        speed: (Math.random()+0.5)*4,
        wobble: Math.random() * 0.1 + 0.1
    };
}

let img = new Image();
img.src = 'images/hubschrauber1.png';

function drawHubschrauber(position){
    ctx.drawImage(img, position.x, position.y, hubSize, hubSize);
}
    
canvas.addEventListener("click", function() {
    Shoot();
});

ctx.font = "17px Arial";

function updateBullets() {
    for (let i = 0; i < bullets.length; i++) {
        const bullet = bullets[i];
        bullet.y -= 10;

        for (let j = 0; j < helis.length; j++) {
            const heli = helis[j];
            if (bullet.x > heli.position.x && bullet.x < heli.position.x + 130 && bullet.y > heli.position.y && bullet.y < heli.position.y + 130) {
                helis[j].position.x = -hubSize;
                score++;
                break;
            }
        }
    }
}

function drawBullets() {
    ctx.fillStyle = 'black';
    for (let i = 0; i < bullets.length; i++) {
        const bullet = bullets[i];
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 5, 0, 2 * Math.PI);
        ctx.fill();
    }
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    frame += 1;

    updateBullets();
    drawBullets();
    drawGun();

    for (let index = 0; index < helis.length; index++) {
        const heli = helis[index];
        heli.position.x += heli.speed;
        heli.position.y += Math.sin(frame * heli.wobble) * 5;
        heli.position.ModuloPosition();
        drawHubschrauber(heli.position);
    }

    requestAnimationFrame(animate);
    
    ctx.fillText("Score: " + score, canvas.width/2-95, canvas.height/5);
    ctx.fillText("HighScore: " + highscore, canvas.width/2+5, canvas.height/5);
    highscore = Math.max(score, highscore);
}
    
animate();

/*
let cookie = cookies.get('theme');
console.log(cookie);
if (cookie == null){
    cookie = "dark-theme";
}*/

document.getElementById('themeIcon').style.fill = "var(--mainbackground-primary)";

function ChangeTheme(){
    var element = document.body;
    if (element.className == "dark-theme"){
        element.className = "light-theme";
        //cookies.set('theme', 'light-theme', { expires: 100 });
        // document.cookie = "theme=light-theme; path=/";
    }
    else{
        element.className = "dark-theme";
        //cookies.set('theme', 'dark-theme', { expires: 100 });
        // document.cookie = "theme=dark-theme; path=/";
    }
    
    add_colorHex = getComputedStyle(document.body).getPropertyValue('--secondary-worm').trim();
    main_colorHex = getComputedStyle(document.body).getPropertyValue('--primary-worm').trim();

    document.getElementById('themeIcon').style.fill = "var(--mainbackground-primary)";
    init();
}
document.getElementById("themeButton").addEventListener("click", ChangeTheme);

function GetWindowWidth(){
    return window.innerWidth;
}

function GetWindowHeight(){
    return window.innerHeight;
}