$(document).ready(function () {
    const $canvasArea = $('#canvas-area');
    const $fileInput = $('#file-input');
    const $canvas = $('#main-canvas');
    const canvas = $canvas[0];
    const ctx = canvas.getContext('2d');
    const $placeholder = $('#canvas-placeholder');

    let imageLoaded = false;
    let originalImage = null;

    // Default State
    const defaultState = {
        padding: { top: 40, bottom: 40, left: 40, right: 40 },
        background: { type: 'linear', value: ['#7F00FF', '#E100FF'] }, // Purple gradient
        radius: 36,
        shadow: false, // Default OFF
        blurLevel: 8,
        blurRects: [], // {x, y, w, h}
        isPaddingLinked: true
    };

    // State - Try to load from local storage
    let state = loadState() || defaultState;

    // Interaction State
    let interaction = {
        mode: 'idle', // idle, creating, moving, resizing
        startPos: { x: 0, y: 0 }, // Mouse down pos
        activeRectIndex: -1, // Index of rect being moved/resized/selected
        resizeHandle: null, // tl, tr, bl, br
        initialRect: null, // Clone of rect at start of drag
        currentDragRect: null // For visualizing new rect creation
    };

    // Background Presets
    const backgrounds = [
        { type: 'transparent', label: 'Transparent' },
        // Solid Colors
        { type: 'solid', value: '#ffffff' },
        { type: 'solid', value: '#000000' },
        { type: 'solid', value: '#ff0000' },
        { type: 'solid', value: '#00ff00' },
        { type: 'solid', value: '#0000ff' },
        { type: 'solid', value: '#ffff00' },
        { type: 'solid', value: '#ff00ff' },
        { type: 'solid', value: '#00ffff' },
        { type: 'solid', value: '#808080' },
        // Linear Gradients
        { type: 'linear', value: ['#bdc3c7', '#2c3e50'] },
        { type: 'linear', value: ['#2193b0', '#6dd5ed'] },
        { type: 'linear', value: ['#cc2b5e', '#753a88'] },
        { type: 'linear', value: ['#42275a', '#734b6d'] },
        { type: 'linear', value: ['#de6262', '#ffb88c'] },
        { type: 'linear', value: ['#06beb6', '#48b1bf'] },
        { type: 'linear', value: ['#eb3349', '#f45c43'] },
        { type: 'linear', value: ['#dd5e89', '#f7bb97'] },
        { type: 'linear', value: ['#56ab2f', '#a8e063'] },
        { type: 'linear', value: ['#614385', '#516395'] },
        // Quad/Mesh-like Gradients (Simulated with Diagonal Linear for now)
        { type: 'linear', value: ['#00F260', '#0575E6'] },
        { type: 'linear', value: ['#e1eec3', '#f05053'] },
        { type: 'linear', value: ['#7F00FF', '#E100FF'] }, // The purple one
        { type: 'linear', value: ['#659999', '#f4791f'] },
        { type: 'linear', value: ['#C33764', '#1D2671'] },
        { type: 'linear', value: ['#FEAC5E', '#C779D0', '#4BC0C8'] },
        { type: 'linear', value: ['#ee9ca7', '#ffdde1'] },
        { type: 'linear', value: ['#2C3E50', '#FD746C'] },
    ];

    // Initialize UI
    initRadiusControl();
    initShadowControl(); // New
    initBlurControl(); // New
    initBackgroundGrid();
    initPaddingControls();
    initCanvasInteraction(); // New
    initKeyboardEvents(); // New
    initLocalization(); // New
    initMobileNav(); // New

    function initMobileNav() {
        const $btns = $('.nav-btn');
        const $sections = $('.tool-section');

        $btns.on('click', function () {
            const targetId = $(this).data('target');

            // Update Btns
            $btns.removeClass('active');
            $(this).addClass('active');

            // Update Sections
            // For mobile, this toggles visibility via CSS
            $sections.removeClass('active');
            $(`#${targetId}`).addClass('active');
        });
    }

    function saveState() {
        // Exclude blurRects AND shadow from state before saving (Privacy & User Preference)
        const { blurRects, shadow, ...stateToSave } = state;
        localStorage.setItem('pixlane_state', JSON.stringify(stateToSave));
    }

    function loadState() {
        const saved = localStorage.getItem('pixlane_state');
        if (!saved) return null;

        // Merge saved state with defaults to ensure new fields
        const parsed = JSON.parse(saved);
        // Explicitly reset blurRects to [] and shadow to false
        return { ...defaultState, ...parsed, blurRects: [], shadow: false };
    }

    function initLocalization() {
        const userLang = navigator.language || navigator.userLanguage;
        const isKorean = userLang.startsWith('ko');

        // Description
        const desc = isKorean
            ? "이미지/스크린샷의 코너를 둥글리고, 예쁜 배경을 넣고, 민감한 개인정보들을 흐리게 처리해서 저장합니다."
            : "Round the corners of images/screenshots, add beautiful backgrounds, blur sensitive personal information, and save them.";
        $('#app-desc').text(desc);

        // UI Labels
        if (isKorean) {
            $('#lbl-radius').text('코너 둥글리기');
            $('#lbl-shadow').text('그림자 효과');
            $('#lbl-padding').text('여백 넣기');
            $('#lbl-background').text('배경 패턴 선택');
            $('#lbl-blur').text('개인정보 가리기');
            $('#blur-help').text('이미지 위를 드래그해서 개인정보를 가리세요');

            // Nav
            $('#nav-lbl-radius').text('둥글기');
            $('#nav-lbl-padding').text('여백');
            $('#nav-lbl-background').text('배경');
            $('#nav-lbl-blur').text('가리기');
            $('#nav-lbl-save').text('저장');
        } else {
            $('#lbl-radius').text('Corner Radius');
            $('#lbl-shadow').text('Drop Shadow');
            $('#lbl-padding').text('Padding');
            $('#lbl-background').text('Background');
            $('#lbl-blur').text('Blur');
            $('#blur-help').text('Drag on the image to create a blur box.');

            // Nav
            $('#nav-lbl-radius').text('Radius');
            $('#nav-lbl-padding').text('Pad');
            $('#nav-lbl-background').text('BG');
            $('#nav-lbl-blur').text('Blur');
            $('#nav-lbl-save').text('Save');
        }
    }

    function initShadowControl() {
        const $toggle = $('#shadow-toggle');

        // Init UI
        $toggle.prop('checked', state.shadow);

        $toggle.on('change', function () {
            state.shadow = $(this).is(':checked');
            saveState();
            render();
        });
    }

    function initBlurControl() {
        const $btns = $('#blur-group button');

        // Init UI
        $btns.removeClass('active');
        $btns.filter(`[data-blur="${state.blurLevel}"]`).addClass('active');

        $btns.on('click', function () {
            $btns.removeClass('active');
            $(this).addClass('active');
            state.blurLevel = parseInt($(this).data('blur'));
            saveState();
            render();
        });

        $('#btn-clear-blur').on('click', function () {
            if (confirm('Clear all blur areas?')) {
                state.blurRects = [];
                interaction.activeRectIndex = -1;
                saveState();
                render();
            }
        });
    }

    function initKeyboardEvents() {
        $(document).on('keydown', function (e) {
            if ((e.key === 'Delete' || e.key === 'Backspace') && interaction.activeRectIndex !== -1) {
                state.blurRects.splice(interaction.activeRectIndex, 1);
                interaction.activeRectIndex = -1;
                interaction.mode = 'idle';
                saveState();
                render();
            }
        });
    }

    function initCanvasInteraction() {
        // We attach listeners to the canvas element
        const getPointerPos = (e) => {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            let clientX, clientY;

            if (e.type.startsWith('touch')) {
                const touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
                clientX = touch.clientX;
                clientY = touch.clientY;
            } else {
                clientX = e.clientX;
                clientY = e.clientY;
            }

            return {
                x: (clientX - rect.left) * scaleX,
                y: (clientY - rect.top) * scaleY
            };
        };

        const toImageSpace = (pos) => {
            return {
                x: pos.x - state.padding.left,
                y: pos.y - state.padding.top
            };
        };

        // Hit Test Handles
        const HANDLE_SIZE = 20; // Increased for touch
        const hitTestHandle = (rect, mx, my) => {
            // Rect coords in Canvas Space
            const x = rect.x + state.padding.left;
            const y = rect.y + state.padding.top;
            const w = rect.w;
            const h = rect.h;

            // Check 4 corners
            const corners = {
                'tl': { x: x, y: y },
                'tr': { x: x + w, y: y },
                'bl': { x: x, y: y + h },
                'br': { x: x + w, y: y + h }
            };

            for (const [key, c] of Object.entries(corners)) {
                if (mx >= c.x - HANDLE_SIZE && mx <= c.x + HANDLE_SIZE &&
                    my >= c.y - HANDLE_SIZE && my <= c.y + HANDLE_SIZE) {
                    return key;
                }
            }
            return null;
        };

        const hitTestRect = (rect, mx, my) => {
            const x = rect.x + state.padding.left;
            const y = rect.y + state.padding.top;
            return mx >= x && mx <= x + rect.w && my >= y && my <= y + rect.h;
        };

        const handleStart = function (e) {
            if (!imageLoaded) return;
            if (e.type === 'touchstart') e.preventDefault();

            const pos = getPointerPos(e);
            const imgPos = toImageSpace(pos);

            // 1. Check Handles of Active Rect
            if (interaction.activeRectIndex !== -1) {
                const rect = state.blurRects[interaction.activeRectIndex];
                const handle = hitTestHandle(rect, pos.x, pos.y);
                if (handle) {
                    interaction.mode = 'resizing';
                    interaction.resizeHandle = handle;
                    interaction.startPos = pos;
                    interaction.initialRect = { ...rect };
                    return;
                }
            }

            // 2. Check Hit on Existing Rects (Reverse order for topmost first)
            for (let i = state.blurRects.length - 1; i >= 0; i--) {
                if (hitTestRect(state.blurRects[i], pos.x, pos.y)) {
                    interaction.mode = 'moving';
                    interaction.activeRectIndex = i;
                    interaction.startPos = pos;
                    interaction.initialRect = { ...state.blurRects[i] };
                    render(); // Highlight selection
                    return;
                }
            }

            // 3. Start Creating New Rect
            interaction.mode = 'creating';
            interaction.startPos = imgPos;
            interaction.activeRectIndex = -1;
            render(); // Deselect
        };

        const handleMove = function (e) {
            if (!imageLoaded) return;
            if (e.type === 'touchmove') e.preventDefault();

            const pos = getPointerPos(e);

            // Cursor Update (Mouse only essentially, but harmless on touch)
            if (interaction.mode === 'idle') {
                let cursor = 'default';
                if (interaction.activeRectIndex !== -1) {
                    const rect = state.blurRects[interaction.activeRectIndex];
                    if (hitTestHandle(rect, pos.x, pos.y)) cursor = 'crosshair';
                }
                if (cursor === 'default') {
                    for (let i = state.blurRects.length - 1; i >= 0; i--) {
                        if (hitTestRect(state.blurRects[i], pos.x, pos.y)) {
                            cursor = 'move';
                            break;
                        }
                    }
                }
                $canvas.css('cursor', cursor);
                return;
            }

            // Creating
            if (interaction.mode === 'creating') {
                const imgPos = toImageSpace(pos);
                interaction.currentDragRect = {
                    x: Math.min(interaction.startPos.x, imgPos.x),
                    y: Math.min(interaction.startPos.y, imgPos.y),
                    w: Math.abs(imgPos.x - interaction.startPos.x),
                    h: Math.abs(imgPos.y - interaction.startPos.y)
                };
                render();
            }

            // Moving
            if (interaction.mode === 'moving') {
                const dx = pos.x - interaction.startPos.x;
                const dy = pos.y - interaction.startPos.y;
                const rect = state.blurRects[interaction.activeRectIndex];
                rect.x = interaction.initialRect.x + dx;
                rect.y = interaction.initialRect.y + dy;
                render();
            }

            // Resizing
            if (interaction.mode === 'resizing') {
                const dx = pos.x - interaction.startPos.x;
                const dy = pos.y - interaction.startPos.y;
                const init = interaction.initialRect;
                const rect = state.blurRects[interaction.activeRectIndex];
                const h = interaction.resizeHandle;

                if (h === 'br') { rect.w = init.w + dx; rect.h = init.h + dy; }
                if (h === 'bl') { rect.x = init.x + dx; rect.w = init.w - dx; rect.h = init.h + dy; }
                if (h === 'tr') { rect.y = init.y + dy; rect.w = init.w + dx; rect.h = init.h - dy; }
                if (h === 'tl') { rect.x = init.x + dx; rect.y = init.y + dy; rect.w = init.w - dx; rect.h = init.h - dy; }
                render();
            }
        };

        const handleEnd = function (e) {
            if (e.type === 'touchend') e.preventDefault();

            if (interaction.mode === 'creating') {
                if (interaction.currentDragRect && interaction.currentDragRect.w > 5 && interaction.currentDragRect.h > 5) {
                    state.blurRects.push(interaction.currentDragRect);
                    interaction.activeRectIndex = state.blurRects.length - 1;
                }
                interaction.currentDragRect = null;
                saveState();
            } else if (interaction.mode === 'moving' || interaction.mode === 'resizing') {
                const rect = state.blurRects[interaction.activeRectIndex];
                if (rect.w < 0) { rect.x += rect.w; rect.w = Math.abs(rect.w); }
                if (rect.h < 0) { rect.y += rect.h; rect.h = Math.abs(rect.h); }
                saveState();
            }
            interaction.mode = 'idle';
            interaction.resizeHandle = null;
            render();
        };

        $canvas.on('mousedown touchstart', handleStart);
        $canvas.on('mousemove touchmove', handleMove);
        $canvas.on('mouseup touchend', handleEnd);
    }

    function initRadiusControl() {
        const $btns = $('#radius-group button');

        // Set initial UI
        $btns.removeClass('active');
        $btns.filter(`[data-radius="${state.radius}"]`).addClass('active');

        $btns.on('click', function () {
            $btns.removeClass('active');
            $(this).addClass('active');
            state.radius = parseInt($(this).data('radius'));
            saveState();
            render();
        });
    }

    function initBackgroundGrid() {
        const $grid = $('#bg-grid');
        backgrounds.forEach((bg, index) => {
            const $thumb = $('<div>').addClass('bg-thumb');

            if (bg.type === 'transparent') {
                $thumb.addClass('transparent');
            } else if (bg.type === 'solid') {
                $thumb.css('background-color', bg.value);
            } else if (bg.type === 'linear') {
                const colors = bg.value.join(', ');
                $thumb.css('background-image', `linear-gradient(135deg, ${colors})`);
            }

            // Check if matches state
            const isMatch = JSON.stringify(bg.value) === JSON.stringify(state.background.value) && bg.type === state.background.type;
            if (isMatch) $thumb.addClass('active');

            $thumb.on('click', function () {
                $('.bg-thumb').removeClass('active');
                $(this).addClass('active');
                state.background = bg;
                saveState();
                render();
            });

            $grid.append($thumb);
        });
    }

    function initPaddingControls() {
        const $lock = $('#padding-lock');
        const sliders = {
            t: $('#pad-top'),
            b: $('#pad-bottom'),
            l: $('#pad-left'),
            r: $('#pad-right')
        };

        // Init UI values from state
        $lock.prop('checked', state.isPaddingLinked);
        sliders.t.val(state.padding.top);
        sliders.b.val(state.padding.bottom);
        sliders.l.val(state.padding.left);
        sliders.r.val(state.padding.right);

        // Link Toggle
        $lock.on('change', function () {
            state.isPaddingLinked = $(this).is(':checked');
            saveState();
        });

        // Sliders
        Object.entries(sliders).forEach(([key, $el]) => {
            $el.on('input', function () {
                const val = parseInt($(this).val());

                if (state.isPaddingLinked) {
                    // Update all state and UIs
                    state.padding.top = val;
                    state.padding.bottom = val;
                    state.padding.left = val;
                    state.padding.right = val;
                    Object.values(sliders).forEach($s => $s.val(val));
                } else {
                    // Update specific
                    if (key === 't') state.padding.top = val;
                    if (key === 'b') state.padding.bottom = val;
                    if (key === 'l') state.padding.left = val;
                    if (key === 'r') state.padding.right = val;
                }
                saveState();
                render();
            });
        });
    }


    // Drag & Drop Events
    $canvasArea.on('dragenter dragover', function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (!imageLoaded) {
            $canvasArea.addClass('drag-over');
        }
    });

    $canvasArea.on('dragleave drop', function (e) {
        e.preventDefault();
        e.stopPropagation();
        $canvasArea.removeClass('drag-over');
    });

    $canvasArea.on('drop', function (e) {
        if (imageLoaded) return; // Block if already loaded

        const files = e.originalEvent.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });

    // Click to Upload
    $canvasArea.on('click', function () {
        if (imageLoaded) return; // Block if already loaded
        $fileInput.click();
    });

    $fileInput.on('change', function (e) {
        if (this.files.length > 0) {
            handleFile(this.files[0]);
        }
    });

    // Save Logic
    $('.btn-save').on('click', function (e) {
        e.preventDefault();
        if (!imageLoaded) return;

        const format = $(this).data('format');
        const quality = parseFloat($(this).data('quality')) || undefined;

        saveCanvas(format, quality);
    });

    function saveCanvas(format, quality) {
        // Render without UI Artifacts
        render(true);

        // Create download link
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const ext = format === 'image/jpeg' ? 'jpg' : 'png';

        link.download = `pixlane-${timestamp}.${ext}`;
        link.href = canvas.toDataURL(format, quality);

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Restore UI (with handles)
        render(false);
    }

    // Reset Button
    $('#btn-reset').on('click', function () {
        if (!imageLoaded) return;

        if (confirm('Are you sure you want to reset? current work will be lost.')) {
            resetCanvas();
        }
    });

    function resetCanvas() {
        canvas.width = 0;
        canvas.height = 0;
        $canvas.hide();
        $placeholder.show();
        $fileInput.val(''); // Reset input
        imageLoaded = false;
        originalImage = null;
        $('#btn-reset').prop('disabled', true);
        $('#btn-save-dropdown').prop('disabled', true); // Disable Save

        // Reset controls? Maybe keep them.
    }

    function handleFile(file) {
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file.');
            return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            const img = new Image();
            img.onload = function () {
                originalImage = img;
                imageLoaded = true;
                $('#btn-reset').prop('disabled', false);
                $('#btn-save-dropdown').prop('disabled', false); // Enable Save

                // Reset padding sliders to 0 or keep? 
                render();

                // Show canvas, hide placeholder
                $canvas.show();
                $placeholder.hide();
            }
            img.src = e.target.result;
        }
        reader.readAsDataURL(file);
    }

    function render(isExport = false) {
        if (!originalImage) return;

        const p = state.padding;
        const w = originalImage.width;
        const h = originalImage.height;

        // Resize Canvas
        canvas.width = w + p.left + p.right;
        canvas.height = h + p.top + p.bottom;

        // Draw Background
        const bg = state.background;
        if (bg.type === 'transparent') {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        } else if (bg.type === 'solid') {
            ctx.fillStyle = bg.value;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else if (bg.type === 'linear') {
            // Gradient from Top-Left to Bottom-Right
            const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            const colors = bg.value;
            colors.forEach((color, i) => {
                grad.addColorStop(i / (colors.length - 1), color);
            });
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Draw Drop Shadow
        if (state.shadow) {
            ctx.save();
            ctx.beginPath();
            if (ctx.roundRect) {
                ctx.roundRect(p.left, p.top, w, h, state.radius);
            } else {
                ctx.rect(p.left, p.top, w, h);
            }
            ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
            ctx.shadowBlur = 20;
            ctx.shadowOffsetY = 10;
            ctx.fillStyle = 'rgba(0,0,0,1)';
            ctx.fill();
            ctx.restore();
        }

        // Draw Main Content (Image + Blurs) clipped by radius
        ctx.save();

        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(p.left, p.top, w, h, state.radius);
        } else {
            ctx.rect(p.left, p.top, w, h);
        }
        ctx.closePath();
        ctx.clip();

        // 1. Draw Original Image
        ctx.drawImage(originalImage, p.left, p.top);

        // 2. Draw Blur Rects
        state.blurRects.forEach(rect => {
            if (state.blurLevel > 0) {
                ctx.save();
                ctx.beginPath();
                ctx.rect(p.left + rect.x, p.top + rect.y, rect.w, rect.h);
                ctx.clip();

                // Draw blurred version of the image
                if (ctx.filter !== undefined) {
                    ctx.filter = `blur(${state.blurLevel}px)`;
                    ctx.drawImage(originalImage, p.left, p.top);
                } else {
                    // Fallback for no filter support (e.g. some mobile browsers)
                    // Draw semi-transparent overlay
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                    ctx.fillRect(p.left + rect.x, p.top + rect.y, rect.w, rect.h);
                }
                ctx.restore();
            }
        });

        // 3. Draw Creating Rect (Visual only)
        if (interaction.mode === 'creating' && interaction.currentDragRect) {
            const r = interaction.currentDragRect;
            if (state.blurLevel > 0) {
                ctx.save();
                ctx.beginPath();
                ctx.rect(p.left + r.x, p.top + r.y, r.w, r.h);
                ctx.clip();
                if (ctx.filter !== undefined) {
                    ctx.filter = `blur(${state.blurLevel}px)`;
                    ctx.drawImage(originalImage, p.left, p.top);
                } else {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                    ctx.fillRect(p.left + r.x, p.top + r.y, r.w, r.h);
                }
                ctx.restore();
            }
            // Outline
            ctx.strokeStyle = '#rgba(255,255,255,0.8)';
            ctx.lineWidth = 1;
            ctx.strokeRect(p.left + r.x, p.top + r.y, r.w, r.h);
        }

        ctx.restore(); // End Radius Clip

        // Draw UI Interaction (Selection, Handles) - ONLY IF NOT EXPORTING
        if (!isExport) {
            // Active selection
            if (interaction.activeRectIndex !== -1) {
                const rect = state.blurRects[interaction.activeRectIndex];
                const absX = p.left + rect.x;
                const absY = p.top + rect.y;

                ctx.strokeStyle = '#00FFFF';
                ctx.lineWidth = 2;
                ctx.strokeRect(absX, absY, rect.w, rect.h);

                // Handles
                ctx.fillStyle = '#00FFFF';
                const corners = [
                    { x: absX, y: absY }, // tl
                    { x: absX + rect.w, y: absY }, // tr
                    { x: absX, y: absY + rect.h }, // bl
                    { x: absX + rect.w, y: absY + rect.h } // br
                ];
                const HS = 10;
                corners.forEach(c => {
                    ctx.fillRect(c.x - HS / 2, c.y - HS / 2, HS, HS);
                });
            }
        }
    }


});
