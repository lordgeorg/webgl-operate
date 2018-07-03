
import { Color } from '../color';


export class ColorMapping {

    static invert(c: Color): Color {
        return new Color().fromRGB(1. - c.r, 1 - c.g, 1 - c.b);
    }

    static linearTransformation(c: Color, rr: number, rg: number, rb: number,
        gr: number, gg: number, gb: number,
        br: number, bg: number, bb: number): Color {
        return new Color().fromRGB(
            c.r * rr + c.g * rg + c.b * rb,
            c.r * gr + c.g * gg + c.b * gb,
            c.r * br + c.g * bg + c.b * bb);
    }

    static monochrome(c: Color): Color {
        // values from https://en.wikipedia.org/wiki/Grayscale (3rd July 2018)
        return ColorMapping.linearTransformation(c,
            .2126, .7152, .0722,
            .2126, .7152, .0722,
            .2126, .7152, .0722);
    }

    /**
     * "red-weak"
     * @link https://github.com/MaPePeR/jsColorblindSimulator
     */
    static protanomaly(c: Color): Color {
        return ColorMapping.linearTransformation(c,
            .81667, .18333, .0,
            .33333, .66667, .0,
            .00000, .12500, .875);
    }

    /**
     * "red-blind"
     * @link https://github.com/MaPePeR/jsColorblindSimulator
     */
    static protanopia(c: Color): Color {
        return ColorMapping.linearTransformation(c,
            .56667, .43333, .0,
            .55833, .44167, .0,
            .00000, .24167, .75833);
    }
}
