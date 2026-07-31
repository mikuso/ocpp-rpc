/**
 * TypeDoc plugin: expand @event @overload signatures on on() into named per-event entries.
 *
 * For each class that has an `on()` method in the "Events" group, this plugin:
 *   1. Creates a named Property reflection for each named-event overload (where the first
 *      parameter is a string literal type), using the event name as the reflection name,
 *      the listener function type as the property type, and the overload's description
 *      as the comment.
 *   2. Removes the `on()` method entirely (since all events are now individually documented).
 *   3. Overrides the icon for event reflections to use a lightning bolt instead of "P".
 *   4. Overrides the member declaration rendering to show:
 *        Event name: 'eventName'
 *        Event payload: <PayloadType>
 *      instead of the default property type signature.
 *
 * The converter hook runs at EVENT_RESOLVE_END with default priority (0), which fires
 * before GroupPlugin's handler (priority -100), so new children are automatically picked
 * up for grouping.
 */

import { Converter, DeclarationReflection, ReflectionKind, Comment, CommentTag, RendererEvent, JSX } from 'typedoc';

// A sentinel flag set on event reflections so the renderer hook can identify them.
const EVENT_REFLECTION = Symbol('eventReflection');

/** @param {import('typedoc').Application} app */
export function load(app) {

    // --- Converter phase: build per-event reflections ---

    app.converter.on(Converter.EVENT_RESOLVE_END, (context) => {
        const project = context.project;

        for (const reflection of Object.values(project.reflections)) {
            // Only process methods named 'on'
            if (reflection.variant !== 'declaration') continue;
            if (reflection.kind !== ReflectionKind.Method) continue;
            if (reflection.name !== 'on') continue;
            if (!reflection.signatures?.length) continue;

            const parent = reflection.parent;
            if (!parent?.isDeclaration()) continue;

            // Collect named-event signatures: first param must be a string literal type
            const eventSignatures = reflection.signatures.filter(sig => {
                const firstParam = sig.parameters?.[0];
                return firstParam?.type?.type === 'literal' &&
                    typeof firstParam.type.value === 'string';
            });

            if (eventSignatures.length === 0) continue;

            // For each named-event signature, create a Property reflection
            for (const sig of eventSignatures) {
                const eventName = sig.parameters[0].type.value;
                const listenerType = sig.parameters[1]?.type;

                const eventRefl = new DeclarationReflection(
                    eventName,
                    ReflectionKind.Property,
                    parent,
                );

                // Tag it so the renderer hook can identify it as an event
                eventRefl[EVENT_REFLECTION] = true;

                // Copy the description from the overload signature
                if (sig.comment) {
                    const summary = sig.comment.summary ?? [];
                    const blockTags = [
                        new CommentTag('@group', [{ kind: 'text', text: 'Events' }]),
                    ];
                    eventRefl.comment = new Comment(summary, blockTags);
                }

                // Use the listener function type as the property type
                if (listenerType) {
                    eventRefl.type = listenerType;
                }

                // Copy source location from the signature
                if (sig.sources?.length) {
                    eventRefl.sources = sig.sources;
                }

                project.registerReflection(eventRefl);
                parent.addChild(eventRefl);
            }

            // Remove the on() method - all events are now individually documented
            project.removeReflection(reflection);
        }
    });

    // --- Renderer phase: icon + custom member layout ---

    app.renderer.on(RendererEvent.BEGIN, () => {
        const theme = app.renderer.theme;
        if (!theme) return;

        // Override getReflectionIcon to return a custom key for event reflections
        const originalGetIcon = theme.getReflectionIcon.bind(theme);
        theme.getReflectionIcon = (reflection) => {
            if (reflection[EVENT_REFLECTION]) return 'event';
            return originalGetIcon(reflection);
        };

        // Add the lightning bolt SVG under the 'event' key.
        // Styled to match TypeDoc's other member icons: circular badge background with
        // a bolt drawn inside using the icon text colour.
        theme.icons['event'] = () => JSX.createElement(
            'svg',
            { class: 'tsd-kind-icon', viewBox: '0 0 24 24', 'aria-label': 'Event' },
            // Circular badge background (rx=12 matches Property, Method, etc.)
            JSX.createElement('rect', {
                fill: 'var(--color-icon-background)',
                stroke: 'var(--color-ts-property)',
                'stroke-width': '1.5',
                x: '1', y: '1', width: '22', height: '22', rx: '12',
            }),
            // Lightning bolt path centred within the badge
            JSX.createElement('path', {
                d: 'M13 4L7 13H12L11 20L17 11H12L13 4Z',
                fill: 'var(--color-icon-text)',
                stroke: 'none',
            }),
        );

        // Wrap getRenderContext so that each new context instance gets a patched
        // memberDeclaration. We can't patch the prototype because the method is
        // bound per-instance in the constructor.
        const originalGetRenderContext = theme.getRenderContext.bind(theme);
        theme.getRenderContext = (pageEvent) => {
            const context = originalGetRenderContext(pageEvent);
            const originalMemberDeclaration = context.memberDeclaration;

            context.memberDeclaration = (props) => {
                if (!props[EVENT_REFLECTION]) {
                    return originalMemberDeclaration(props);
                }

                // Extract the payload type from the listener's first parameter.
                // props.type is a ReflectionType whose declaration has one CallSignature.
                const listenerSig = props.type?.declaration?.signatures?.[0];
                const payloadType = listenerSig?.parameters?.[0]?.type ?? null;

                const payload = payloadType
                    ? JSX.createElement('div', { class: 'tsd-signature' }, context.type(payloadType))
                    : null;

                return JSX.createElement(JSX.Fragment, null,
                    payload,
                    context.commentSummary(props),
                    context.commentTags(props),
                    context.memberSources(props),
                );
            };

            return context;
        };
    });
}
