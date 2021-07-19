// Sources:
// https://discourse.processing.org/t/backbuffer-in-p5js/29769/6
// https://www.shadertoy.com/view/ld3Sz7
// https://github.com/aferriss/p5jsShaderExamples
// https://itp-xstory.github.io/p5js-shaders/#/./docs/examples/shadertoy
// https://slackermanz.com/understanding-multiple-neighborhood-cellular-automata/

const MAX_DIAMETER = 15; // MUST BE AN ODD NUMBER
const MAX_RULES = 10;
const MAX_REGIONS = 2;

// the shader variable
let theShader;
let canvas;
let pastFrame;
let settings;
let shaderList;
let brushSize = 50.0;
let radiuses = [
    5, 7.3,
    1, 3.2
];
let numRegions = 2;

// REGION, MIN AVG, MAX AVG, OUTPUT
let rules = [
    0.0, 0.21, 0.22, 1.0,
    0.0, 0.35, 0.5, 0.0,
    0.0, 0.75, 0.85, 0.0,
    1.0, 0.1, 0.28, 0.0,
    1.0, 0.43, 0.55, 1.0,
    0.0, 0.12, 0.15, 0.0,
]

let regions = [];
let regionsSquare = [];

function preload() {
    // load the shader
    // theShader = loadShader('shader.vert', 'gol.frag');
    shaderList = {
        'Multiple Neighbourhood CA Custom': loadShader('shader.vert', 'mnca_custom.frag'),
        'Game Of Life': loadShader('shader.vert', 'gol.frag'),
        '3-Channel Game Of Life': loadShader('shader.vert', 'gol_color_xor.frag'),
        'Larger Than Life': loadShader('shader.vert', 'largerThanLife.frag'),
        'Multiple Neighbourhood CA 1': loadShader('shader.vert', 'mnca_1.frag'),
        'Multiple Neighbourhood CA 2': loadShader('shader.vert', 'mnca_2.frag'),
    }
    setShader(Object.keys(shaderList)[0])
}

function setup() {
    // shaders require WEBGL mode to work
    canvas = createCanvas(windowWidth, windowHeight, WEBGL);
    noStroke();

    // the pastFrame layer doesn't need to be WEBGL
    pastFrame = createGraphics(width, height);

    settings = QuickSettings.create(0, 0, 'Settings')
        .addDropDown('Shader List', Object.keys(shaderList), function(s) {setShader(s.value)})
        .addButton('Random Fill', function() {frameCount = 0})
        .addRange('Brush Size', 1.0, 500.0, brushSize, 1.0, function(x) {brushSize = x})

    // Define some circular regions
    let radius = (MAX_DIAMETER-1)/2;

    for (let i = -radius; i <= radius; i++) {
        for (let j = -radius; j <= radius; j++) {
            let dist = sqrt(i*i + j*j);
            let x = 0;
            for (let reg = 0; reg < numRegions; reg++){
                if (dist >= radiuses[reg * 2] && dist <= (radiuses[reg * 2 + 1])) {
                    x += Math.pow(2, reg);
                }
            }
            regions.push(x);
        }
    }

    let regionsCopy = regions.slice();
    while(regionsCopy.length) regionsSquare.push(regionsCopy.splice(0,15));

    // for (let reg = 0; reg < numRegions; reg++){
    //     for (let i = -radius; i < radius; i++) {
    //         for (let j = -radius; j < radius; j++) {
    //             let dist = sqrt(i*i + j*j);
    //             if (dist >= radiuses[reg * 2] && dist <= (radiuses[reg * 2 + 1])) {
    //                 regions.push(true);
    //             }
    //             else {
    //                 regions.push(false);
    //             }
    //         }
    //     }
    // }

}

function setShader(newShader) {
    theShader = shaderList[newShader];
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
    theShader.setUniform("u_brushSize", brushSize);
    theShader.setUniform("u_rulesArray", rules);
    // theShader.setUniform("u_radiusArray", radiuses);
    theShader.setUniform("u_regionsArray", regions);
    theShader.setUniform("u_numRegions", numRegions);

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