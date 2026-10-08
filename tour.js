// Scroll tour logic. Content is in tour-content.js; the viewer module in index.html calls startTour().
window.startTour = async ({ createViewer, options, settings }) => {
    const tour = window.TOUR ?? { chapters: [] };
    const chapters = tour.chapters;

    const el = (tag, cls, text) => {
        const node = document.createElement(tag);
        if (cls) node.className = cls;
        if (text !== undefined) node.textContent = text;
        return node;
    };

    if (tour.brand) {
        const brand = document.querySelector('.brand');
        brand.replaceChildren(el('strong', '', tour.brand.name ?? ''), ` · ${tour.brand.subtitle ?? ''}`);
    }

    const resolved = await settings;
    const track = resolved.animTracks?.[0];

    // --- content checks -------------------------------------------------------------------------
    if (!chapters.length) console.warn('[tour] tour-content.js defines no chapters.');
    if (track) {
        const frames = track.keyframes.times.length;
        const used = new Set();
        chapters.forEach((c, i) => {
            const k = c.keyframe ?? i;
            if (!Number.isInteger(k) || k < 0 || k >= frames) {
                console.warn(`[tour] chapter ${i + 1} ("${c.title ?? c.label ?? ''}") uses keyframe ${k}, but the camera track has ${frames} (0-${frames - 1}).`);
            } else {
                used.add(k);
            }
            if (!c.title && !c.lede) console.warn(`[tour] chapter ${i + 1} has no title or lede.`);
            const a = c.annotation;
            if (a && typeof a === 'object' && a.position && a.position.length !== 3) {
                console.warn(`[tour] chapter ${i + 1}: annotation.position must be [x, y, z].`);
            }
        });
        if (used.size < frames) {
            const unused = [...Array(frames).keys()].filter((k) => !used.has(k));
            console.info(`[tour] camera keyframes with no chapter: ${unused.join(', ')}.`);
        }
    }

    // --- annotations: one hotspot per chapter, unless the scene already has its own ---------------
    if (track && !resolved.annotations?.length) {
        const { times, values } = track.keyframes;
        resolved.annotations = chapters
            .map((chapter, index) => ({ chapter, index }))
            .filter(({ chapter }) => chapter.annotation !== false)
            .map(({ chapter, index }) => {
                const keyframe = Math.min(times.length - 1, Math.max(0, chapter.keyframe ?? index));
                const offset = keyframe * 3;
                const position = values.position.slice(offset, offset + 3);
                const target = values.target.slice(offset, offset + 3);
                const custom = typeof chapter.annotation === 'object' ? chapter.annotation : {};
                const title = custom.title ?? chapter.title ?? chapter.label ?? `Stop ${index + 1}`;
                const text = custom.text ?? [chapter.lede, chapter.fact].filter(Boolean).join('\n\n');
                return {
                    position: [...(custom.position ?? target)],
                    title: title.slice(0, 60),
                    text: text.slice(0, 280),
                    camera: { initial: { position, target, fov: values.fov[keyframe] } },
                    extras: {}
                };
            });
    }

    // The viewer owns its subtree; the document hosts both it and the narrative.
    const viewer = await createViewer({ container: document.body, settings: resolved, ...options });
    window.viewer = viewer;

    // Press K to copy the current camera pose, for placing annotations.
    addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() !== 'k' || e.ctrlKey || e.metaKey || e.altKey || e.target.closest?.('input, textarea')) return;
        const cam = viewer.app.root.findComponents('camera')[0]?.entity;
        if (!cam) return;
        const round = (v) => [v.x, v.y, v.z].map((n) => Math.round(n * 1000) / 1000);
        const p = cam.getPosition();
        const f = cam.forward;
        const pose = { position: round(p), target: round({ x: p.x + f.x * 5, y: p.y + f.y * 5, z: p.z + f.z * 5 }) };
        const json = JSON.stringify(pose);
        console.log('[tour] camera pose (target is 5 units ahead):', json);
        navigator.clipboard?.writeText(json).catch(() => {});
    });

    if (!track) return;

    const keyTimes = track.keyframes.times.map((frame) => frame / track.frameRate);
    const stopTimes = chapters.map((c, i) => keyTimes[Math.min(keyTimes.length - 1, Math.max(0, c.keyframe ?? i))]);
    const count = chapters.length;

    const story = document.getElementById('story');
    const rail = document.querySelector('.rail');

    const sections = chapters.map((c) => {
        const section = el('section', `section ${c.align ?? 'left'}`);
        if (c.accent) section.style.setProperty('--accent', c.accent);
        const copy = el('div', 'copy');
        if (c.overline) copy.append(el('p', 'overline', c.overline));
        if (c.title) copy.append(el('h2', '', c.title));
        if (c.lede) copy.append(el('p', 'lede', c.lede));
        if (c.stats?.length) {
            const dl = el('dl', 'stats');
            for (const [k, v] of c.stats) {
                const row = el('div');
                row.append(el('dt', '', k), el('dd', '', v));
                dl.append(row);
            }
            copy.append(dl);
        }
        if (c.fact) copy.append(el('p', 'fact', c.fact));
        section.append(copy);
        story.appendChild(section);
        return section;
    });

    const buttons = sections.map((section, i) => {
        const name = chapters[i].label ?? `Stop ${i + 1}`;
        const button = el('button');
        button.type = 'button';
        button.setAttribute('aria-label', name);
        button.style.setProperty('--accent', chapters[i].accent ?? '#fff');
        button.append(el('span', 'label', name));
        button.addEventListener('click', () => section.scrollIntoView({ behavior: 'smooth' }));
        rail.appendChild(button);
        return button;
    });

    const reveal = new IntersectionObserver(
        (entries) => {
            for (const entry of entries) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    reveal.unobserve(entry.target);
                }
            }
        },
        { threshold: 0.3 }
    );
    sections.forEach((s) => reveal.observe(s.querySelector('.copy')));

    // scroll offset at which each section's copy is vertically centred: the camera hits its keyframe there
    let anchors = [];
    const measure = () => {
        anchors = sections.map((s) => {
            const r = s.querySelector('.copy').getBoundingClientRect();
            return r.top + scrollY + r.height / 2 - innerHeight / 2;
        });
    };
    measure();
    addEventListener('resize', measure);
    addEventListener('load', measure);

    const { state } = viewer;

    // dragging hands the camera to the viewer's own controls; scrolling hands it back to the tour
    let resumeTour = true;
    let exploring = false;
    addEventListener('scroll', () => { resumeTour = true; }, { passive: true });
    // keep the wheel scrolling the page instead of zooming the camera
    addEventListener('wheel', (e) => {
        if (exploring || e.ctrlKey || e.shiftKey) return;
        e.stopImmediatePropagation();
        resumeTour = true;
    }, { capture: true, passive: true });

    const toggle = document.querySelector('.mode-toggle');
    toggle.addEventListener('click', () => {
        exploring = !exploring;
        document.documentElement.classList.toggle('exploring', exploring);
        toggle.textContent = exploring ? 'Back to tour' : 'Explore scene';
        toggle.setAttribute('aria-pressed', String(exploring));
        if (exploring) {
            state.cameraMode = 'orbit';
        } else {
            resumeTour = true;
        }
    });

    // smoothed playhead chases the scroll-derived target time
    let current = stopTimes[0];
    let lastSeek = -1;
    let lastFrame = performance.now();

    const tick = (now) => {
        const dt = Math.min(0.1, (now - lastFrame) / 1000);
        lastFrame = now;

        let i = count - 1;
        while (i > 0 && scrollY < anchors[i]) i--;
        const next = Math.min(i + 1, count - 1);
        const span = anchors[next] - anchors[i];
        const frac = span > 0 ? Math.max(0, Math.min(1, (scrollY - anchors[i]) / span)) : 0;
        const target = stopTimes[i] + (stopTimes[next] - stopTimes[i]) * frac;
        const active = Math.round(i + frac);

        current += (target - current) * (1 - Math.exp(-dt * 6));
        buttons.forEach((b, n) => b.classList.toggle('active', n === active));
        document.body.classList.toggle('scrolled', scrollY > 40);

        if (state.loaded && !exploring) {
            if (!state.animationPaused) state.animationPaused = true;
            const free = state.cameraMode !== 'anim';
            if (free && !resumeTour) {
                // user is exploring: leave the camera alone
            } else if (free || Math.abs(current - lastSeek) > 1e-4) {
                viewer.seek(current);
                lastSeek = current;
                resumeTour = false;
            }
        }
        requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
};
