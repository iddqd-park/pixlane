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
        isPaddingLinked: true
    };

    // State - Try to load from local storage
    let state = loadState() || defaultState;

    function saveState() {
        localStorage.setItem('pixlane_state', JSON.stringify(state));
    }

    function loadState() {
        const saved = localStorage.getItem('pixlane_state');
        return saved ? JSON.parse(saved) : null;
    }

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
    initBackgroundGrid();
    initPaddingControls();

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
        // Create download link
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const ext = format === 'image/jpeg' ? 'jpg' : 'png';

        link.download = `pixlane-${timestamp}.${ext}`;
        link.href = canvas.toDataURL(format, quality);

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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

    function render() {
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

        // Draw Image with Rounded Corners
        ctx.save();

        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(p.left, p.top, w, h, state.radius);
        } else {
            // Fallback for older browsers
            // Just simple rect if no roundRect support
            ctx.rect(p.left, p.top, w, h);
        }
        ctx.closePath();
        ctx.clip();

        ctx.drawImage(originalImage, p.left, p.top);

        ctx.restore();
    }
});
