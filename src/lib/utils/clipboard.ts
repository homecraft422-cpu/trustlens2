/**
 * Safe Clipboard Utility
 * 
 * Handles clipboard operations with proper error handling
 * and fallbacks for browsers that block the Clipboard API
 */

/**
 * Copy text to clipboard safely
 * Uses multiple fallback methods if Clipboard API is blocked
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // Method 1: Try Clipboard API (modern browsers)
  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (error) {
    // Clipboard API failed, try fallback
    console.debug('Clipboard API failed, trying fallback...');
  }

  // Method 2: Try document.execCommand (older browsers)
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    // Make the textarea invisible
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '-9999px';
    textArea.style.opacity = '0';
    textArea.style.pointerEvents = 'none';
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    if (success) {
      return true;
    }
  } catch (error) {
    console.debug('execCommand copy failed...');
  }

  // Method 3: Try using a temporary input element
  try {
    const input = document.createElement('input');
    input.value = text;
    input.style.position = 'fixed';
    input.style.left = '-9999px';
    document.body.appendChild(input);
    input.select();
    
    const success = document.execCommand('copy');
    document.body.removeChild(input);
    
    return success;
  } catch (error) {
    console.debug('All clipboard methods failed');
  }

  return false;
}

/**
 * Read text from clipboard safely
 */
export async function readFromClipboard(): Promise<string | null> {
  try {
    if (navigator.clipboard && typeof navigator.clipboard.readText === 'function') {
      return await navigator.clipboard.readText();
    }
  } catch (error) {
    console.debug('Clipboard read failed');
  }
  return null;
}

/**
 * Check if clipboard API is available
 */
export function isClipboardAvailable(): boolean {
  return !!(
    typeof navigator !== 'undefined' &&
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === 'function'
  );
}

/**
 * Copy with user feedback
 * Shows a message to the user about the copy result
 */
export async function copyWithFeedback(
  text: string,
  onSuccess?: () => void,
  onError?: (error: string) => void
): Promise<void> {
  const success = await copyToClipboard(text);
  
  if (success) {
    onSuccess?.();
  } else {
    // Last resort: prompt user to copy manually
    const message = 'Unable to copy automatically. Please copy manually:';
    
    if (onError) {
      onError(message);
    } else {
      // Show the text in a prompt for manual copying
      window.prompt(message, text);
    }
  }
}

export default copyToClipboard;
