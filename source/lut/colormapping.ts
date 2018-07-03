
import { Color } from '../color';


export class ColorMapping {

    static monochrome(c: Color): Color {
        // values from https://en.wikipedia.org/wiki/Grayscale (3rd July 2018)
        const luminance = c.r * 0.2126 + c.g * 0.7152 + c.b * 0.0722;
        return new Color().fromRGB(luminance, luminance, luminance);
    }

    /**
     * "red-weak"
     * @link https://github.com/MaPePeR/jsColorblindSimulator
     */
    static protanomaly(c: Color): Color {
        return new Color().fromRGB(
            c.r * .81667 + c.g * .18333 /* + c.b * .0*/,
            c.r * .33333 + c.g * .66667 /* + c.b * .0*/,
            /*c.r * .0 + */c.g * .12500 + c.b * .875);
    }

    /**
     * "red-blind"
     * @link https://github.com/MaPePeR/jsColorblindSimulator
     */
    static protanopia(c: Color): Color {
        return new Color().fromRGB(
            c.r * .56667 + c.g * .43333 /* + c.b * .0*/,
            c.r * .55833 + c.g * .44167 /* + c.b * .0*/,
            /*c.r * .0 + */c.g * .24167 + c.b * .75833);
    }
}
