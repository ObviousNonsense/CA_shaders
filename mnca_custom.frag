// https://slackermanz.com/understanding-multiple-neighborhood-cellular-automata/#Implementing

#define brushSize 50.0

#define T(i, j)texture2D(u_pastFrame, (position + vec2(i, j) * vec2(1.0 / u_resolution)))[3]
#define N(i, j)float(T(i, j) > 0.0)
#define MAX_DIAMETER 50
#define MAX_RULES 10
#define MAX_REGIONS 2

precision mediump float;
precision mediump int;

// grab texcoords from the vertex shader
varying vec2 vTexCoord;

// struct Rule {
    //     float minAvg;
    //     float maxAvg;
    //     float output;
// }

// our textures coming from p5
uniform sampler2D u_pastFrame;
uniform vec2 u_resolution;
uniform int u_frame;
uniform float u_time;
uniform vec2 u_mouse;
uniform bool u_mousePressed;
uniform float u_randomSeed;
uniform float u_brushSize;
uniform vec4 u_rulesArray[MAX_RULES];
uniform ivec2 u_radiusArray[MAX_REGIONS];

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

    for(int i = 0; i <= MAX_DIAMETER; i ++ ) {
        int x = i - radius[1];
        if (x > radius[1]) {
            break;
        }
        for(int j = 0; j <= MAX_DIAMETER; j ++ ) {
            int y = j - radius[1];
            if (y > radius[1]) {
                break;
            }
            dist = floor(sqrt(float(x * x + y*y)) + 0.5);
            if (dist <= float(radius[1])&& dist >= float(radius[0])) {
                count ++ ;
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

    vec4 nextPixel = vec4(currentPixel);

    if (u_frame > 5) {
        if (distance(u_mouse, gl_FragCoord.xy) < u_brushSize && u_mousePressed) {
            nextPixel = vec4(snoise(vTexCoord) > 0.5 ? 1.0 : 0.0);
        }
        else {

            float NEIGHBORHOOD_AVG[MAX_REGIONS];

            for(int i = 0; i < MAX_REGIONS; i ++ ) {
                if (u_radiusArray[i].x == u_radiusArray[i].y) {
                    break;
                }
                vec2 ringValues = checkRing(u_radiusArray[i], position);
                NEIGHBORHOOD_AVG[i] = ringValues.x / ringValues.y;
            }

            float alive = currentPixel;

            for(int i = 0; i < MAX_RULES; i ++ ) {
                vec3 rule = u_rulesArray[i].yzw;
                if (rule.x == 0.0 && rule.y == 0.0) {
                    break;
                }
                int region = int(u_rulesArray[i].x);
                for (int n = 0; n < MAX_REGIONS; n++) {
                    if (n == region) {
                        if (NEIGHBORHOOD_AVG[n] >= rule.x && NEIGHBORHOOD_AVG[n] <= rule.y) {
                            alive = rule.z;
                        }
                    }
                }
            }

            nextPixel = vec4(1.0 - NEIGHBORHOOD_AVG[0], 0.7, 1.0 - NEIGHBORHOOD_AVG[1], alive);
        }
    }
    else {
        nextPixel = vec4(snoise(vTexCoord) > 0.6 ? 1.0 : 0.0);
    }

    gl_FragColor = nextPixel;

}