// https://slackermanz.com/understanding-multiple-neighborhood-cellular-automata/#Implementing

#define brushSize 50.0

#define T(i, j)texture2D(u_pastFrame, (position + vec2(i, j) * vec2(1.0 / u_resolution)))[3]
#define N(i, j)float(T(i, j) > 0.0)
#define MAX_DIAMETER 15 // MUST BE AN ODD NUMBER
#define MAX_RULES 10
#define MAX_REGIONS 2

precision highp float;
precision highp int;

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
uniform float u_brushSize;
uniform vec4 u_rulesArray[MAX_RULES];
// uniform ivec2 u_radiusArray[MAX_REGIONS];
uniform float u_regionsArray[MAX_DIAMETER * MAX_DIAMETER];
uniform int u_numRegions;

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

    for(int i = 0; i <= MAX_DIAMETER; i++ ) {
        int x = i - radius[1];
        if (x > radius[1]) {
            break;
        }
        for(int j = 0; j <= MAX_DIAMETER; j++ ) {
            int y = j - radius[1];
            if (y > radius[1]) {
                break;
            }
            dist = floor(sqrt(float(x * x + y * y)) + 0.5);
            if (dist <= float(radius[1])&& dist >= float(radius[0])) {
                count ++ ;
                sum += checkCell(x, y, center);
            }
        }
    }

    return vec2(sum, count);
}

// vec2 checkRegion(int region, vec2 center) {
//     float sum = 0.0;
//     int count = 0;

//     int radius = (MAX_DIAMETER - 1) / 2;

//     for (int n = 0; n < MAX_REGIONS * MAX_DIAMETER * MAX_DIAMETER; n++) {
//         int reg = int(floor(float(n) / float(MAX_DIAMETER * MAX_DIAMETER)));
//         if (reg == region && u_regionsArray[n]) {
//             int ind = n - reg * MAX_DIAMETER * MAX_DIAMETER;

//             int j = int(mod(float(n), float(MAX_DIAMETER)));
//             int y = j - radius;

//             int i = (ind - j) / MAX_DIAMETER;
//             int x = i - radius;

//             count++;
//             sum += checkCell(x, y, center);
//         }
//         else if (reg >= u_numRegions) {
//             break;
//         }
//     }

//     return vec2(sum, count);

//     // for (int reg = 0; reg < MAX_REGIONS; reg++){
//     //     if (reg == region) {
//     //         // int region_index = reg * MAX_DIAMETER * MAX_DIAMETER;
//     //         for (int i = 0; i <= MAX_DIAMETER; i++) {
//     //             int i_index = i * MAX_DIAMETER;
//     //             int x = i - radius;
//     //             for (int j = 0; j <= MAX_DIAMETER; j++) {
//     //                 if (u_regionsArray[reg * MAX_DIAMETER * MAX_DIAMETER + i_index + j]) {
//     //                     count++;
//     //                     int y = j - radius;
//     //                     sum += checkCell(x, y, center);
//     //                 }
//     //             }
//     //         }
//     //     }
//     // }

// }

void checkAllRegions(inout float neighborhood_avg[MAX_REGIONS], vec2 center) {
    float sum[MAX_REGIONS];
    int count[MAX_REGIONS];

    // Initialize sum and count to 0
    for (int i = 0; i < MAX_REGIONS; i++) {
        sum[i] = 0.0;
        count[i] = 0;
    }

    // MAX_DIAMETER has to be odd for this to work
    int radius = (MAX_DIAMETER - 1) / 2;

    // Sweep through the regions array
    for (int i = 0; i <= MAX_DIAMETER; i++) {
        int x = i - radius;
        for (int j = 0; j <= MAX_DIAMETER; j++) {
            int y = j - radius;

            // Region definitions are binary-encoded. Region 0 is in place 0, etc
            // Start with the current number in the array
            float remainder = u_regionsArray[i * MAX_DIAMETER + j];
            for (int reg = 0; reg < MAX_REGIONS; reg++) {
                // If the number is odd, it's in the region
                if (mod(remainder, 2.0) != 0.0) {
                    // So increment the count and check that cell
                    count[reg]++;
                    sum[reg] += checkCell(x, y, center);
                    // Remove the odd part of the number, then divide by 2 so we can check the next
                    remainder -= 1.0;
                }
                remainder /= 2.0;

                // Probably not necessary, but just in case
                if (remainder <= 0.0) {
                    break;
                }
            }
        }
    }

    // Return the average number of alive cells in the region
    for (int i = 0; i < MAX_REGIONS; i++) {
        neighborhood_avg[i] = sum[i] / float(count[i]);
    }
}

float applyRules(float currentPixel, float neighborhood_avg[MAX_REGIONS]) {
    float alive = currentPixel;

    for(int i = 0; i < MAX_RULES; i ++ ) {
        vec3 rule = u_rulesArray[i].yzw;
        if (rule.x == 0.0 && rule.y == 0.0) {
            break;
        }
        int region = int(u_rulesArray[i].x);
        for (int n = 0; n < MAX_REGIONS; n++) {
            if (n == region) {
                if (neighborhood_avg[n] >= rule.x && neighborhood_avg[n] <= rule.y) {
                    alive = rule.z;
                }
            }
        }
    }

    return alive;
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

            float neighborhood_avg[MAX_REGIONS];

            checkAllRegions(neighborhood_avg, position);

            // for(int i = 0; i < MAX_REGIONS; i ++ ) {
            //     if (u_radiusArray[i].x == u_radiusArray[i].y) {
            //         break;
            //     }
            //     vec2 ringValues = checkRing(u_radiusArray[i], position);
            //     neighborhood_avg[i] = ringValues.x / ringValues.y;
            // }

            // for(int i = 0; i < MAX_REGIONS; i ++ ) {
            //     if (i >= u_numRegions) {
            //         break;
            //     }
            //     vec2 regionValues = checkRegion(i, position);
            //     neighborhood_avg[i] = regionValues.x / regionValues.y;
            // }

            float alive = applyRules(currentPixel, neighborhood_avg);

            nextPixel = vec4(1.0 - neighborhood_avg[0], 0.7, 1.0 - neighborhood_avg[1], alive);
            // nextPixel = vec4(vec2(1.0), neighborhood_avg[1], alive);
        }
    }
    else {
        nextPixel = vec4(snoise(vTexCoord) > 0.6 ? 1.0 : 0.0);
    }

    gl_FragColor = nextPixel;

}