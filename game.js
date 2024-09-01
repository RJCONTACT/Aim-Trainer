// Set up the scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Room setup
const roomGeometry = new THREE.BoxGeometry(10, 10, 10);
const roomMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff, side: THREE.BackSide });
const room = new THREE.Mesh(roomGeometry, roomMaterial);
scene.add(room);

// Orb setup
let orb;
const orbGeometry = new THREE.SphereGeometry(0.5, 32, 32);
const orbMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });

// Load the destruction sound
const destroySound = new Audio('destroy.mp3');

// Function to play the sound
function playDestroySound() {
    destroySound.play();
}

// Position the camera inside the room
camera.position.z = 15;  // Adjusted camera position for better visibility

// Raycaster setup for click detection
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Accuracy tracking variables
let totalClicks = 0;
let successfulHits = 0;
let gameActive = false;  // Flag to control game state
let timerInterval;  // Interval ID for the timer

// Update the accuracy display function
function updateAccuracyDisplay() {
    const accuracyDisplay = document.getElementById('accuracyDisplay');
    accuracyDisplay.innerText = `${successfulHits} / ${totalClicks}`;
}

function spawnOrb() {
    if (orb) scene.remove(orb);
    const x = (Math.random() - 0.5) * 8;
    const y = (Math.random() - 0.5) * 8;
    const z = (Math.random() - 0.5) * 8;
    orb = new THREE.Mesh(orbGeometry, orbMaterial);
    orb.position.set(x, y, z);
    scene.add(orb);
}

function onMouseClick(event) {
    if (!gameActive) return;  // Only register clicks when the game is active

    totalClicks++;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObject(orb);
    if (intersects.length > 0) {
        successfulHits++;
        playDestroySound();  // Play the sound on orb destruction
        spawnOrb();
    }

    updateAccuracyDisplay();
}

// Timer and Game Controls
function startGame() {
    const timeLimit = parseInt(document.getElementById('timerInput').value, 10);
    let timeRemaining = timeLimit;

    gameActive = true;
    totalClicks = 0;
    successfulHits = 0;
    updateAccuracyDisplay();
    document.getElementById('timeRemaining').innerText = `Time Remaining: ${timeRemaining}s`;
    
    spawnOrb();
    updateTimerDisplay(timeRemaining);

    timerInterval = setInterval(() => {
        timeRemaining--;
        if (timeRemaining <= 0) {
            stopGame();
        } else {
            updateTimerDisplay(timeRemaining);
        }
    }, 1000);

    document.getElementById('startButton').disabled = true;
    document.getElementById('stopButton').disabled = false;
}

function stopGame() {
    clearInterval(timerInterval);
    gameActive = false;
    document.getElementById('timeRemaining').innerText = `Time's up!`;
    document.getElementById('startButton').disabled = false;
    document.getElementById('stopButton').disabled = true;
}

function updateTimerDisplay(timeRemaining) {
    document.getElementById('timeRemaining').innerText = `Time Remaining: ${timeRemaining}s`;
}

document.getElementById('startButton').addEventListener('click', startGame);
document.getElementById('stopButton').addEventListener('click', stopGame);

// Color controls
document.getElementById('roomColor').addEventListener('input', (event) => {
    roomMaterial.color.set(event.target.value);
});

document.getElementById('orbColor').addEventListener('input', (event) => {
    orbMaterial.color.set(event.target.value);
});

// Handle orb texture upload
const orbTextureInput = document.getElementById('orbTextureInput');
orbTextureInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const orbTextureData = e.target.result;
        applyOrbTexture(orbTextureData);  // Apply the image texture to the orb
        spawnOrb();  // Respawn orb to apply changes
    };
    reader.readAsDataURL(file);
});

// Handle removal of orb texture
const removeOrbTextureButton = document.getElementById('removeOrbTextureButton');
removeOrbTextureButton.addEventListener('click', () => {
    removeOrbTexture();  // Remove the texture from the orb
    spawnOrb();  // Respawn orb to apply changes
});

// Handle background image upload
const bgImageInput = document.getElementById('bgImageInput');
bgImageInput.addEventListener('change', handleBgImageUpload);

function handleBgImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const bgImageData = e.target.result;
        localStorage.setItem('bgImageData', bgImageData);  // Save the image data to local storage
        setBackgroundTexture(bgImageData);
    };
    reader.readAsDataURL(file);
}

function setBackgroundTexture(imageData) {
    const loader = new THREE.TextureLoader();
    loader.load(imageData, (texture) => {
        roomMaterial.map = texture;
        roomMaterial.needsUpdate = true;
    });
}

// Load background image from local storage on page load
window.addEventListener('load', () => {
    const savedBgImageData = localStorage.getItem('bgImageData');
    if (savedBgImageData) {
        setBackgroundTexture(savedBgImageData);
    }
});

// Handle removal of background image
const removeBgImageButton = document.getElementById('removeBgImageButton');
removeBgImageButton.addEventListener('click', () => {
    removeBackgroundImage();  // Remove the background image
});

function removeBackgroundImage() {
    roomMaterial.map = null;
    roomMaterial.needsUpdate = true;
}

// Apply orb texture
function applyOrbTexture(textureData) {
    const loader = new THREE.TextureLoader();
    loader.load(textureData, (texture) => {
        orbMaterial.map = texture;
        orbMaterial.needsUpdate = true;
    });
}

// Remove orb texture
function removeOrbTexture() {
    orbMaterial.map = null;
    orbMaterial.needsUpdate = true;
}

// Settings pop-up logic
const settingsPopup = document.getElementById('settingsPopup');
const settingsButton = document.getElementById('settingsButton');

settingsButton.addEventListener('click', () => {
    settingsPopup.style.display = (settingsPopup.style.display === 'block') ? 'none' : 'block';
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

animate();

// Mouse click event listener
window.addEventListener('click', onMouseClick);
