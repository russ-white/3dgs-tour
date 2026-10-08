/*
 * Everything you write for the tour lives in this file. Reload the page to see changes.
 *
 * Each chapter is one scroll stop and one camera keyframe, in order (chapter 1 -> keyframe 0, ...).
 *
 *   label       short name for the dot on the right-hand rail
 *   overline    small caps line above the title
 *   title       large heading
 *   lede        the main sentence or two
 *   stats       optional [['Name', 'Value'], ...] pairs shown in a grid
 *   fact        optional closing note
 *   accent      colour for the overline, stats names and rail dot
 *   align       'left' or 'right' side of the screen
 *   keyframe    optional: use another camera keyframe (0-based) instead of the chapter's own position
 *   annotation  optional in-scene hotspot:
 *                 omit           -> hotspot at the keyframe's look-at point, using the chapter title and lede
 *                 false          -> no hotspot for this chapter
 *                 { title, text, position: [x, y, z] }
 *                                -> override any of the three (title <= 60 chars, text <= 280 chars)
 *
 * Tip: press K while the page is open to copy the current camera pose as { position, target },
 * handy for placing a hotspot with `annotation.position`.
 */
window.TOUR = {
    brand: { name: '3DGS', subtitle: 'Scrolling Tour' },

    chapters: [
        {
            label: 'Welcome',
            overline: 'A scrolling tour through a 3D scene',
            title: 'Welcome',
            lede: "Scroll to begin the tour. Click on Annotations to learn more. Or, Choose 'Explore Scene' to navigate on your own.",
            stats: [
                ['Tour Stops', 'Five'],
                ['Reading Time', '<1 min.']
            ],
            fact: 'This is a test, scrollytelling tour.',
            accent: '#ffb45e',
            align: 'left'
        },
        {
            label: 'Stop 1',
            overline: '01 · First stop',
            title: 'Exhibition Space',
            lede: "Here we see what's on display.",
            accent: '#ffb45e',
            align: 'left'
        },
        {
            label: 'Stop 2',
            overline: '02 · Second stop',
            title: 'Another Perspective',
            lede: 'And view from different vantage points.',
            accent: '#ffb45e',
            align: 'left'
        },
        {
            label: 'Stop 3',
            overline: '03 · Third stop',
            title: 'More to Explore',
            lede: 'The scene continues in new directions.',
            accent: '#ffb45e',
            align: 'left'
        },
        {
            label: 'Stop 4',
            overline: '04 · Fourth stop',
            title: 'More choices',
            lede: 'More corridors.',
            accent: '#ffb45e',
            align: 'left'
        },
        {
            label: 'Stop 5',
            overline: '05 · Fifth stop',
            title: 'Full Circle',
            lede: 'We return to our starting point.',
            accent: '#ffb45e',
            align: 'left'
        },
        {
            label: 'Outro',
            overline: 'The end',
            title: 'Thanks for scrolling',
            lede: 'This concludes our test tour.',
            accent: '#ffb45e',
            align: 'left'
        }
    ]
};
