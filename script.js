  const upload = document.getElementById('upload');
const pipUpload = document.getElementById('pipUpload');
const pipLabel = document.getElementById('pipLabel');
const cropBtn = document.getElementById('cropBtn');
const downloadBtn = document.getElementById('download');
const canvas = document.getElementById('imageCanvas');
const ctx = canvas.getContext('2d');

// Adjustment Sliders
const brightness = document.getElementById('brightness');
const contrast = document.getElementById('contrast');
const grayscale = document.getElementById('grayscale');
const blur = document.getElementById('blur');

// PiP Control Items
const pipControls = document.getElementById('pipControls');
const pipScale = document.getElementById('pipScale');

let baseImg = new Image();
let pipImg = null;

// Operational States
let isDrawingCrop = false;
let isDraggingPip = false;
let startX, startY;
let cropX, cropY, cropWidth, cropHeight;

// PiP Settings
let pipX = 20, pipY = 20; 
let currentPipWidth = 0, currentPipHeight = 0;

// Setup Main Image Upload
upload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        baseImg.src = event.target.result;
    };
    reader.readAsDataURL(file);
});

baseImg.onload = () => {
    canvas.width = baseImg.width;
    canvas.height = baseImg.height;
    
    // Clear old PiP sessions if a new base image drops
    pipImg = null;
    pipControls.classList.add('hidden');
    pipUpload.disabled = false;
    pipLabel.classList.remove('disabled');
    cropBtn.disabled = false;
    downloadBtn.disabled = false;
    
    render();
};

// Setup PiP Image Upload
pipUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        pipImg = new Image();
        pipImg.src = event.target.result;
        pipImg.onload = () => {
            pipControls.classList.remove('hidden');
            calculatePipDimensions();
            render();
        };
    };
    reader.readAsDataURL(file);
});

function calculatePipDimensions() {
    if (!pipImg) return;
    const percentage = pipScale.value / 100;
    currentPipWidth = canvas.width * percentage;
    currentPipHeight = (pipImg.height / pipImg.width) * currentPipWidth;
}

pipScale.addEventListener('input', () => {
    calculatePipDimensions();
    render();
});

// Canvas Draw Loop
function render() {
    if (!baseImg.src) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply the structural sliders dynamically
    ctx.filter = `
        brightness(${brightness.value}%) 
        contrast(${contrast.value}%) 
        grayscale(${grayscale.value}%)
        blur(${blur.value}px)
    `;

    // Process base layout
    ctx.drawImage(baseImg, 0, 0, canvas.width, canvas.height);
    
    // Break rendering stack out of parent canvas filters to keep overlay original color
    ctx.filter = 'none';

    // Mount Overlay if loaded
    if (pipImg) {
        ctx.drawImage(pipImg, pipX, pipY, currentPipWidth, currentPipHeight);
    }

    // Render local tracing coordinates box if user is actively clicking & dragging
    if (isDrawingCrop) {
        ctx.strokeStyle = '#e91e63';
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 6]);
        ctx.strokeRect(cropX, cropY, cropWidth, cropHeight);
        ctx.setLineDash([]);
    }
}

[brightness, contrast, grayscale, blur].forEach(slider => {
    slider.addEventListener('input', render);
});

// Normalize UI Window space mouse positions into true internal Canvas pixels
function getCanvasCoordinates(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
    };
}

// Canvas Interaction Logic
canvas.addEventListener('mousedown', (e) => {
    if (!baseImg.src) return;
    const coords = getCanvasCoordinates(e);
    startX = coords.x;
    startY = coords.y;

    // Check if target coordinates fall inside active PiP frame
    if (pipImg && 
        startX >= pipX && startX <= pipX + currentPipWidth &&
        startY >= pipY && startY <= pipY + currentPipHeight) {
        isDraggingPip = true;
    } else {
        isDrawingCrop = true;
        cropX = startX;
        cropY = startY;
        cropWidth = 0;
        cropHeight = 0;
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (!isDrawingCrop && !isDraggingPip) return;
    const coords = getCanvasCoordinates(e);

    if (isDraggingPip) {
        pipX = coords.x - (currentPipWidth / 2);
        pipY = coords.y - (currentPipHeight / 2);
    } else if (isDrawingCrop) {
        cropWidth = coords.x - startX;
        cropHeight = coords.y - startY;
    }
    render();
});

canvas.addEventListener('mouseup', () => {
    isDraggingPip = false;
    if (isDrawingCrop) {
        isDrawingCrop = false;
        // Compensate mapping if bounding frame was drawn right-to-left
        if (cropWidth < 0) { cropX += cropWidth; cropWidth = Math.abs(cropWidth); }
        if (cropHeight < 0) { cropY += cropHeight; cropHeight = Math.abs(cropHeight); }
    }
});

// Run Crop Processing
cropBtn.addEventListener('click', () => {
    if (!cropWidth || !cropHeight) {
        alert("Click and drag a box across the image first to frame a crop area!");
        return;
    }

    const croppedData = ctx.getImageData(cropX, cropY, cropWidth, cropHeight);

    canvas.width = cropWidth;
    canvas.height = cropHeight;
    ctx.putImageData(croppedData, 0, 0);

    baseImg = new Image();
    baseImg.src = canvas.toDataURL();
    
    cropWidth = 0; cropHeight = 0;
    if(pipImg) { calculatePipDimensions(); }
});

// Run Output Generation 
downloadBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'edited-photo.png';
    link.href = canvas.toDataURL();
    link.click();
});
