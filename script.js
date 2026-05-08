const truck = document.getElementById("truck");

const xText = document.getElementById("xPos");
const yText = document.getElementById("yPos");
const angleText = document.getElementById("angle");

const speedValue = document.getElementById("speedValue");
const needle = document.getElementById("needle");

const fl = document.getElementById("flSpeed");
const fr = document.getElementById("frSpeed");
const bl = document.getElementById("blSpeed");
const br = document.getElementById("brSpeed");

const canvas = document.getElementById("minimap");
const ctx = canvas.getContext("2d");

canvas.width = 262;
canvas.height = 262;

/* WORLD */
const BOX = 500;
const HALF = BOX / 2;

let x = 0, y = 0;
let angle = 0;

let speed = 0;
let running = false;

/* steering */
let steer = 0;
let steerTarget = 0;

/* trail */
const trail = [];

/* controls */
document.getElementById("playBtn").onclick = () => running = true;
document.getElementById("pauseBtn").onclick = () => running = false;

document.getElementById("resetBtn").onclick = () => {
    x = 0;
    y = 0;
    angle = 0;
    speed = 0;
    steer = 0;
    steerTarget = 0;
    trail.length = 0;
    running = false;
};

/* utils */
function clamp(v, min, max){
    return Math.max(min, Math.min(max, v));
}

function norm(a){
    return Math.atan2(Math.sin(a), Math.cos(a));
}

/* =========================
   SMOOTH SPEED SYSTEM
   ========================= */

let goalSpeed = 0;     // raw random "driver intent"
let targetSpeed = 0;   // smoothed intent
let timer = 0;

/* generate smooth speed behavior */
function updateSpeedLogic(){

    timer--;

    if(timer <= 0){
        goalSpeed = Math.random() * 135;
        timer = 300 + Math.random() * 400;
    }

    /* smooth transition to goal */
    targetSpeed += (goalSpeed - targetSpeed) * 0.0055;

    /* smooth vehicle speed toward target */
    speed += (targetSpeed - speed) * 0.015;

    /* slight natural drag */
    speed *= 0.995;

    speed = clamp(speed, 0, 135);
}

/* collision */
function collide(){

    const bounce = 0.85;

    if(x > HALF){
        x = HALF;
        angle = Math.PI - angle;
        speed *= bounce;
    }
    if(x < -HALF){
        x = -HALF;
        angle = Math.PI - angle;
        speed *= bounce;
    }

    if(y > HALF){
        y = HALF;
        angle = -angle;
        speed *= bounce;
    }
    if(y < -HALF){
        y = -HALF;
        angle = -angle;
        speed *= bounce;
    }

    angle = norm(angle);
}

/* MAIN LOOP */
function loop(){

    if(running){

        updateSpeedLogic();

        /* steering */
        if(Math.random() < 0.02){
            steerTarget = (Math.random() - 0.5) * 0.9;
        }

        steer += (steerTarget - steer) * 0.02;
        angle += steer * 0.03;

        /* movement */
        const move = speed / 60;

        x += Math.cos(angle) * move;
        y += Math.sin(angle) * move;

        collide();

        trail.push({x,y});
    }

    const box = document.getElementById("worldBox");
    const r = box.getBoundingClientRect();

    const cx = r.width / 2;
    const cy = r.height / 2;

    truck.style.left = (cx + x) + "px";
    truck.style.top = (cy + y) + "px";
    truck.style.transform = `translate(-50%,-50%) rotate(${angle}rad)`;

    xText.textContent = x.toFixed(1);
    yText.textContent = y.toFixed(1);
    angleText.textContent = (angle * 180 / Math.PI).toFixed(1);

    speedValue.textContent = speed.toFixed(0) + " km/h";

    /* needle */
    const ratio = speed / 135;
    const needleAngle = -135 + (270 * ratio);

    needle.style.transform =
        `translateX(-50%) rotate(${needleAngle}deg)`;

    fl.textContent = speed.toFixed(1);
    fr.textContent = speed.toFixed(1);
    bl.textContent = speed.toFixed(1);
    br.textContent = speed.toFixed(1);

    drawMinimap();

    requestAnimationFrame(loop);
}

/* MINIMAP */
function drawMinimap(){

    ctx.fillStyle = "#f2f2e8";
    ctx.fillRect(0,0,canvas.width,canvas.height);

    const cX = canvas.width / 2;
    const cY = canvas.height / 2;

    const scale = canvas.width / BOX;

    ctx.lineWidth = 1;
    ctx.strokeStyle = "#bbb";

    for(let i = -HALF; i <= HALF; i += 50){

        ctx.beginPath();
        ctx.moveTo(cX + i * scale, 0);
        ctx.lineTo(cX + i * scale, canvas.height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, cY - i * scale);
        ctx.lineTo(canvas.width, cY - i * scale);
        ctx.stroke();
    }

    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(cX, 0);
    ctx.lineTo(cX, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, cY);
    ctx.lineTo(canvas.width, cY);
    ctx.stroke();

    /* trail (thin, permanent) */
    ctx.strokeStyle = "red";
    ctx.lineWidth = 1;

    ctx.beginPath();

    for(let i = 0; i < trail.length; i++){
        const p = trail[i];

        const px = cX + p.x * scale;
        const py = cY - p.y * scale;

        if(i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }

    ctx.stroke();

    /* current */
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(cX + x * scale, cY - y * scale, 3, 0, Math.PI * 2);
    ctx.fill();
}

loop();