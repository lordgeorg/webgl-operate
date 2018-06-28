
precision lowp float;

@import ./facade.frag;


#if __VERSION__ == 100
    #define fragColor gl_FragColor
#else
    layout(location = 0) out vec4 fragColor;
#endif

varying vec2 v_uv;

uniform float u_size;


void main(void)
{
    /* The v_uv [0..1]^2 represents the quad of the viewport. This results in the border pixel having an offset of u_res[0]/2
     * from 0 or 1. But information about the corners of the color space are required, therefore, this offset needs to be
     * compensated. */
    vec3 rgb;
    rgb.g = u_size / (u_size - 1.) * v_uv.y - .5 / (u_size - 1.);
    rgb.b = v_uv.x * u_size;
    rgb.r = mod(rgb.b, 1.);
    rgb.r = u_size / (u_size - 1.) * rgb.r - .5 / (u_size - 1.);
    rgb.b = floor(rgb.b) / (u_size - 1.);
    fragColor = vec4(rgb, 1);
}
