// Sources:
// https://discourse.processing.org/t/backbuffer-in-p5js/29769/6
// https://www.shadertoy.com/view/ld3Sz7
// https://github.com/aferriss/p5jsShaderExamples
// https://itp-xstory.github.io/p5js-shaders/#/./docs/examples/shadertoy

// the shader variable
let theShader;
let canvas;
let pastFrame;
// let gl;

function preload() {
    // load the shader
    theShader = loadShader('shader.vert', 'gol_color_xor.frag');
}

function setup() {
    // shaders require WEBGL mode to work
    canvas = createCanvas(windowWidth, windowHeight, WEBGL);
    noStroke();

    // the pastFrame layer doesn't need to be WEBGL
    pastFrame = createGraphics(width, height);

    // let gl = canvas.GL;
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
}

function draw() {
    // shader() sets the active shader with our shader
    shader(theShader);

    theShader.setUniform('u_pastFrame', pastFrame);
    theShader.setUniform('u_resolution', [width * pixelDensity(), height * pixelDensity()]);
    theShader.setUniform('u_frame', frameCount)
    theShader.setUniform('u_time', millis() * 1000)
    theShader.setUniform("u_mouse", [mouseX * pixelDensity(), map(mouseY * pixelDensity(), 0,
        height * pixelDensity(), height * pixelDensity(), 0)]);
    theShader.setUniform("u_mousePressed", mouseIsPressed);
    theShader.setUniform("u_randomSeed", random(0.8, 1.2));

    // rect gives us some geometry on the screen
    // scale(5)
    rect(0, 0, width, height);

    pastFrame.clear();
    pastFrame.image(canvas, 0, 0, width, height);
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    pastFrame.resizeCanvas(width, height);
    frameCount = 0;
}