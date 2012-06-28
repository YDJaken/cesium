/*global define*/
define(['./Math'
       ], function(
        CesiumMath) {
    "use strict";

    var factorial = CesiumMath.factorial;

    function calculateCoefficientTerm(x, zIndices, xTable, derivOrder, termOrder, reservedIndices) {
        var result = 0;
        var reserved;
        var i;
        var j;

        if (derivOrder > 0) {
            for (i = 0; i < termOrder; i++) {
                reserved = false;
                for (j = 0; j < reservedIndices.length && !reserved; j++) {
                    if (i === reservedIndices[j]) {
                        reserved = true;
                    }
                }

                if (!reserved) {
                    reservedIndices.push(i);
                    result += calculateCoefficientTerm(x, zIndices, xTable, derivOrder - 1, termOrder, reservedIndices);
                    reservedIndices.splice(reservedIndices.length - 1, 1);
                }
            }

            return result;
        }

        result = 1;
        for (i = 0; i < termOrder; i++) {
            reserved = false;
            for (j = 0; j < reservedIndices.length && !reserved; j++) {
                if (i === reservedIndices[j]) {
                    reserved = true;
                }
            }

            if (!reserved) {
                result *= x - xTable[zIndices[i]];
            }
        }

        return result;
    }

    /**
     * Functions for performing Hermite interpolation.
     *
     * @see LinearApproximation
     * @see LagrangePolynomialApproximation
     */
    var HermitePolynomialApproximation = {
        type : 'Hermite'
    };

    /**
     * Given the desired degree, returns the number of data points required for interpolation.
     *
     * @memberof HermitePolynomialApproximation
     *
     * @param degree The desired degree of interpolation.
     *
     * @returns The number of required data points needed for the desired degree of interpolation.
     */
    HermitePolynomialApproximation.getRequiredDataPoints = function(degree) {
        return Math.max(degree + 1, 2);
    };

    /**
     * <p>
     * Interpolates values using the supplied interpolation algorithm.  The appropriate subset of input
     * values to use for the interpolation is determined automatically from an interpolation given
     * degree.
     * </p>
     * <p>
     * The xTable array can contain any number of elements, and the appropriate subset will be
     * selected according to the degree of interpolation requested.  For example, if degree is 5,
     * the 6 elements surrounding x will be used for interpolation.  When using
     * {@link LinearApproximation} the degree should be 1 since it always deals with only 2 elements
     * surrounding x. The yTable array should contain a number of elements equal to:
     * <code>xTable.length * yStride</code>.  If insufficient elements are provided
     * to perform the requested degree of interpolation, the highest possible degree of interpolation
     * will be performed.
     * </p>
     *
     * @param {Number} x The independent variable for which the dependent variables will be interpolated.
     *
     * @param {Array} xTable The array of independent variables to use to interpolate.  The values
     * in this array must be in increasing order and the same value must not occur twice in the array.
     *
     * @param {Array} yTable The array of dependent variables to use to interpolate.  For a set of three
     * dependent values (p,q,w) and their derivatives (dp, dq, dw) at time 1 and time 2 this should be
     * as follows: {p1, q1, w1, dp1, dq1, dw1, p2, q2, w2, dp2, dq2, dw2}.
     *
     * @param {Number} yStride The number of dependent variable values in yTable corresponding to
     * each independent variable value in xTable.
     *
     * @returns An array of interpolated values.  The array contains at least yStride elements, each
     * of which is an interpolated dependent variable value.
     *
     * @see LinearApproximation
     * @see LagrangePolynomialApproximation
     *
     * @memberof HermitePolynomialApproximation
     */
    HermitePolynomialApproximation.interpolateOrderZero = function(x, xTable, yTable, yStride) {
        var length = xTable.length, i, j, d, s, len, index, result = new Array(yStride), coefficients = new Array(yStride);

        for (i = 0; i < yStride; i++) {
            result[i] = 0;

            var l = new Array(length);
            coefficients[i] = l;
            for (j = 0; j < length; j++) {
                l[j] = [];
            }
        }

        var zIndicesLength = length, zIndices = new Array(zIndicesLength);

        for (i = 0; i < zIndicesLength; i++) {
            zIndices[i] = i;
        }

        var highestNonZeroCoef = length - 1;
        for (s = 0; s < yStride; s++) {
            for (j = 0; j < zIndicesLength; j++) {
                index = zIndices[j] * yStride + s;
                coefficients[s][0].push(yTable[index]);
            }

            for (i = 1; i < zIndicesLength; i++) {
                var nonZeroCoefficients = false;
                for (j = 0; j < zIndicesLength - i; j++) {
                    var zj = xTable[zIndices[j]];
                    var zn = xTable[zIndices[j + i]];

                    var numerator;
                    if (zn - zj <= 0) {
                        index = zIndices[j] * yStride + yStride * i + s;
                        numerator = yTable[index];
                        coefficients[s][i].push(numerator / factorial(i));
                    } else {
                        numerator = (coefficients[s][i - 1][j + 1] - coefficients[s][i - 1][j]);
                        coefficients[s][i].push(numerator / (zn - zj));
                    }
                    nonZeroCoefficients = nonZeroCoefficients || (numerator !== 0);
                }

                if (!nonZeroCoefficients) {
                    highestNonZeroCoef = i - 1;
                }
            }
        }

        for (d = 0, len = 0; d <= len; d++) {
            for (i = d; i <= highestNonZeroCoef; i++) {
                var tempTerm = calculateCoefficientTerm(x, zIndices, xTable, d, i, []);
                for (s = 0; s < yStride; s++) {
                    var coeff = coefficients[s][i][0];
                    result[s + d * yStride] += coeff * tempTerm;
                }
            }
        }

        return result;
    };

    return HermitePolynomialApproximation;
});