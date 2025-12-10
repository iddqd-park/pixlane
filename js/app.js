$(document).ready(function () {
    const $canvasArea = $('#canvas-area');
    const $fileInput = $('#file-input');
    const $canvas = $('#main-canvas');
    const canvas = $canvas[0];
    const ctx = canvas.getContext('2d');
    const $placeholder = $('#canvas-placeholder');

    let imageLoaded = false;
    let originalImage = null;

    // State
    const state = {
        padding: { top: 0, bottom: 0, left: 0, right: 0 },
        background: { type: 'transparent' }, // { type: 'solid'|'gradient'|'transparent', value: ... }
        isPaddingLinked: true
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
        // Quad/Mesh-like Gradients (Simulated with Diagonal Linear for now or CSS)
        // For canvas drawing we need 2d gradients. We'll use simple Linear for "Quad" as placeholder or 
        // implement a drawGradient helper that does multiple passes.
        // Let's use more complex Linear gradients as placeholders for "Quad" variety
        { type: 'linear', value: ['#00F260', '#0575E6'] },
        { type: 'linear', value: ['#e1eec3', '#f05053'] },
        { type: 'linear', value: ['#7F00FF', '#E100FF'] },
        { type: 'linear', value: ['#659999', '#f4791f'] },
        { type: 'linear', value: ['#C33764', '#1D2671'] },
        { type: 'linear', value: ['#FEAC5E', '#C779D0', '#4BC0C8'] },
        { type: 'linear', value: ['#ee9ca7', '#ffdde1'] },
        { type: 'linear', value: ['#2C3E50', '#FD746C'] },
    ];

    // Initialize UI
    initBackgroundGrid();
    initPaddingControls();

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

            if (index === 0) $thumb.addClass('active');

            $thumb.on('click', function () {
                $('.bg-thumb').removeClass('active');
                $(this).addClass('active');
                state.background = bg;
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

        // Link Toggle
        $lock.on('change', function () {
            state.isPaddingLinked = $(this).is(':checked');
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

                // Reset padding sliders to 0 or keep? 
                // Let's keep them if user set them before, or reset to 0. Usually reset to 0 for new image.
                // But user might want to reuse settings. Let's keep current state values for now but render applies them.
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

        // Draw Image
        ctx.drawImage(originalImage, p.left, p.top);
    }
});
