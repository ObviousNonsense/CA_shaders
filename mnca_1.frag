#define brushSize 50.0

#define T(i, j) texture2D(u_pastFrame, (position + vec2(i, j) * vec2(1.0 / u_resolution)))[3]
#define N(i, j) float(T(i, j) > 0.0)
#define MAX_DIAMETER 50

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

float snoise(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453 * u_randomSeed);
}


float checkCell(int i, int j, vec2 position) {
    return float(texture2D(u_pastFrame, (position + vec2(i, j) * vec2(1.0 / u_resolution)))[3] > 0.0);
}

vec2 checkRing(ivec2 radius, vec2 center) {
    float dist = 0.0;
    float sum = 0.0;
    int count = 0;

    for (int i = 0; i <= MAX_DIAMETER; i++) {
        int x = i - radius[1];
        if (x > radius[1]) {
            break;
        }
        for (int j = 0; j <= MAX_DIAMETER; j++) {
            int y = j - radius[1];
            if (y > radius[1]) {
                break;
            }
            dist = floor(sqrt(float(x*x + y*y)) + 0.5);
            if (dist <= float(radius[1]) && dist >= float(radius[0])) {
                count++;
                sum += checkCell(x, y, center);
            }
        }
    }

    return vec2(sum, count);
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
            const ivec2 radius1 = ivec2(0, 7);
            float numNeighbours = checkRing(radius1, position).x;

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

    gl_FragColor = vec4(currentPixel);
    // gl_FragColor = vec4(vec3(currentPixel), 1.0);

}