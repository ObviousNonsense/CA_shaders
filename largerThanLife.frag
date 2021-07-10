#define brushSize 100.0

#define T(i, j)texture2D(u_pastFrame, (position + vec2(i, j) * vec2(1.0 / u_resolution))).r
#define N(i, j)float(T(i, j) > 0.0)

precision mediump float;
precision mediump int;

// grab texcoords from the vertex shader
varying vec2 vTexCoord;

// our textures coming from p5
uniform sampler2D u_pastFrame;
uniform vec2 u_resolution;
uniform int u_frame;
uniform float u_time;
uniform vec2 u_mouse;
uniform bool u_mousePressed;
uniform float u_randomSeed;

float snoise(in vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453 * u_randomSeed);
}

void main() {

    float positionX = (gl_FragCoord.x / u_resolution.x);
    float positionY = 1.0 - (gl_FragCoord.y / u_resolution.y);
    vec2 position = vec2(positionX, positionY);

    float currentPixel = N(0, 0);
    // float currentPixel = texture2D(u_pastFrame, position).r;

    if (u_frame > 5) {
        if (distance(u_mouse, gl_FragCoord.xy) < brushSize && u_mousePressed) {
            currentPixel = snoise(vTexCoord) > 0.8 ? 1.0 : 0.0;
        }
        else {
            float numNeighbours = 0.0;
            for(int i = -5; i <= 5; i ++ ) {
                for(int j = -5; j <= 5; j ++ ) {
                    numNeighbours += N(i, j);
                }
            }

            if (numNeighbours >= 0.0 && numNeighbours <= 33.0) {
                currentPixel = 0.0;
            } else if (numNeighbours >= 34.0 && numNeighbours <= 45.0) {
                currentPixel = 1.0;
            } else if (numNeighbours >= 58.0 && numNeighbours <= 121.0) {
                currentPixel = 0.0;
            }
        }
    }
    else {
        currentPixel = snoise(vTexCoord) > 0.8 ? 1.0 : 0.0;
    }

    gl_FragColor = vec4(vec3(currentPixel), 1.0);
    // gl_FragColor = vec4(vec3(currentPixel), 1.0);

}