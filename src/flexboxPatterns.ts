/**
 * 匹配 CSS 和 Stylus 的 display: flex;
 * 支持 display flex, display: flex, display flex;
 * 不区分冒号和分号
 */
export const displayFlexPattern = /\bdisplay\s*:?\s*flex\s*;?/g;

/**
 * 匹配 CSS 和 Stylus 的 display: inline-flex;
 * 支持 display inline-flex
 */
export const displayInlineFlexPattern = /\bdisplay\s*:?\s*inline-flex\s*;?/g;

/**
 * 匹配 CSS 和 Stylus 的 display: grid;
 * 支持 display grid
 */
export const displayGridPattern = /\bdisplay\s*:?\s*grid\s*;?/g;

/**
 * 匹配 CSS 和 Stylus 的 display: inline-grid;
 * 支持 display inline-grid
 */
export const displayInlineGridPattern = /\bdisplay\s*:?\s*inline-grid\s*;?/g;

export const allFlexboxPatterns = [
  displayFlexPattern,
  displayInlineFlexPattern,
  displayGridPattern,
  displayInlineGridPattern
];