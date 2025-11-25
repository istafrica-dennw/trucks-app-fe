/**
 * Centralized form error handling utility
 * Parses backend validation errors and returns a field errors object
 */

/**
 * Parse backend validation errors into field-level errors
 * @param {Object} errorData - Error response from backend
 * @returns {Object} - Object with field names as keys and error messages as values
 */
export const parseValidationErrors = (errorData) => {
  const fieldErrors = {};
  
  if (!errorData || !errorData.errors || !Array.isArray(errorData.errors)) {
    return fieldErrors;
  }
  
  errorData.errors.forEach(error => {
    // Backend returns: { field: "phone", message: "...", value: "..." }
    // Support both formats: error.field (new) and error.path (old Joi format)
    const fieldName = error.field || (error.path && (Array.isArray(error.path) ? error.path[0] : error.path)) || 'general';
    fieldErrors[fieldName] = error.message;
  });
  
  return fieldErrors;
};

/**
 * Get general error message from error response
 * @param {Object} errorData - Error response from backend
 * @returns {string|null} - General error message or null
 */
export const getGeneralError = (errorData) => {
  if (!errorData) return null;
  
  // If there are field errors, return a generic message
  if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
    return 'Please fix the validation errors below';
  }
  
  // Otherwise return the main message
  return errorData.message || 'An error occurred';
};


