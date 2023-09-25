/**
 * Matches `display: flex` property
 */
export const displayFlexPattern = /display:\s*flex;?/g;

/**
 * Matches `display: inline-flex` property
 */
export const displayInlineFlexPattern = /display:\s*inline-flex;?/g;

/**
 * Matches all `align-items`, `align-content` and `align-self` properties
 */
const alignPattern = /align-[\w]+:\s*[\w-]+;?/g;

/**
 * Matches all `justify-content` properties
 */
const justifyPattern = /justify-[\w]+:\s*[\w-]+;?/g;

/**
 * Matches all `flex-direction` and `flex-wrap` properties
 */
const flexWrapAndDirectionPattern = /flex-(wrap|direction):\s*[\w-]+;?/g;

/**
 * Matches all `flex-grow` and `flex-shrink` properties
 */
const flexGrowAndShrinkPattern = /flex-(grow|shrink):\s*\d+;?/g;

/**
 * Matches `flex-grow` values bigger than 0 
 */
export const flexGrowBiggerThanZero = /flex-grow:\s*(?!0)\d+;?/;

/**
 * Matches `flex-shrink` values bigger than 0 
 */
export const flexShrinkBiggerThanZero = /flex-shrink:\s*(?!0)\d+;?/;

/**
 * Matches `order` property
 */
export const order = /order:\s*?-?\d+;?/g;

export const allFlexboxPatterns = [
  displayFlexPattern,
  displayInlineFlexPattern,
  alignPattern,
  justifyPattern,
  flexWrapAndDirectionPattern,
  flexGrowAndShrinkPattern,
  order
];