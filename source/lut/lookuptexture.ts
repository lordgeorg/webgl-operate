
import { assert } from '../auxiliaries';
import { Color } from '../color';
import { Context } from '../context';
import { Texture2 } from '../texture2';


export type ColorMappingFunction = (color: Color) => Color;


export class LookUpTexture {

    protected _size: GLubyte;

    protected _colorBytes: Uint8Array;

    static default(size: GLubyte = 16): LookUpTexture {
        return new LookUpTexture(size, undefined);
    }

    constructor(size: GLubyte, func: ColorMappingFunction | undefined) {
        assert(size > 1, 'A somewhat meaningful look-up color texture needs at lease a size of 2');
        this._size = size;

        if (func !== undefined) {
            this.createColorArray(func);
        }
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

    get isDefault(): boolean {
        return this._colorBytes === undefined;
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
}
