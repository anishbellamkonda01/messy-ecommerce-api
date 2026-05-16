// Yet another utility file with overlapping responsibility

// DUPLICATE: Similar to validateRequired in utils.js
function checkFields(required, data) {
  return required.every(field => data[field] !== undefined && data[field] !== '');
}

module.exports = { checkFields };
