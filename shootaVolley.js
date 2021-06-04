const cvs = document.getElementById("canvas");
const ctx = cvs.getContext("2d");

const pitch = new Image();
const footballerLeft = new Image();
const footballerRight = new Image();
const ballSprite = new Image();
const goalkeeperImg = new Image();
const UIImg = new Image();

pitch.src = "images/pitch640.png";
footballerLeft.src = "images/footballerLeft64.png";
footballerRight.src = "images/footballerRight64.png";
ballSprite.src = "images/footballBallSprite.png";
goalkeeperImg.src = "images/goalkeeper48.png";
UIImg.src = "images/UI.png";

const hitSound = new Audio();
const goalSound = new Audio();
const crowdSound = new Audio();
const missedSound = new Audio();

hitSound.src = "audios/hit.mp3";
goalSound.src = "audios/goal.mp3";
crowdSound.src = "audios/crowd.mp3";
missedSound.src = "audios/missed.mp3";

var frames = 0;
var collision = false;
var shootTrig = false;
var isLeft = false;
var isRight = true;
var leftPostX = 224;
var rightPostX = 418; 
var goalLineY = 80;

const state = {
    current : 0,
    start : 0,
    game : 1
}

const UI = {
    width : 300,
    height : 240,
    x : cvs.width/2,
    y : cvs.height/2,

    draw: function(){
        if(state.current == state.start){
            ctx.drawImage(UIImg, this.x - this.width/2, this.y - this.height/2);
        }
    }
}

const footballer = {
    footballerFrame : [footballerRight, footballerLeft],
    speed : 8,
    x : cvs.width/2,
    y : cvs.height/1.75,
    width : 50,
    frame : 0,

    draw : function(){
        var footballer = this.footballerFrame[this.frame]
        ctx.drawImage(footballer, this.x, this.y);
    },

    moveRight : function(){
        if(state.current == state.game)
        {
            this.x += this.speed;
            this.frame = 0;
            isLeft = false;
            isRight = true;
        }
    },

    moveLeft : function(){
        if(state.current == state.game)
        {
            this.x -= this.speed;
            this.frame = 1;
            isLeft = true;
            isRight = false;
        }
    },

}

const goalkeeper = {
    x : cvs.width / 2 - 20,
    y : 50,
    width : 44,
    height : 46,
    speed : 2.5,
    toRight : true,
    toLeft : false,

    draw : function(){
        ctx.drawImage(goalkeeperImg, this.x, this.y);
    },
    update : function(){
        if(state.current == state.game)
        {
            if(goalkeeper.x < leftPostX){
                this.toRight = true;
                this.toLeft = false;
            }
                
            else if(goalkeeper.x + goalkeeper.width > rightPostX){
                this.toLeft = true;
                this.toRight = false;
            }
            if(this.toRight)
                goalkeeper.x += this.speed;
            else
                goalkeeper.x -= this.speed;
        }
    }
}

const ball = {

    animation : [
        {sX : 3, sY : 2},
        {sX : 23, sY : 2},
        {sX : 43, sY : 2},
        {sX : 63, sY : 2},
    ],

    loop : [],
    width : 15,
    height : 15,
    x : 640,
    y : 400,
    speed : 5,
    frame : 0,
    shootSpeed : 10,
    gravity : 0.040,

    draw : function(){
        let ballNow = this.animation[this.frame];
        for(let i = 0; i < this.loop.length; i++){
            ctx.drawImage(ballSprite, ballNow.sX, ballNow.sY, this.width, this.height, this.loop[i].x, this.loop[i].y, this.width, this.height);
        }
    },

    update : function(){
        if(state.current == state.game)
        {
            this.period = 5;
            this.frame += frames % this.period == 0 ? 1 : 0
            this.frame %= this.animation.length;
    
            for(let i = 0; i < this.loop.length; i++){
                let ballNow = this.loop[i];
                ballNow.x -= ballNow.speed;
                if(ballNow.x < -5){
                    this.loop.shift();
                    score.value = 0;
                }
            }
    
            if(frames % 250 == 0){
                shootTrig = false;
                onTheLine = false;
                this.loop.push({
                    x: this.x,
                    y: this.y,
                    speed : this.speed,
                    shootSpeed : this.shootSpeed,
                });
            }
        }
    },

    shoot : function(){
        for(let i = 0; i < this.loop.length; i++){
            
            let ballNow = this.loop[i];
            ballNow.speed = 0;
            const dif = ball.loop[i].x - footballer.x - footballer.width/2;

            if(onTheLine == false)
            {
                if(dif > 0){
                    ballNow.x += normalize(dif, 18, 0) + 0.1;
                }
                else{
                    ballNow.x += normalize(dif, 18, 0) - 0.1;
                }
            }

            ballNow.shootSpeed -= this.gravity;
            ballNow.y -= ballNow.shootSpeed;
            if((ballNow.y < -5 || ballNow.x > 645)){
                ball.loop.shift();
                score.value = 0;
                missedSound.play();
            }
        }
    }
}

const score = {
    value : 0,
    best : parseInt(localStorage.getItem("best")) || 0,

    draw : function() {
        ctx.fillStyle = "#0000FF";
        ctx.font = "24px Unispace";
        ctx.fillText("Gol: " + this.value, 14, 580);
        ctx.fillText("Rekor: " + this.best, 14, 615);
    },
}

function shoot(){
    ball.shoot();
}

function draw(){
    ctx.drawImage(pitch, 0, 0);
    goalkeeper.draw(); 
    ball.draw();
    footballer.draw();
    score.draw();
    UI.draw();
    
    for(let i = 0; i < ball.loop.length; i++){
        if(ball.loop[i].x + ball.width >= footballer.x+25 && ball.loop[i].x <= footballer.x + footballer.width){
            collision = true;
        }   
        else{
            collision = false;
        }

        let ballNow = ball.loop[i];
        if(ballNow.x > leftPostX + 2 && ballNow.x + ball.width < rightPostX - 2 && Math.round(ballNow.y) == goalLineY - 30){
            score.value++;
            score.best = Math.max(score.value, score.best);
            localStorage.setItem("best", score.best);
            goalSound.play();
        }
        
        if(ballNow.x > leftPostX + 2 && ballNow.x + ball.width < rightPostX - 2 && ballNow.y < goalLineY - 46){
            onTheLine = true;
            ballNow.shootSpeed = 0;
            ballNow.y += 0;
            if(frames % 100 == 0){
                ball.loop.shift();
            }
        }

        if(ballNow.x < goalkeeper.x + goalkeeper.width && ballNow.x + ball.width > goalkeeper.x && Math.round(ballNow.y) == goalkeeper.y + (goalkeeper.height/2) + 2){
            onTheLine = true;
            ballNow.shootSpeed = 0;
            ballNow.y += 0;
            missedSound.play();
            if(frames % 25 == 0){
                ball.loop.shift();
                score.value = 0;
            }
        }
    }
}

function update(){
    ball.update();
    goalkeeper.update();
}

document.addEventListener('keydown', function(event) {

    if(event.defaultPrevented){
        return;
    }

    switch(event.key){
        case "ArrowLeft":
            footballer.moveLeft();
            break;
        case "ArrowRight":
            footballer.moveRight();
            break;
        case " ":
            state.current = state.game;
        case "ArrowUp":
            if(collision == true)
            {
                shootTrig = true;
                hitSound.play();

            }
            break;
    }
}, true);

function normalize(val, max, min) { 
    return (val - min) / (max - min); 
}

let fps = 60;
  
function loop(){
    setTimeout(function() {
        
        requestAnimationFrame(loop);
        draw();
        update();
        crowdSound.play();
        if(shootTrig == true && onTheLine == false){
            requestAnimationFrame(shoot);
        }
        frames++;
    }, 1000 / fps);
    
}

loop();