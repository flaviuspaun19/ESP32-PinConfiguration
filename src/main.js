import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const CONFIG = {
    HIGHLIGHT_COLOR: 0xffffff,
    HIGHLIGHT_EMISSIVE_INTENSITY: 0.5,
    PULSE_BASE: 0.3,
    PULSE_AMPLITUDE: 0.2,
    PULSE_SPEED: 0.005,
    SELECTED_COLOR: 0x22c55e,
    MODEL_PATH: '/models/esp32.glb',
    MODEL_SCALE: 20,
};

const PIN_FUNCTIONS = {
    11: ["GPIO", "PWM"], 10: ["GPIO", "PWM"], 9: ["GPIO", "PWM"],
    13: ["GPIO", "PWM", "ADC"], 12: ["GPIO", "PWM", "ADC"], 14: ["GPIO", "PWM", "ADC"],
    27: ["GPIO", "PWM", "ADC"], 26: ["GPIO", "PWM", "ADC", "DAC"], 25: ["GPIO", "PWM", "ADC", "DAC"],
    33: ["GPIO", "PWM", "ADC"], 32: ["GPIO", "PWM", "ADC"],
    35: ["ADC"], 34: ["ADC"], 39: ["ADC"], 36: ["ADC"],
    6: ["GPIO", "PWM"], 7: ["GPIO", "PWM"], 8: ["GPIO", "PWM"],
    15: ["GPIO", "PWM", "ADC"], 2: ["GPIO", "PWM", "ADC"], 0: ["GPIO", "PWM", "ADC"], 4: ["GPIO", "PWM", "ADC"],
    16: ["GPIO", "PWM"], 17: ["GPIO", "PWM"], 5: ["GPIO", "PWM"], 18: ["GPIO", "PWM"], 19: ["GPIO", "PWM"],
    21: ["GPIO", "PWM"], 3: ["GPIO", "PWM"], 1: ["GPIO", "PWM"], 22: ["GPIO", "PWM"], 23: ["GPIO", "PWM"]
};

const SELECTABLE_PINS = [
    'GPIO36', 'GPIO39', 'GPIO34', 'GPIO35', 'GPIO32', 'GPIO33', 'GPIO25',
    'GPIO26', 'GPIO27', 'GPIO14', 'GPIO12', 'GPIO13', 'GPIO23', 'GPIO22', 'GPIO1',
    'GPIO3', 'GPIO21', 'GPIO19', 'GPIO18', 'GPIO5', 'GPIO17', 'GPIO16', 'GPIO4',
    'GPIO0', 'GPIO2', 'GPIO15', 'GPIO8', 'GPIO7', 'GPIO6', 'GPIO11',
    'GPIO10', 'GPIO9'
];

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(4.75, window.innerWidth / window.innerHeight, 1, 1000);
camera.position.set(0, 0, 130);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.domElement.id = 'three-canvas';
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputEncoding = THREE.sRGBEncoding;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.update();

const ambientLight = new THREE.AmbientLight(0xc4e1ff, 0.4);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
directionalLight.position.set(10, 10, 7);
scene.add(directionalLight);

const pointLight = new THREE.PointLight(0xffffff, 0.3, 100);
pointLight.position.set(-10, 5, 15);
scene.add(pointLight);

const state = {
    selectablePins: [],
    selectedPin: null,
    highlightedPin: null,
    pinData: {},
    boardMesh: null,
    originalBoardColor: null,
};

function loadPinDataFromLocalStorage() {
    try {
        const serializedData = localStorage.getItem('esp32PinConfig');
        if (serializedData === null) {
            console.log("No saved data found in localStorage.");
            return;
        }

        state.pinData = JSON.parse(serializedData);
        console.log("Pin data loaded from localStorage.");

    } catch (e) {
        console.error("Could not load pin data from localStorage:", e);
    }
}

function savePinDataToLocalStorage() {
    try {
        const serializedData = JSON.stringify(state.pinData);
        localStorage.setItem('esp32PinConfig', serializedData);
        console.log("Pin data saved to localStorage.");
    } catch (e) {
        console.error("Could not save pin data to localStorage:", e);
    }
}

loadPinDataFromLocalStorage();

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function loadModel() {
    const loader = new GLTFLoader();
    loader.load(CONFIG.MODEL_PATH, (gltf) => {
        const model = gltf.scene;
        model.scale.set(CONFIG.MODEL_SCALE, CONFIG.MODEL_SCALE, CONFIG.MODEL_SCALE);

        model.rotation.x = Math.PI / 2;
        model.rotation.y = Math.PI / 2;

        const boundingBox = new THREE.Box3().setFromObject(model);
        const center = new THREE.Vector3();
        boundingBox.getCenter(center);
        model.position.sub(center);

        model.traverse((child) => {
            if (child.isMesh) {
                if (SELECTABLE_PINS.includes(child.name)) {
                    state.selectablePins.push(child);
                    const gpioMatch = child.name.match(/\d+/);
                    const gpioNumber = gpioMatch ? parseInt(gpioMatch[0]) : child.name;

                    child.userData = {
                        originalMaterial: child.material.clone(),
                        gpio: gpioNumber,
                    };

                    child.material.emissive.setHex(0x000000);
                    child.material.emissiveIntensity = 0;

                    if (!state.pinData[child.name]) {
                        state.pinData[child.name] = {
                            name: child.name,
                            gpio: gpioNumber,
                            mode: 'unset',
                            config: {},
                        };
                    }
                }
            }
        });
        scene.add(model);
    });
}

function deselectAllPins() {
    state.selectablePins.forEach(pin => {
        if (pin.name !== state.selectedPin) {
            pin.material = pin.userData.originalMaterial.clone();
            pin.material.emissiveIntensity = 0;
        }
    });
}

function onPinHover(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(state.selectablePins, true);

    if (intersects.length > 0) {
        const hoveredPin = intersects[0].object;
        if (state.highlightedPin !== hoveredPin.name && hoveredPin.name !== state.selectedPin) {
            deselectAllPins();
            state.highlightedPin = hoveredPin.name;
            hoveredPin.material.color.setHex(CONFIG.HIGHLIGHT_COLOR);
            hoveredPin.material.emissive.setHex(CONFIG.HIGHLIGHT_COLOR);
        }
    } else {
        if (state.highlightedPin) {
            deselectAllPins();
            state.highlightedPin = null;
        }
    }
}

function onPinClick(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(state.selectablePins, true);

    if (intersects.length > 0) {
        const clickedPin = intersects[0].object;
        deselectAllPins();

        state.selectedPin = clickedPin.name;

        clickedPin.material.color.setHex(CONFIG.SELECTED_COLOR);
        clickedPin.material.emissive.setHex(CONFIG.SELECTED_COLOR);
        clickedPin.material.emissiveIntensity = 0.5;

        updatePinUI(clickedPin);
    } else {
        if (state.selectedPin) {
            const pin = state.selectablePins.find(p => p.name === state.selectedPin);
            if (pin) {
                pin.material = pin.userData.originalMaterial.clone();
            }
            state.selectedPin = null;
        }
        document.getElementById('dashboard').style.display = 'none';
    }
}

function updatePinUI(pin) {
    const pinName = pin.userData.gpio;
    let displayName = pinName.toString().toUpperCase();

    if (!isNaN(parseInt(pinName))) {
        displayName = `GPIO${pinName}`;
    }

    document.getElementById('pinName').textContent = displayName;

    const functionSelect = document.getElementById("functionSelect");
    functionSelect.innerHTML = "";
    (PIN_FUNCTIONS[pinName] || []).forEach(func => {
        const opt = document.createElement("option");
        opt.value = func;
        opt.textContent = func;
        functionSelect.appendChild(opt);
    });

    const savedPinData = state.pinData[pin.name];
    if (savedPinData) {
        const modeRadio = document.querySelector(`input[name="mode"][value="${savedPinData.mode}"]`);
        if (modeRadio) modeRadio.checked = true;

        const funcSelect = document.getElementById("functionSelect");
        if (funcSelect) funcSelect.value = savedPinData.function || "GPIO";
    }

    document.getElementById('configArea').innerHTML = '';
    document.getElementById('dashboard').style.display = 'block';

    const defaultMode = document.querySelector('input[name="mode"][value="input"]');
    if (defaultMode) defaultMode.checked = true;

    const defaultFunction = document.getElementById("functionSelect");
    if (defaultFunction) defaultFunction.value = "GPIO";

    updateConfigArea();
}
function updateConfigArea() {
    const functionValue = document.getElementById("functionSelect").value;
    const modeValue = document.querySelector('input[name="mode"]:checked')?.value;
    const configDiv = document.getElementById("configArea");
    configDiv.innerHTML = "";

    let configHTML = '';
    if (functionValue === "GPIO") {
        configHTML = modeValue === "output"
            ? '<div class="action-button-group"><button class="action-button" name="digitalWriteLow">LOW</button><button class="action-button" name="digitalWriteHigh">HIGH</button></div>'
            : '<button class="action-button" name="digitalRead">Read Value</button>';
    } else if (functionValue === "PWM") {
        configHTML = `
            <label>Frequency: <input type="number" name="frequency" value="1000"></label>
            <label>Duty: <input type="number" name="duty" value="50"></label>
            <label>Phase Shift: <input type="number" name="phase" value="360"</label>
            <label>Deadband: <input type="number" name="deadband" value="0"></label>
        `;
    } else if (functionValue === "ADC") {
        configHTML = '<button class="action-button" name="readADC">Read Data</button>';
    } else if (functionValue === "DAC") {
        configHTML = '<label>Output Value: <input type="number" name="dacValue" value="0"></label>';
    }
    configDiv.innerHTML = configHTML;

    const savedPinData = state.pinData[state.selectedPin];
    if (savedPinData && savedPinData.config) {
        for (const key in savedPinData.config) {
            const input = document.querySelector(`#configArea input[name="${key}"]`);
            if (input) {
                input.value = savedPinData.config[key];
            }
        }
    }
}

function savePinMode() {
    if (!state.selectedPin) return;

    const pin = state.selectablePins.find(p => p.name === state.selectedPin);
    const pinName = pin?.userData.gpio;

    if (pinName !== undefined) {
        state.pinData[state.selectedPin].mode = document.querySelector('input[name="mode"]:checked')?.value || 'unset';
        state.pinData[state.selectedPin].function = document.getElementById("functionSelect").value;
        state.pinData[state.selectedPin].config = {};

        document.querySelectorAll("#configArea input").forEach(input => {
            state.pinData[state.selectedPin].config[input.name] = input.value;
        });

        if (pin) {
            pin.material = pin.userData.originalMaterial.clone();
        }

        console.log("Saved Config:", state.pinData[state.selectedPin]);
        document.getElementById('dashboard').style.display = 'none';
        state.selectedPin = null;

        savePinDataToLocalStorage();
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

renderer.domElement.addEventListener('mousemove', onPinHover);
renderer.domElement.addEventListener('click', onPinClick);

window.addEventListener('resize', onWindowResize);
document.getElementById("functionSelect").addEventListener("change", updateConfigArea);
document.querySelectorAll('input[name="mode"]').forEach(radio => {
    radio.addEventListener('change', updateConfigArea);
});
document.getElementById('savePinMode').addEventListener('click', savePinMode);

function animate() {
    requestAnimationFrame(animate);

    if (state.highlightedPin && state.highlightedPin !== state.selectedPin) {
        const pin = state.selectablePins.find(p => p.name === state.highlightedPin);
        if (pin) {
            pin.material.emissiveIntensity = CONFIG.PULSE_BASE + Math.sin(Date.now() * CONFIG.PULSE_SPEED) * CONFIG.PULSE_AMPLITUDE;
        }
    } else if (state.selectedPin) {
        const pin = state.selectablePins.find(p => p.name === state.selectedPin);
        if (pin) {
            pin.material.emissiveIntensity = CONFIG.PULSE_BASE + Math.sin(Date.now() * CONFIG.PULSE_SPEED) * CONFIG.PULSE_AMPLITUDE;
        }
    }

    controls.update();
    renderer.render(scene, camera);
}

loadModel();
animate();