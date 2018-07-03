
import { assert } from '../auxiliaries';

import { Context } from '../context';
import { Framebuffer } from '../framebuffer';
import { Initializable } from '../initializable';
import { NdcFillingTriangle } from '../ndcfillingtriangle';
import { Program } from '../program';
import { Shader } from '../shader';
import { Texture2 } from '../texture2';

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

    protected _programProcedural: Program;
    protected _programTexture: Program;

    protected _lut: LookUpTexture | undefined;

    protected _texture: Texture2 | undefined;

    protected _defaultSize: GLubyte = 24;


    constructor(context: Context) {
        super();
        this._context = context;
    }

    protected renderTexture(): void {
        if (this._texture === undefined) {
            if (this._lut === undefined) {
                throw Error('LUT is undefined');
            }

            this._texture = this._lut.createTexture(this._context);
        }
        this._texture.bind(this._context.gl.TEXTURE0);

        this._programTexture.bind();
        this._ndcTriangle.draw();

        this._texture.unbind();
    }


    protected renderProcedural(): void {
        this._programProcedural.bind();
        this._ndcTriangle.draw();
    }

    protected setProceduralUniforms(): void {
        // [ab][XY] for linear correction: [x',y'] = a * [x,y] + b
        const size = this.drawHeight;
        const stride = 1 / (size - 1);
        const a = size * stride;
        const b = -stride / 2;

        const gl = this._context.gl;
        this._programProcedural.bind();
        gl.uniform4f(this._programProcedural.uniform('u_param'), a, b, size, stride);
        this._programProcedural.unbind();
    }


    render(): void {
        assert(this._ndcTriangle && this._ndcTriangle.initialized, `expected an initialized ndc triangle`);

        const gl = this._context.gl;
        if (this._target.width < this.drawWidth || this._target.height < this.drawHeight) {
            console.log('warning: look-up texture (' + this.drawWidth + 'x' +
                this.drawHeight + ') does not fit in the target framebuffer');
        }


        // on lower right side of the screen
        gl.viewport(this._target.width - this.drawWidth, 0, this.drawWidth, this.drawHeight);
        gl.disable(gl.DEPTH_TEST);

        const target = this._context.isWebGL2 ? gl.DRAW_FRAMEBUFFER : gl.FRAMEBUFFER;
        this._target.bind(target);
        this._ndcTriangle.bind();

        if (this._lut === undefined) {
            this.renderProcedural();
        } else {
            this.renderTexture();
        }

        this._ndcTriangle.unbind();
        this._target.unbind(target);

        gl.enable(gl.DEPTH_TEST);

        /* Every pass is expected to bind its own program when drawing, thus, unbinding is not necessary. */
        // this.program.unbind();
    }

    @Initializable.initialize()
    initialize(ndcTriangle?: NdcFillingTriangle): boolean {
        const gl = this._context.gl;

        /* Configure program-based blit. */

        const vert = new Shader(this._context, gl.VERTEX_SHADER, 'ndcvertices.vert (lut)');
        vert.initialize(require('../shaders/ndcvertices.vert'));
        const fragProcedural = new Shader(this._context, gl.FRAGMENT_SHADER, 'lut.frag');
        fragProcedural.initialize(require('../shaders/lut.frag'));
        const fragTexture = new Shader(this._context, gl.FRAGMENT_SHADER, 'blit.frag (lut)');
        fragTexture.initialize(require('../shaders/blit.frag'));

        this._programProcedural = new Program(this._context, 'LUTProceduralProgram');
        this._programProcedural.initialize([vert, fragProcedural]);

        this._programTexture = new Program(this._context, 'LUTTextureProgram');
        this._programTexture.initialize([vert, fragTexture]);

        this._programTexture.bind();
        gl.uniform1i(this._programTexture.uniform('u_texture'), 0);
        this._programTexture.unbind();

        if (ndcTriangle === undefined) {
            this._ndcTriangle = new NdcFillingTriangle(this._context);
        } else {
            this._ndcTriangle = ndcTriangle;
            this._ndcTriangleShared = true;
        }

        if (!this._ndcTriangle.initialized) {
            const aVertex = this._programProcedural.attribute('a_vertex', 0);
            this._ndcTriangle.initialize(aVertex);
        } else {
            this._programProcedural.attribute('a_vertex', this._ndcTriangle.aVertex);
            this._programTexture.attribute('a_vertex', this._ndcTriangle.aVertex);
        }

        this.setProceduralUniforms();

        return true;
    }

    /** Specializes this pass's uninitialization. Program and geometry resources are released (if allocated). Cached
     * uniform and attribute locations are invalidated.
     */
    @Initializable.uninitialize()
    uninitialize(): void {
        if (!this._ndcTriangleShared && this._ndcTriangle.initialized) {
            this._ndcTriangle.uninitialize();
        }

        this._programProcedural.uninitialize();
        this._programTexture.uninitialize();
    }


    /** Framebuffer to blit the given framebuffer (@see framebuffer} into.
     * @param target - Framebuffer to blit into.
     */
    set target(target: Framebuffer) {
        this.assertInitialized();
        this._target = target;
    }

    set lut(lut: LookUpTexture | undefined) {
        this._lut = lut;

        this._texture = undefined;

        this.setProceduralUniforms();
    }

    get drawHeight(): GLuint {
        if (this._lut === undefined) {
            return this._defaultSize;
        }
        return this._lut.size;
    }

    get drawWidth(): GLuint {
        if (this._lut === undefined) {
            return this._defaultSize * this._defaultSize;
        }
        return this._lut.size * this._lut.size;
    }

    set defaultSize(size: GLubyte) {
        this._defaultSize = size;

        this.setProceduralUniforms();
    }
}
