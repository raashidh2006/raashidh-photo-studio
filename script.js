const upload = document.getElementById('upload');
const canvas = document.getElementById('imageCanvas');
const ctx = canvas.getContext('2d');
const downloadBtn = document.getElementById('download');

// Control Sliders
const brightness = document.getElementById('brightness');
const contrast = document.getElementById('contrast');
const grayscale = document.getElementById('grayscale');
const blur = document.getElementById('blur');

let img = new Image();

// Handle Image Upload
upload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
});

// Setup Canvas when Image Loads
img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;
    resetSliders();
    applyFilters();
    downloadBtn.disabled = false;
};

// Apply all filters combined
function applyFilters() {
    if (!img.src) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Build the CSS filter string
    ctx.filter = `
        brightness(${brightness.value}%) 
        contrast(${contrast.value}%) 
        grayscale(${grayscale.value}%)
        blur(${blur.value}px)
    `;

    // Draw the image with filters applied
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
}

// Add event listeners to all sliders
[brightness, contrast, grayscale, blur].forEach(slider => {
    slider.addEventListener('input', applyFilters);
});

function resetSliders() {
    brightness.value = 100;
    contrast.value = 100;
    grayscale.value = 0;
    blur.value = 0;
}

// Handle Image Download
downloadBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'enhanced-image.png';
    link.href = canvas.toDataURL();
    link.click();
});