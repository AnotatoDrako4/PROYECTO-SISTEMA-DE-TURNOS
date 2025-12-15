/*
 * JWT Middleware for Google Apps Script WebApp
 * --------------------------------------------
 * Validates incoming requests via doGet/doPost.
 * Expects 'access_token' in query params or JSON body.
 */

const JWT_SECRET = "MUNI2025!"; // Shared secret matching the frontend configuration

function doGet(e) {
  try {
    const user = authMiddleware(e);
    
    // --- Authorized Logic Here ---
    // Example: Router logic
    const module = e.parameter.module || 'default';
    
    return successResponse({ 
      message: "GET Request authorized", 
      user: user,
      module: module
    });
    
  } catch (error) {
    return errorResponse(error.message);
  }
}

function doPost(e) {
  try {
    const user = authMiddleware(e);
    
    // --- Authorized Logic Here ---
    const body = getBody(e);
    
    return successResponse({ 
      message: "POST Request authorized", 
      action: body.action || "unknown",
      user: user
    });
    
  } catch (error) {
    return errorResponse(error.message);
  }
}

/**
 * Middleware to validate JWT from request
 */
function authMiddleware(e) {
  // 1. Extract Token
  // Apps Script doesn't expose headers in doGet/doPost, so we use query param or body
  let token = e.parameter.access_token;
  
  if (!token && e.postData && e.postData.contents) {
    try {
      const body = JSON.parse(e.postData.contents);
      token = body.access_token;
    } catch (err) {
      // Body might not be JSON or malformed
    }
  }

  if (!token) {
    throw new Error("Unauthorized: Missing access_token");
  }

  // 2. Verify Token
  return verifyJwt(token, JWT_SECRET);
}

/**
 * Verifies a JWT signature and expiration using GAS Utilities
 */
function verifyJwt(token, secret) {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error("Unauthorized: Invalid token format");
  }

  const [headerBase64, payloadBase64, signatureBase64] = parts;
  const signatureInput = headerBase64 + "." + payloadBase64;

  // Compute Signature (HMAC SHA256)
  const computedSignatureBytes = Utilities.computeHmacSha256Signature(signatureInput, secret);
  const computedSignatureBase64 = Utilities.base64EncodeWebSafe(computedSignatureBytes);

  // Verify Signature (handle potential padding differences if any)
  // Utilities.base64EncodeWebSafe usually strips padding, but we compare strictly first
  if (signatureBase64 !== computedSignatureBase64 && signatureBase64 !== computedSignatureBase64.replace(/=/g, '')) {
    throw new Error("Unauthorized: Invalid signature");
  }

  // Decode Payload
  const jsonPayload = Utilities.newBlob(Utilities.base64DecodeWebSafe(payloadBase64)).getDataAsString();
  const payload = JSON.parse(jsonPayload);

  // Check Expiration
  if (payload.exp) {
    const now = Math.floor(Date.now() / 1000);
    if (now > payload.exp) {
      throw new Error("Unauthorized: Token expired");
    }
  }

  return payload;
}

/**
 * Helper to parse body
 */
function getBody(e) {
  if (e.postData && e.postData.contents) {
    return JSON.parse(e.postData.contents);
  }
  return {};
}

/**
 * Standard JSON Success Response
 */
function successResponse(data) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "ok",
    ...data
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Standard JSON Error Response
 */
function errorResponse(message) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "error",
    message: message
  })).setMimeType(ContentService.MimeType.JSON);
}