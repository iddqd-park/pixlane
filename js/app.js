$(document).ready(function () {
    const $canvasArea = $('#canvas-area');
    const $fileInput = $('#file-input');
    const $canvas = $('#main-canvas');
    const canvas = $canvas[0];
    const ctx = canvas.getContext('2d');
    const $placeholder = $('#canvas-placeholder');

    // Drag & Drop Events
    $canvasArea.on('dragenter dragover', function (e) {
        e.preventDefault();
        e.stopPropagation();
        $canvasArea.addClass('drag-over');
    });

    $canvasArea.on('dragleave drop', function (e) {
        e.preventDefault();
        e.stopPropagation();
        $canvasArea.removeClass('drag-over');
    });

    $canvasArea.on('drop', function (e) {
        const files = e.originalEvent.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });

    // Click to Upload
    $canvasArea.on('click', function () {
        $fileInput.click();
    });

    $fileInput.on('change', function (e) {
        if (this.files.length > 0) {
            handleFile(this.files[0]);
        }
    });

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
            }
            img.src = e.target.result;
        }
        reader.readAsDataURL(file);
    }
});
