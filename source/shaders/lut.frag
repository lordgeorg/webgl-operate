
precision lowp float;

@import ./facade.frag;


#if __VERSION__ == 100
    #define fragColor gl_FragColor
#else
    layout(location = 0) out vec4 fragColor;
#endif

varying vec2 v_uv;

uniform vec4 u_param; // [a, b, size, stride]; a and b for linear equation [x',y'] = a * [x,y] + b


void main(void)
{
    /* The v_uv [0..1]^2 represents the quad of the viewport. This results in the border pixel having an offset of stride / 2
     * from 0 or 1. But information about the corners of the color space are required, therefore, this offset needs to be
     * compensated. */

    vec2 xy = v_uv * vec2(u_param.z, 1.);
    // this would be great with modf() ...
    float bLayer = floor(xy.x);
    xy.x = mod(xy.x, 1.);
    xy = u_param.x * xy + u_param.y;
    fragColor = vec4(xy, bLayer * u_param.w, 1);
}
