let mic;
let fft;
let numBins = 20;

var Engine = Matter.Engine,
  Render = Matter.Render,
  World = Matter.World,
  Runner = Matter.Runner,
  Bodies = Matter.Bodies,
  Composite = Matter.Composite;

var engine;
var runner;
var world;
var boxes = [];
var ground;
var circles = []; // circles 배열을 정의합니다.

// 말소리 임계값 설정
let soundThreshold = 12; // 값을 낮춰서 공이 생성될 수 있게 함

function setup() {
  createCanvas(windowWidth, windowHeight);

  mic = new p5.AudioIn();
  mic.start();
  fft = new p5.FFT();
  fft.setInput(mic);

  engine = Matter.Engine.create();
  runner = Matter.Runner.create();
  world = engine.world;
  Matter.Runner.run(runner, engine);

  var options = {
    isStatic: true,
  };
  ground = Bodies.rectangle(width / 2, height, width, 100, options);
  World.add(world, ground);

  colorMode(HSB, 360, 100, 100, 100); // HSB 모드로 색상 설정
}

function draw() {
  userStartAudio();
  // Background
  background(255);

  // Update FFT analysis
  let spectrum = fft.analyze();
  let sum = spectrum.reduce((a, b) => a + b, 0);
  let avg = sum / spectrum.length;

  // 소리 크기가 임계값보다 큰 경우에만 구슬 생성
  if (avg > soundThreshold && frameCount % 2 == 0) {
    // 10프레임마다 구슬 생성
    let circleSize = map(avg, 12, 80, 5, 100);
    let circleX = map(avg, 12, 100, 0, width); // 소리 크기에 따라 x 위치 설정
    let circleY = random(height / 2); // Adjust Y position to center

    // 색상 설정: 초록색(120)에서 핑크색(330)으로 변환
    let colorHue = map(avg, 10, 50, 120, 330);
    let circleColor = color(colorHue, 100, 100, 50);

    circles.push(new Circle(circleX, circleY, circleSize, circleColor));
  }

  // Draw circles
  for (let i = 0; i < circles.length; i++) {
    circles[i].show();
    print(avg);
  }

  // 오래된 구슬 제거
  while (circles.length > 140) {
    // 예: 50개 이상의 구슬이 생기지 않도록
    let c = circles.shift();
    World.remove(world, c.body);
  }
}

function Circle(x, y, size, col) {
  let options = {
    friction: 0.5,
    restitution: 1,
  };
  this.body = Bodies.circle(x, y, size, options);
  this.size = size;
  this.col = col;
  World.add(world, this.body);

  this.show = function () {
    let pos = this.body.position;
    let angle = this.body.angle;

    push();
    translate(pos.x, pos.y);
    rotate(angle);
    fill(this.col); // 색상을 적용
    ellipseMode(CENTER);
    noStroke();
    ellipse(0, 0, this.size * 2);
    pop();
  };
}
