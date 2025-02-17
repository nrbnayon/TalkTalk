import slugify from "slugify";

/**
 * Sanitizes a name by converting to lowercase, replacing spaces with hyphens,
 * and removing non-alphanumeric characters
 * @param {string} name - The input name to sanitize
 * @returns {string} Sanitized name
 */
const sanitizeName = (name) =>
  name && typeof name === "string"
    ? name
        .toLowerCase()
        .replace(/[\s]/g, "-")
        .replace(/[^a-z0-9-]/g, "")
    : "";

/**
 * Generates a URL-friendly slug from input text
 * @param {string} text - The text to convert into a slug
 * @returns {string} A sanitized, lowercase slug
 */
export const GenerateSlug = (text) => {
  // Combine sanitizeName and slugify for comprehensive slug generation
  const sanitizedText = sanitizeName(text);
  return slugify(sanitizedText, { lower: true });
};

/**
 * Converts a slug back to a readable title
 * @param {string} slug - The slug to convert
 * @returns {string} A formatted title with capitalized words
 */
export const removeSlug = (slug) => {
  const words = slug.split("-");
  const convertedWords = words.map((word) => {
    if (word === "and") {
      return "&";
    } else {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }
  });
  return convertedWords.join(" ");
};

// import slugify from "slugify";

// /**
//  * Sanitizes a name by converting to lowercase, replacing spaces with hyphens,
//  * and removing non-alphanumeric characters
//  * @param {string} name - The input name to sanitize
//  * @returns {string} Sanitized name
//  */
// const sanitizeName = (name) =>
//   name && typeof name === "string"
//     ? name
//         .toLowerCase()
//         .replace(/[\s]/g, "-")
//         .replace(/[^a-z0-9-]/g, "")
//     : "";

// /**
//  * Generates a URL-friendly slug from input text
//  * @param {string} text - The text to convert into a slug
//  * @returns {string} A sanitized, lowercase slug
//  */
// export const GenerateSlug = (text) => {
//   // Combine sanitizeName and slugify for comprehensive slug generation
//   const sanitizedText = sanitizeName(text);
//   return slugify(sanitizedText, { lower: true });
// };

// /**
//  * Converts a slug back to a readable title
//  * @param {string} slug - The slug to convert
//  * @returns {string} A formatted title with capitalized words
//  */
// export const removeSlug = (slug) => {
//   const words = slug.split("-");
//   const convertedWords = words.map((word) => {
//     if (word === "and") {
//       return "&";
//     } else {
//       return word.charAt(0).toUpperCase() + word.slice(1);
//     }
//   });
//   return convertedWords.join(" ");
// };

// // import slugify from "slugify";

// // export const GenerateSlug = (text) => {
// //   return slugify(text, { lower: true });
// // };

// // export const removeSlug = (slug) => {
// //   const words = slug.split("-");
// //   const convertedWords = words.map((word) => {
// //     if (word === "and") {
// //       return "&";
// //     } else {
// //       return word.charAt(0).toUpperCase() + word.slice(1);
// //     }
// //   });
// //   return convertedWords.join(" ");
// // };
