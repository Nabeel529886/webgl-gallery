

uniform float uTime;
uniform float uProgress;
uniform sampler2D uTexture;
uniform vec2 uQuadSize;

uniform float uRgbShiftAmount;

varying vec2 vUv;
varying vec2 vSize;


vec2 getUV(vec2 uv, vec2 textureSize, vec2 quadSize){
    vec2 tempUV = uv - vec2(0.5);

    float quadAspect = quadSize.x/quadSize.y;
    float textureAspect = textureSize.x/textureSize.y;
    if(quadAspect<textureAspect){
        tempUV = tempUV*vec2(quadAspect/textureAspect,1.);
    } else{
        tempUV = tempUV*vec2(1.,textureAspect/quadAspect);
    }

    tempUV += vec2(0.5);
    return tempUV;
}


void main() {

    vec2 uv_correct = getUV(vUv, uQuadSize, vSize);

    vec2 newUv = uv_correct;
    newUv.x = 0.04 * sin(length(uv_correct - vec2(0.5)) * 20. + uTime) + uv_correct.x;
    newUv.y = 0.02 * cos(length(uv_correct - vec2(0.5)) * 20. + uTime) + uv_correct.y;

    // newUv =  0.01 * sin(length(uv_correct - vec2(0.5)) * 40. + uTime * 4.) + uv_correct;
    vec2 offset = uRgbShiftAmount * vec2(cos(uProgress), sin(uProgress));

    vec2 finalOffset = mix(vec2(0.), offset, uProgress);

    vec2 finalUv = mix(uv_correct, newUv, uProgress);


    vec4 cr = texture2D(uTexture, finalUv + finalOffset);
    vec4 cga = texture2D(uTexture, finalUv);
    vec4 cb = texture2D(uTexture, finalUv - finalOffset);

    vec4 myimage = texture2D(uTexture, finalUv);

    gl_FragColor = vec4(1., 0, 0., 1.);
    gl_FragColor = myimage;
    gl_FragColor = vec4(cr.r, cga.g, cb.b, cga.a);
}