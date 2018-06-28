
precision lowp float;

@import ./facade.frag;


#if __VERSION__ == 100
    #define fragColor gl_FragColor
#else
    layout(location = 0) out vec4 fragColor;
#endif

varying vec2 v_uv;


void main(void)
{
    fragColor = vec4(v_uv, 0, 1);
}
