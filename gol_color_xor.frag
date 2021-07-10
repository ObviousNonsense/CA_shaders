precision mediump float;
precision mediump int;

#define brushSize 20.0

#define T(i, j) texture2D(u_pastFrame, (position + vec2(i, j) * vec2(1.0 / u_resolution)))
#define N(i, j, k) float(1.0 - T(i, j)[k] > 0.0)
#define fXOR(a, b) float((a > 0.0) || (b > 0.0))


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

    vec3 currentPixel = vec3(N(0, 0, 0), N(0, 0, 1), N(0, 0, 2));
    // float currentPixel = texture2D(u_pastFrame, position).r;

    vec3 nextPixel = vec3(0.0);

    if (u_frame > 5) {
        if (distance(u_mouse, gl_FragCoord.xy) < brushSize && u_mousePressed) {
            // currentPixel = snoise(vTexCoord) > 0.8 ? 1.0 : 0.0;
            for (int i = 0; i < 3; i++) {
                nextPixel[i] = (snoise(vec2((1.0 + (1.0 - float(i))*0.05))*vTexCoord)) > 0.8 ? 1.0 : 0.0;
            }
        }
        else {
            for (int i = 0; i < 3; i++) {
                float numNeighbours = N(-1, -1, i) + N(+0, -1, i) + N(+1, -1, i) + N(-1, 0, i) + N(+1, 0, i)
                    + N(-1, 1, i) + N(0, 1, i) + N(1, 1, i);

                // currentPixel += (1.0 - float(currentPixel > 0.0)) * float(numNeighbours == 3.0);

                // currentPixel *= float(numNeighbours == 2.0) + float(numNeighbours == 3.0);

                if (currentPixel[i] > 0.0) {
                    if (numNeighbours < 2.0 || numNeighbours > 3.0) {
                        currentPixel[i] = 0.0;
                    }
                }
                else if (numNeighbours > 2.5 && numNeighbours < 3.5) {
                    currentPixel[i] = 1.0;
                }
            }
            nextPixel = vec3(abs(currentPixel.r - currentPixel.g) * (1.0 - currentPixel.g),
                abs(currentPixel.g - currentPixel.b) * (1.0 - currentPixel.b),
                abs(currentPixel.b - currentPixel.r) * (1.0 - currentPixel.r));
        }
    }
    else {
        for (int i = 0; i < 3; i++) {
            nextPixel[i] = (snoise(vec2((1.0 + (1.0 - float(i))*0.05))*vTexCoord)) > 0.8 ? 1.0 : 0.0;
        }
    }

    float alpha = 1.0;
    if (nextPixel.r + nextPixel.g + nextPixel.b == 0.0) {
        alpha = 0.2;
    }
    gl_FragColor = vec4(vec3(1.0) - nextPixel, alpha);

}