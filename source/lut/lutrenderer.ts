
import { assert } from '../auxiliaries';

import { Context } from '../context';
import { Framebuffer } from '../framebuffer';
import { Initializable } from '../initializable';
import { NdcFillingTriangle } from '../ndcfillingtriangle';
import { Program } from '../program';
import { Shader } from '../shader';

import { LookUpTexture } from './lookuptexture';


export class LUTRenderer extends Initializable {

    /**
     * Read-only access to the objects context, used to get context information and WebGL API access.
     */
    protected _context: Context;

    /** @see {@link target} */
    protected _target: Framebuffer;

    /**
     * Geometry used to draw on. This is not provided by default to allow for geometry sharing. If no triangle is given,
     * the ndc triangle will be created and managed internally.
     */
    protected _ndcTriangle: NdcFillingTriangle;

    /**
     * Tracks ownership of the ndc-filling triangle.
     */
    protected _ndcTriangleShared = false;

    protected _program: Program;

    protected _lut: LookUpTexture;


    constructor(context: Context) {
        super();
        this._context = context;
    }

    /*renderLUTTexture(): void {}*/

    renderLUTShader(): void {
        assert(this._ndcTriangle && this._ndcTriangle.initialized, `expected an initialized ndc triangle`);

        const gl = this._context.gl;
        if (this._target.width < this.drawWidth || this._target.height < this.drawHeight) {
            console.log('warning: look-up texture (size: ' + this._lut.size + ', px: ' + this.drawWidth + 'x' +
                this.drawHeight + ') does not fit in the target framebuffer');
        }

        // on lower right side of the screen
        gl.viewport(this._target.width - this.drawWidth, 0, this.drawWidth, this.drawHeight);

        this._program.bind();

        const target = this._context.isWebGL2 ? gl.DRAW_FRAMEBUFFER : gl.FRAMEBUFFER;
        this._target.bind(target);
        this._ndcTriangle.bind();

        this._ndcTriangle.draw();

        this._ndcTriangle.unbind();
        this._target.unbind(target);

        /* Every pass is expected to bind its own program when drawing, thus, unbinding is not necessary. */
        // this.program.unbind();
    }

    @Initializable.initialize()
    initialize(ndcTriangle?: NdcFillingTriangle): boolean {
        const gl = this._context.gl;

        /* Configure program-based blit. */

        const vert = new Shader(this._context, gl.VERTEX_SHADER, 'ndcvertices.vert (lut)');
        vert.initialize(require('../shaders/ndcvertices.vert'));
        const frag = new Shader(this._context, gl.FRAGMENT_SHADER, 'lut.frag');
        frag.initialize(require('../shaders/lut.frag'));

        this._program = new Program(this._context, 'LUTProgram');
        this._program.initialize([vert, frag]);

        if (ndcTriangle === undefined) {
            this._ndcTriangle = new NdcFillingTriangle(this._context);
        } else {
            this._ndcTriangle = ndcTriangle;
            this._ndcTriangleShared = true;
        }

        if (!this._ndcTriangle.initialized) {
            const aVertex = this._program.attribute('a_vertex', 0);
            this._ndcTriangle.initialize(aVertex);
        } else {
            this._program.attribute('a_vertex', this._ndcTriangle.aVertex);
        }

        return true;
    }

    /**
     * Specializes this pass's uninitialization. Program and geometry resources are released (if allocated). Cached
     * uniform and attribute locations are invalidated.
     */
    @Initializable.uninitialize()
    uninitialize(): void {
        if (!this._ndcTriangleShared && this._ndcTriangle.initialized) {
            this._ndcTriangle.uninitialize();
        }
        this._program.uninitialize();
    }

    /**
     * Framebuffer to blit the given framebuffer (@see framebuffer} into.
     * @param target - Framebuffer to blit into.
     */
    set target(target: Framebuffer) {
        this.assertInitialized();
        this._target = target;
    }

    set lut(lut: LookUpTexture) {
        this._lut = lut;

        const gl = this._context.gl;

        // [ab][XY] for linear correction, e.g. x' = aX * x + bX
        /* const aY = this.drawHeight / (this.drawHeight - 1);
        const bY = -1 / (2 * this.drawHeight - 2);
        const aX = this.drawWidth / (this.drawWidth - 1);
        const bX = -1 / (2 * this.drawWidth - 2); */

        this._program.bind();
        gl.uniform1f(this._program.uniform('u_size'), this._lut.size);
        this._program.unbind();
    }

    get drawHeight(): GLuint {
        return this._lut.size;
    }

    get drawWidth(): GLuint {
        return this._lut.size * this._lut.size;
    }
}
