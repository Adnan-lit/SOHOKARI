package com.adnan.sohokari_backend.util;

import java.util.regex.Pattern;

/**
 * Utility class for sanitizing user inputs.
 * Strips HTML tags, normalizes whitespace, and limits length.
 */
public final class SanitizeUtil {

    private SanitizeUtil() {}

    private static final Pattern HTML_TAG = Pattern.compile("<[^>]*>");
    private static final Pattern SCRIPT_TAG = Pattern.compile(
            "<script[^>]*>.*?</script>", Pattern.CASE_INSENSITIVE | Pattern.DOTALL);
    private static final Pattern MULTI_SPACE = Pattern.compile("\\s{2,}");

    /**
     * Strips HTML/script tags and normalizes whitespace.
     */
    public static String sanitize(String input) {
        if (input == null) return null;
        String cleaned = SCRIPT_TAG.matcher(input).replaceAll("");
        cleaned = HTML_TAG.matcher(cleaned).replaceAll("");
        cleaned = MULTI_SPACE.matcher(cleaned).replaceAll(" ");
        return cleaned.trim();
    }

    /**
     * Sanitize and limit to maxLength characters.
     */
    public static String sanitize(String input, int maxLength) {
        String cleaned = sanitize(input);
        if (cleaned != null && cleaned.length() > maxLength) {
            return cleaned.substring(0, maxLength);
        }
        return cleaned;
    }
}
