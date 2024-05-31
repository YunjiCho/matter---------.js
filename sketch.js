let mic;
let fft;

var Engine = Matter.Engine,
  Render = Matter.Render,
  World = Matter.World,
  Runner = Matter.Runner,
  Bodies = Matter.Bodies,
  Composite = Matter.Composite;

var engine;
var runner;
var world;
var ground;
var circles = [];

let soundThreshold = 10;
let silenceDuration = 2000; // 2초
let lastSoundTime = 0;
let sessionActive = true;
let dataPoints = [];
let posterGenerated = 0;

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent("canvasContainer");

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

  // Ground
  ground = Bodies.rectangle(width / 2, height, width, 100, options);
  World.add(world, ground);

  // Left wall
  let leftWall = Bodies.rectangle(0, height / 2, 50, height, options);
  World.add(world, leftWall);

  // Right wall
  let rightWall = Bodies.rectangle(width, height / 2, 50, height, options);
  World.add(world, rightWall);

  colorMode(HSB, 360, 100, 100, 100);
}

function draw() {
  if (posterGenerated == 0) {
    userStartAudio();
    background(255);

    let currentTime = millis();
    let spectrum = fft.analyze();
    let sum = spectrum.reduce((a, b) => a + b, 0);
    let avg = sum / spectrum.length;

    if (avg > soundThreshold) {
      lastSoundTime = currentTime; // 마지막 소리가 들린 시간을 갱신
      if (frameCount % 4 == 0) {
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
        let colorHue = map(fundamentalFreq, lowFreq, highFreq, 0, 360);
        let circleColor = color(colorHue, 50, 100, 100);

        let circleX =
          fundamentalFreq < 165
            ? random(0, width / 2)
            : random(width / 2, width);
        let circleY = random(height / 2);
        let circleSize = map(avg, 12, 80, 20, 100);

        circles.push(
          new Circle(circleX, circleY, circleSize, circleColor, fundamentalFreq)
        );
        dataPoints.push({
          freq: fundamentalFreq,
          amp: avg,
          size: circleSize,
          color: circleColor.levels,
          colorHue: colorHue,
        });
      }
    }

    for (let i = 0; i < circles.length; i++) {
      circles[i].show();
    }
  } else if (posterGenerated == 1) {
    background(255);

    let sizes = [];
    let sizenumbers = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (let dpp of dataPoints) {
      sizes.push(dpp.size);
      if (dpp.size < 90) {
        sizenumbers[Math.floor(dpp.size / 10)]++;
      } else {
        sizenumbers[9]++;
      }
    }
    // 구슬 크기에 따른 중심 배치 계산
    let centerX = width / 2;
    let centerY = height / 2;
    // 구슬을 중심으로 배치
    let posX;
    let posY;
    let sizenumber;
    let sizenumbers2 = [...sizenumbers];
    for (let dp of dataPoints) {
      fill(color(dp.colorHue, 50, 100, 100));
      push();
      if (dp.size < 90) {
        sizenumber = Math.floor(dp.size / 10);
      } else {
        sizenumber = 9;
      }
      posX =
        centerX +
        (sizenumber + 1) * 15 * (sizenumbers[sizenumber] - 1) -
        ((sizenumbers2[sizenumber] - 1) / 2) * (sizenumber + 1) * 15;
      posY = centerY + sizenumber ** 2 * 10 - 400;
      sizenumbers[sizenumber]--;
      translate(posX, posY);
      stroke(color(dp.colorHue, 50, 100, 100));

      let numSides;
      if (dp.freq < 100) {
        numSides = 20; // 원에 가까운 다각형
      } else if (dp.freq < 140) {
        numSides = 8; // 육각형
      } else if (dp.freq < 180) {
        numSides = 5; // 오각형
      } else if (dp.freq < 220) {
        numSides = 4; // 사각형
      } else {
        numSides = 3; // 삼각형
      }

      if (numSides > 2) {
        beginShape();
        for (let i = 0; i < numSides; i++) {
          let angle = map(i, 0, numSides, 0, TWO_PI);
          let x = cos(angle) * dp.size;
          let y = sin(angle) * dp.size;
          vertex(x, y);
        }
        endShape(CLOSE);
      } else {
        line(-dp.size, 0, dp.size, 0);
      }

      pop();
    }
  } else if (posterGenerated == 2) {
    background(255);

    let sizes = [];
    let sizenumbers = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (let dpp of dataPoints) {
      sizes.push(dpp.size);
      if (dpp.size < 90) {
        sizenumbers[Math.floor(dpp.size / 10)]++;
      } else {
        sizenumbers[9]++;
      }
    }

    let maxsizenumber = 0;
    for (i = 0; i < 9; i++) {
      if (
        (maxsizenumber + 1) * sizenumbers[maxsizenumber] <=
        (i + 1) * sizenumbers[i]
      ) {
        maxsizenumber = i;
      }
    }

    let maxwidth = sizenumbers[maxsizenumber] * (maxsizenumber + 1) * 15;

    // 구슬 크기에 따른 중심 배치 계산
    let leftX = width / 2 - maxwidth / 2;
    let rightX = width / 2 + maxwidth / 2;
    let centerY = height / 2;
    // 구슬을 중심으로 배치
    let posX;
    let posY;
    let sizenumber;
    let sizenumbers2 = [...sizenumbers];
    for (let dp of dataPoints) {
      fill(color(dp.colorHue, 50, 100, 100));
      push();
      if (dp.size < 90) {
        sizenumber = Math.floor(dp.size / 10);
      } else {
        sizenumber = 9;
      }
      if (sizenumbers[sizenumber] > sizenumbers2[sizenumber] / 2) {
        posX =
          rightX -
          (sizenumber + 1) * 10 -
          (sizenumber + 1) *
            15 *
            (sizenumbers2[sizenumber] - sizenumbers[sizenumber]);
      } else {
        posX =
          leftX +
          (sizenumber + 1) * 10 +
          (sizenumber + 1) * 15 * (sizenumbers[sizenumber] - 1);
      }

      posY = centerY + sizenumber ** 2 * 10 - 400;
      sizenumbers[sizenumber]--;
      translate(posX, posY);
      stroke(color(dp.colorHue, 50, 100, 100));

      let numSides;
      if (dp.freq < 100) {
        numSides = 20; // 원에 가까운 다각형
      } else if (dp.freq < 140) {
        numSides = 8; // 육각형
      } else if (dp.freq < 180) {
        numSides = 5; // 오각형
      } else if (dp.freq < 220) {
        numSides = 4; // 사각형
      } else {
        numSides = 3; // 삼각형
      }

      if (numSides > 2) {
        beginShape();
        for (let i = 0; i < numSides; i++) {
          let angle = map(i, 0, numSides, 0, TWO_PI);
          let x = cos(angle) * dp.size;
          let y = sin(angle) * dp.size;
          vertex(x, y);
        }
        endShape(CLOSE);
      } else {
        line(-dp.size, 0, dp.size, 0);
      }

      pop();
    }
  } else if (posterGenerated == 3) {
    background(255);

    let sizes = [];
    let sizenumbers = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (let dpp of dataPoints) {
      sizes.push(dpp.size);
      if (dpp.size < 90) {
        sizenumbers[Math.floor(dpp.size / 10)]++;
      } else {
        sizenumbers[9]++;
      }
    }

    // 구슬 크기에 따른 중심 배치 계산
    let centerY = height / 2;
    // 구슬을 중심으로 배치
    let posX;
    let posY;
    let sizenumber;
    let sizenumbers2 = [...sizenumbers];
    for (let dp of dataPoints) {
      fill(color(dp.colorHue, 50, 100, 100));
      push();
      if (dp.size < 90) {
        sizenumber = Math.floor(dp.size / 10);
      } else {
        sizenumber = 9;
      }
      if (sizenumbers[sizenumber] > sizenumbers2[sizenumber] / 2) {
        posX =
          width -
          (sizenumber + 1) * 10 -
          (sizenumber + 1) *
            15 *
            (sizenumbers2[sizenumber] - sizenumbers[sizenumber]);
      } else {
        posX =
          (sizenumber + 1) * 10 +
          (sizenumber + 1) * 15 * (sizenumbers[sizenumber] - 1);
      }

      posY = centerY + sizenumber ** 2 * 10 - 400;
      sizenumbers[sizenumber]--;
      translate(posX, posY);
      stroke(color(dp.colorHue, 50, 100, 100));

      let numSides;
      if (dp.freq < 100) {
        numSides = 20; // 원에 가까운 다각형
      } else if (dp.freq < 140) {
        numSides = 8; // 육각형
      } else if (dp.freq < 180) {
        numSides = 5; // 오각형
      } else if (dp.freq < 220) {
        numSides = 4; // 사각형
      } else {
        numSides = 3; // 삼각형
      }

      if (numSides > 2) {
        beginShape();
        for (let i = 0; i < numSides; i++) {
          let angle = map(i, 0, numSides, 0, TWO_PI);
          let x = cos(angle) * dp.size;
          let y = sin(angle) * dp.size;
          vertex(x, y);
        }
        endShape(CLOSE);
      } else {
        line(-dp.size, 0, dp.size, 0);
      }

      pop();
    }
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

function generatePoster() {
  posterGenerated = Math.floor(random(1, 3.99));
  updateClearButtonVisibility();

  for (let circle of circles) {
    World.remove(world, circle.body);
  }
  //background(255);

  //   sizes = sizes.sort((a, b) => a - b);
  //   print(sizes);
  //let dpindex = dataPoints.freq.sort();
  //dataPoints = dataPoints[[1, 2, 3]];
}

// 모든 구슬과 데이터를 초기화하는 함수
function clearCircles() {
  // 모든 구슬을 물리 엔진에서 제거
  for (let circle of circles) {
    World.remove(world, circle.body);
  }
  // 배열 초기화
  circles = [];
  dataPoints = [];

  // 배경 초기화
  background(255);
  sessionActive = true;
  posterGenerated = 0;
  updateClearButtonVisibility();
  loop();
}

// clearButton의 표시 상태를 업데이트하는 함수
function updateClearButtonVisibility() {
  const clearButton = document.getElementById("clearButton");
  if (posterGenerated > 0) {
    clearButton.style.display = "inline-block";
  } else {
    clearButton.style.display = "none";
  }
}
