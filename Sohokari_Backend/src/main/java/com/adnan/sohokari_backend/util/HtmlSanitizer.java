package com.adnan.sohokari_backend.util;

/**
 * Simple HTML/XSS sanitizer that strips HTML tags from user input.
 */
public final class HtmlSanitizer {

    private HtmlSanitizer() {}

    /**
     * Strip all HTML tags from the input string.
     * Returns null if input is null.
     */
    public static String sanitize(String input) {
        if (input == null) return null;
        return input.replaceAll("<[^>]*>", "").trim();
    }
}
