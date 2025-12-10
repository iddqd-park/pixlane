$(document).ready(function () {
    const $canvasArea = $('#canvas-area');
    const $fileInput = $('#file-input');
    const $canvas = $('#main-canvas');
    const canvas = $canvas[0];
    const ctx = canvas.getContext('2d');
    const $placeholder = $('#canvas-placeholder');

    let imageLoaded = false;

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
        $('#btn-reset').prop('disabled', true);
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
                // Set canvas size to original image size
                canvas.width = img.width;
                canvas.height = img.height;

                // Draw image
                ctx.drawImage(img, 0, 0);

                // Show canvas, hide placeholder
                $canvas.show();
                $placeholder.hide();

                imageLoaded = true;
                $('#btn-reset').prop('disabled', false);
            }
            img.src = e.target.result;
        }
        reader.readAsDataURL(file);
    }
});
