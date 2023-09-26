/**
 * Matches `display: flex` property
 */
export const displayFlexPattern = /display:\s*flex;/g;

/**
 * Matches `display: inline-flex` property
 */
export const displayInlineFlexPattern = /display:\s*inline-flex;/g;


export const allFlexboxPatterns = [
  displayFlexPattern,
  displayInlineFlexPattern
];