let mic, fft, engine, runner, world, ground;
let circles = [];
let dataPoints = [];
let isPosterVisible = false;

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent('canvasContainer');

  mic = new p5.AudioIn();
  mic.start();
  fft = new p5.FFT();
  fft.setInput(mic);

  engine = Matter.Engine.create();
  world = engine.world;
  runner = Matter.Runner.create();
  Matter.Runner.run(runner, engine);

  ground = Matter.Bodies.rectangle(width / 2, height, width, 100, { isStatic: true });
  Matter.World.add(world, ground);

  colorMode(HSB, 360, 100, 100, 100);
}

function draw() {
  if (!isPosterVisible) {
    userStartAudio();
    background(255);
    let spectrum = fft.analyze();
    let sum = spectrum.reduce((a, b) => a + b, 0);
    let avg = sum / spectrum.length;

    if (avg > 20 && frameCount % 2 == 0) {
      createCircle(spectrum);
    }
    updateCircles();
  }
}

function createCircle(spectrum) {
  let nyquist = 22050;
  let binWidth = nyquist / spectrum.length;
  let lowFreq = 85;
  let highFreq = 255;
  let lowIndex = Math.floor(lowFreq / binWidth);
  let highIndex = Math.floor(highFreq / binWidth);
  let maxAmplitude = 0;
  let fundamentalIndex = 0;

  for (let i = lowIndex; i <= highIndex; i++) {
    if (spectrum[i] > maxAmplitude) {
      maxAmplitude = spectrum[i];
      fundamentalIndex = i;
    }
  }

  let fundamentalFreq = fundamentalIndex * binWidth;
  let colorHue = map(fundamentalFreq, lowFreq, highFreq, 0, 360);
  let circleColor = color(colorHue, 50, 100, 100);
  let circleX = fundamentalFreq < 165 ? random(0, width / 2) : random(width / 2, width);
  let circleY = random(height / 2);
  let circleSize = map(maxAmplitude, 0, 255, 10, 60);

  let newCircle = new Circle(circleX, circleY, circleSize, circleColor, fundamentalFreq);
  circles.push(newCircle);
  dataPoints.push({ freq: fundamentalFreq, amp: maxAmplitude, size: circleSize, color: circleColor.levels });
}

function updateCircles() {
  circles.forEach(circle => circle.show());
  while (circles.length > 140) {
    let removed = circles.shift();
    Matter.World.remove(world, removed.body);
  }
}

function generatePoster() {
  isPosterVisible = true;
  let posterContainer = document.getElementById('posterContainer');
  let canvasContainer = document.getElementById('canvasContainer');
  canvasContainer.style.display = 'none';
  posterContainer.style.display = 'block';

  let posterCanvas = createCanvas(windowWidth, windowHeight);
  posterCanvas.parent(posterContainer);
  background(255);

  dataPoints.forEach(dp => {
    fill(color(dp.color));
    let posX = dp.freq < 165 ? random(0, width / 2) : random(width / 2, width);
    let posY = map(dp.freq, 50, 300, height, 0);
    ellipse(posX, posY, dp.size, dp.size);
  });
}

function Circle(x, y, size, col, freq) {
    let options = {
      friction: 0.5,
      restitution: 1,
    };
    this.body = Bodies.circle(x, y, size, options);
    this.size = size;
    this.col = col;
    this.freq = freq;
    World.add(world, this.body);
  
    this.show = function () {
      let pos = this.body.position;
      let angle = this.body.angle;
  
      push();
      translate(pos.x, pos.y);
      rotate(angle);
      fill(this.col);
      stroke(this.col);
  
      let numSides;
      if (this.freq < 100) {
        numSides = 20; // 원에 가까운 다각형
      } else if (this.freq < 140) {
        numSides = 8; // 육각형
      } else if (this.freq < 180) {
        numSides = 5; // 오각형
      } else if (this.freq < 220) {
        numSides = 4; // 사각형
      } else {
        numSides = 3; // 삼각형
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
