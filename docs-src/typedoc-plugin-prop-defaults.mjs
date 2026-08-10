/**
 * TypeDoc plugin: inject @defaultValue tags from JSDoc @prop bracket notation.
 *
 * TypeDoc's comment parser recognises the `[name=default]` syntax on `@prop` tags
 * and uses it to mark the property as optional, but it deliberately discards the
 * `=default` portion and never exposes it on the reflection. This plugin recovers
 * that information by reading it directly from the raw source line indicated by
 * the reflection's source location, then attaches it as a `@defaultValue` block
 * tag so TypeDoc renders it natively as a "Default Value" section.
 *
 * Approach:
 *   1. At EVENT_RESOLVE_END, walk every reflection that has source info.
 *   2. For each one, read the corresponding line from its source file.
 *   3. Apply a regex to extract the default value from `[name=value]` notation.
 *   4. If a default is found and the reflection doesn't already have a
 *      `@defaultValue` tag, append one.
 *
 * The regex handles:
 *   - Simple scalars:        [foo=1], [foo=false], [foo=Infinity]
 *   - Quoted strings:        [foo='bar'], [foo="baz"]
 *   - Nested brackets/braces: [foo=[]], [foo={}]
 */

import { readFileSync } from 'fs';
import { Converter, CommentTag } from 'typedoc';

// Cache file contents so each source file is only read once per build.
const fileCache = new Map();

function getLines(fullPath) {
    if (!fileCache.has(fullPath)) {
        try {
            fileCache.set(fullPath, readFileSync(fullPath, 'utf8').split('\n'));
        } catch {
            fileCache.set(fullPath, null);
        }
    }
    return fileCache.get(fullPath);
}

/**
 * Extract the default value string from a raw @prop source line, e.g.:
 *   " * @prop {number} [callTimeoutMs=30000] Milliseconds ..."  ->  "30000"
 *   " * @prop {string[]} [protocols=[]] Array ..."              ->  "[]"
 *   " * @prop {object} [wssOptions={}] Additional ..."          ->  "{}"
 *   " * @prop {boolean} [reconnect=true] ..."                   ->  "true"
 *   " * @prop {object|string} [query=''] ..."                   ->  "''"
 *
 * Returns null if the line has no bracket default notation.
 */
function extractPropDefault(line) {
    // Skip past the @prop/@property tag name itself
    const tagMatch = line.match(/@prop(?:erty)?\s+/);
    if (!tagMatch) return null;
    let pos = tagMatch.index + tagMatch[0].length;

    // Skip the type annotation {type} if present — it may contain [] (e.g. {string[]})
    // which would confuse a naive indexOf('[') search.
    if (line[pos] === '{') {
        let depth = 0;
        while (pos < line.length) {
            if (line[pos] === '{') depth++;
            else if (line[pos] === '}') { depth--; if (depth === 0) { pos++; break; } }
            pos++;
        }
        while (pos < line.length && line[pos] === ' ') pos++;
    }

    // After the type annotation we expect [name=default] for optional props.
    if (line[pos] !== '[') return null;
    const bracketStart = pos;

    // Find the = sign at depth 1 that separates name from default.
    let depth = 0;
    let eqPos = -1;
    for (let i = bracketStart; i < line.length; i++) {
        const ch = line[i];
        if (ch === '[' || ch === '{') { depth++; continue; }
        if (ch === ']' || ch === '}') { depth--; if (depth === 0) break; continue; }
        if (ch === '=' && depth === 1) { eqPos = i; break; }
    }
    if (eqPos === -1) return null;

    // Collect everything from after = up to the matching ]
    // tracking bracket/brace depth and simple quoted strings
    let result = '';
    let inString = '';
    let d = 1; // we're already inside the outer [
    for (let i = eqPos + 1; i < line.length; i++) {
        const ch = line[i];
        if (inString) {
            result += ch;
            if (ch === inString) inString = '';
            continue;
        }
        if (ch === '"' || ch === "'" || ch === '`') { inString = ch; result += ch; continue; }
        if (ch === '[' || ch === '{') { d++; result += ch; continue; }
        if (ch === ']' || ch === '}') {
            d--;
            if (d === 0) break; // closing bracket of [name=default]
            result += ch;
            continue;
        }
        result += ch;
    }
    return result.trim() || null;
}

/** @param {import('typedoc').Application} app */
export function load(app) {
    app.converter.on(Converter.EVENT_RESOLVE_END, () => {
        // Clear the file cache at the start of each build so stale content
        // isn't used across incremental watch-mode rebuilds.
        fileCache.clear();
    });

    app.converter.on(Converter.EVENT_RESOLVE, (_context, reflection) => {
        const src = reflection.sources?.[0];
        if (!src?.fullFileName || !src.line) return;

        // Only process reflections that are properties/parameters (typedef fields)
        // with a comment that could receive a @defaultValue tag.
        if (!reflection.comment) return;

        // Skip if a @defaultValue tag was already set explicitly in the source.
        if (reflection.comment.blockTags.some(t => t.tag === '@defaultValue')) return;

        const lines = getLines(src.fullFileName);
        if (!lines) return;

        const rawLine = lines[src.line - 1]; // source line numbers are 1-indexed
        if (!rawLine) return;

        const defaultValue = extractPropDefault(rawLine);
        if (defaultValue === null) return;

        reflection.comment.blockTags.push(
            new CommentTag('@defaultValue', [{ kind: 'code', text: `\`${defaultValue}\`` }])
        );
    });
}
