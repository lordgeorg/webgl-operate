
import { assert } from '../auxiliaries';

export class LookUpTexture {

    protected _size: GLubyte;

    static load(): LookUpTexture {
        throw Error('TODO implement me');
    }

    static create(size: GLubyte | 16): LookUpTexture {
        return new LookUpTexture(size);
    }

    constructor(size: GLubyte) {
        assert(size > 1, 'A somewhat meaningful look-up color texture needs at lease a size of 2');
        this._size = size;
    }

    get size(): GLubyte {
        return this._size;
    }
}
