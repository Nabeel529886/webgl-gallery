uniform vec4 uCorners;
uniform vec2 uResolution;
uniform vec2 uQuadSize;

varying vec2 vSize;
varying vec2 vUv;


void main() {
    float PI = 3.1415926;

    vUv = uv;

    vec4 defaultState = modelMatrix * vec4(position, 1.);

    vec4 fullScreenState = vec4(position, 1.);

    fullScreenState.x *= uResolution.x;
    fullScreenState.y *= uResolution.y;

    fullScreenState.z += uCorners.x;


    float cornerProgress = mix(
        mix(uCorners.x, uCorners.y, uv.x),
        mix(uCorners.z, uCorners.w, uv.x),
        uv.y
    );

    float sine = sin(PI * cornerProgress);

    float waves = 0.05 * sine *  cos(cornerProgress * 10.);
    //  float finalWaves = 0.2 * sine * mix(0., waves, cornerProgress);

    vec4 finalState = mix(defaultState, fullScreenState, cornerProgress + waves);


    vSize = mix(uQuadSize, uResolution, cornerProgress);

    gl_Position = projectionMatrix * viewMatrix * finalState;
}
