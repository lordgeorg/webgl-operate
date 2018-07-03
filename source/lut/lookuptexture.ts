
import { assert } from '../auxiliaries';
import { Color } from '../color';
import { Context } from '../context';
import { Texture2 } from '../texture2';


export type ColorMappingFunction = (color: Color) => Color;

// maybe rename it to 'discreteColorMappingFunction" or stuff
export class LookUpTexture {

    protected _size: GLubyte;

    protected _colorBytes: Uint8Array;

    constructor(size: GLubyte, func: ColorMappingFunction = (a) => a) {
        assert(size > 1, 'A somewhat meaningful look-up color texture needs at lease a size of 2');
        this._size = size;

        this.createColorArray(func);
    }

    protected colorAt(r: GLbyte, g: GLbyte, b: GLbyte): Color {
        const index = 3 * ((g * this.size + b) * this.size + r);
        return new Color().fromUI8(this._colorBytes[index], this._colorBytes[index + 1],
            this._colorBytes[index + 2]);

    }

    protected findNearest(colorIn: Color, cubeColors: Array<Color>, cubePosition: Array<GLfloat>): void {
        cubeColors = new Array<Color>(8);
        cubePosition = new Array<GLfloat>(3);

        const stride = 1. / (this._size - 1);
        const r = colorIn.r / stride;
        const g = colorIn.r / stride;
        const b = colorIn.r / stride;
    }

    protected createColorArray(func: ColorMappingFunction) {
        this._colorBytes = new Uint8Array(3 * this.size * this.size * this.size);

        const stride = 1 / (this.size - 1);
        let current = -1;

        for (let c1 = 0; c1 < this.size; ++c1) {
            const green = c1 * stride;
            for (let c2 = 0; c2 < this.size; ++c2) {
                const blue = c2 * stride;
                for (let c3 = 0; c3 < this.size; ++c3) {
                    const color0 = new Color().fromRGB(c3 * stride, green, blue);
                    const colorBytes = func(color0).rgbUI8;
                    this._colorBytes[++current] = colorBytes[0];
                    this._colorBytes[++current] = colorBytes[1];
                    this._colorBytes[++current] = colorBytes[2];
                }
            }
        }
    }

    get size(): GLubyte {
        return this._size;
    }

    copy(): LookUpTexture {
        const ret = new LookUpTexture(this.size, undefined);
        ret._colorBytes = this._colorBytes.slice(0);
        return ret;
    }

    createTexture(context: Context): Texture2 {
        const gl = context.gl;

        const ret = new Texture2(context, 'LUT 2D');
        ret.initialize(1, 1, gl.RGB8, gl.RGB, gl.UNSIGNED_BYTE);
        ret.bind();
        ret.filter(gl.NEAREST, gl.NEAREST, false, false);
        ret.wrap(gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE, false, false);
        ret.resize(this._size * this._size, this._size, false, false);
        if (this._colorBytes === undefined) {
            console.log('warning: creating texture from default look-up texture');
            this.createColorArray((a) => a);
        }
        ret.data(this._colorBytes, false, false);
        ret.unbind();

        return ret;
    }

    map(color: Color): Color {

        return color;
    }
}
