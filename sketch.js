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
    // 기본 주파수를 찾기 위해 가장 강한 주파수 성분을 찾습니다.
    let nyquist = 22050;
    let binWidth = nyquist / spectrum.length;
    let lowFreq = 85;
    let highFreq = 255;
    let lowIndex = floor(lowFreq / binWidth);
    let highIndex = floor(highFreq / binWidth);

    let maxAmplitude = 0;
    let fundamentalIndex = 0;
    for (let i = lowIndex; i <= highIndex; i++) {
      if (spectrum[i] > maxAmplitude) {
        maxAmplitude = spectrum[i];
        fundamentalIndex = i;
      }
    }

    let fundamentalFreq = fundamentalIndex * binWidth;

    // 색상 설정: 주파수에 따라 색상 변경
    let colorHue = map(fundamentalFreq, lowFreq, highFreq, 0, 360);
    let circleColor = color(colorHue, 100, 100, 50);

    // 주파수에 따라 x 위치 설정
    let circleX;
    if (fundamentalFreq < 165) {
      circleX = random(0, width / 2);
    } else {
      circleX = random(width / 2, width);
    }
    let circleY = random(height / 2); // Adjust Y position to center

    let circleSize = map(avg, 12, 80, 10, 100);

    circles.push(
      new Circle(circleX, circleY, circleSize, circleColor, fundamentalFreq)
    );
  }

  // Draw circles
  for (let i = 0; i < circles.length; i++) {
    circles[i].show();
  }

  // 오래된 구슬 제거
  while (circles.length > 140) {
    // 예: 140개 이상의 구슬이 생기지 않도록
    let c = circles.shift();
    World.remove(world, c.body);
  }
}

function Circle(x, y, size, col, freq) {
  let options = {
    friction: 0.5,
    restitution: 1,
  };
  this.body = Bodies.circle(x, y, size, options);
  this.size = size;
  this.col = col;
  this.freq = freq; // 주파수 값을 저장
  World.add(world, this.body);

  this.show = function () {
    let pos = this.body.position;
    let angle = this.body.angle;

    push();
    translate(pos.x, pos.y);
    rotate(angle);
    // fill(this.col); // 색상을 적용
    ellipseMode(CENTER);
    // noStroke();
    fill(this.col);
    stroke(this.col);
    strokeWeight(this.size / 2);
    //ellipse(0, 0, this.size * 2);

    // 주파수 값에 따라 다른 도형 그리기
    let numSides;
    if (this.freq < 100) {
      numSides = 20; // 원에 가까운 다각형
    } else if (this.freq < 140) {
      numSides = 6; // 육각형
    } else if (this.freq < 180) {
      numSides = 4; // 사각형
    } else if (this.freq < 220) {
      numSides = 3; // 삼각형
    } else {
      numSides = 2; // 선형 (직선)
    }

    if (numSides > 2) {
      beginShape();
      for (let i = 0; i < numSides; i++) {
        let angle = map(i, 0, numSides, 0, TWO_PI);
        let x = cos(angle) * this.size;
        let y = sin(angle) * this.size;
        vertex(x, y);
      }
      endShape(CLOSE);
    } else {
      line(-this.size, 0, this.size, 0);
    }

    pop();
  };
}
