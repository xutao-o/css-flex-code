/**
 * Matches `display: flex` property
 */
export const displayFlexPattern = /display:\s*flex;/g;

/**
 * Matches `display: inline-flex` property
 */
export const displayInlineFlexPattern = /display:\s*inline-flex;/g;

/**
 * Matches `display: grid` property
 */
export const displayGridPattern = /display:\s*grid;/g;

/**
 * Matches `display: inline-grid` property
 */
export const displayInlineGridPattern = /display:\s*inline-grid;/g;

export const allFlexboxPatterns = [
  displayFlexPattern,
  displayInlineFlexPattern,
  displayGridPattern,
  displayInlineGridPattern
];