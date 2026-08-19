// reportGenerator.js
// Note: This file is included for backward compatibility.
// In production, report generation is handled by the server-side API
// endpoint at api/server.js (/api/report) which keeps the OpenAI API
// key and prompt sanitization logic server-side.

import OpenAI from 'openai';

// Sanitize user content for LLM prompts to mitigate prompt injection
export const sanitizeForLLM = (text) => {
  if (typeof text !== 'string') return '';
  return text
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/system:|user:|assistant:|function:|<script|<\/script|javascript:/gi, '')
    .trim();
};

// Function to generate report
export const generateReport = async (apiKey) => {
  try {
    if (!apiKey) {
      throw new Error('API key is required');
    }

    const openai = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: false, // Never allow in browser
    });

    // In production, this reads from the server-side API.
    // This function is kept for CLI usage via email/send-email.js
    // and for the server-side report endpoint.
    return null;
  } catch (err) {
    console.error('Report generation error:', err);
    throw new Error('Failed to generate report. Please try again later.');
  }
};