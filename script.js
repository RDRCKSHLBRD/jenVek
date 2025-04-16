// ====================== SVG Generator by jenVek v2 =========================
// Refactored script with enhanced controls, patterns, and features.

// ====================== Global State ======================
const state = {
    mouseX: 0,
    mouseY: 0,
    capturedX: null,
    capturedY: null,
    capturedV: { x: null, y: null },
    lastUpdate: Date.now(),
    generationCount: 0,
    svgData: null,
    mathInfo: {},
    isAnimating: false,
    animationFrame: null,
    recursionCount: 0,
    maxAllowedRecursion: 8, // Safety limit
    currentPalette: [],
    allColors: {}, // Loaded from colours.json
    currentOptions: {},
    currentLayer: 0, // For multi-layer generation
    viewportWidth: 800,
    viewportHeight: 600,
    // Seed for PRNG (if implementing a dedicated one)
    // seed: Date.now(),
};

// ====================== Constants ======================
const SVG_NS = "http://www.w3.org/2000/svg";
const MAX_RECURSION_SAFETY = 10000; // Prevent browser freeze

// ====================== DOM Element References ======================
const dom = {}; // Object to hold cached DOM elements

function cacheDOMElements() {
    dom.svg = document.getElementById('svg-canvas');
    dom.defs = dom.svg.querySelector('defs');
    dom.patternType = document.getElementById('pattern-type');
    dom.complexity = document.getElementById('complexity');
    dom.density = document.getElementById('density');
    dom.maxRecursion = document.getElementById('max-recursion');
    dom.strokeWeight = document.getElementById('stroke-weight');
    dom.opacity = document.getElementById('opacity');
    dom.scale = document.getElementById('scale');
    dom.layerCount = document.getElementById('layer-count');
    dom.repetition = document.getElementById('repetition');
    dom.fillType = document.getElementById('fill-type');
    dom.colorCategory = document.getElementById('color-category');
    dom.colorPalette = document.getElementById('color-palette');
    dom.palettePreview = document.getElementById('palette-preview');
    dom.bgColor = document.getElementById('bg-color');
    dom.strokeColor = document.getElementById('stroke-color');
    dom.useCursor = document.getElementById('use-cursor');
    dom.useTime = document.getElementById('use-time');
    dom.animation = document.getElementById('animation');
    dom.animationType = document.getElementById('animation-type');
    dom.viewportPreset = document.getElementById('viewport-preset');
    dom.customWidth = document.getElementById('custom-width');
    dom.customHeight = document.getElementById('custom-height');

    dom.generateBtn = document.getElementById('generate-btn');
    dom.stopAnimationBtn = document.getElementById('stop-animation-btn');
    dom.downloadSvgBtn = document.getElementById('download-btn');
    dom.downloadJsonBtn = document.getElementById('download-json-btn');
    dom.captureXBtn = document.getElementById('capture-x');
    dom.captureYBtn = document.getElementById('capture-y');
    dom.captureVBtn = document.getElementById('capture-v');
    dom.toggleLeftBtn = document.getElementById('toggle-left');
    dom.toggleRightBtn = document.getElementById('toggle-right');

    dom.leftSidebar = document.querySelector('.left-sidebar');
    dom.rightSidebar = document.querySelector('.right-sidebar');
    dom.cursorInfo = document.getElementById('cursor-info');
    dom.capturedCoords = document.getElementById('captured-coords');
    dom.mathOutput = document.getElementById('math-output');
    dom.svgStats = document.getElementById('svg-stats');

    // Add value displays for ranges
    document.querySelectorAll('input[type="range"]').forEach(input => {
        const display = input.parentElement.querySelector('.value-display');
        if (display) {
            // Store display element for easy update
            dom[input.id + 'Display'] = display;
            // Initial display update
            display.textContent = input.value;
             // Add listener
            input.addEventListener('input', () => {
                 display.textContent = input.value;
            });
        }
    });
}


// ====================== Utility Functions ======================

// Use crypto for better randomness if available
const randomSource = window.crypto || window.msCrypto; // Basic fallback
function secureRandom() {
    if (randomSource && randomSource.getRandomValues) {
        const buffer = new Uint32Array(1);
        randomSource.getRandomValues(buffer);
        return buffer[0] / 0xFFFFFFFF; // Normalize to 0-1
    }
    return Math.random(); // Fallback
}

function random(min, max) {
    return secureRandom() * (max - min) + min;
}

function randomInt(min, max) {
    return Math.floor(random(min, max + 1));
}

function randomChoice(array) {
    if (!array || array.length === 0) return null;
    return array[Math.floor(secureRandom() * array.length)];
}

// --- PRNG (Optional - More advanced seeding) ---
// Example using a simple Linear Congruential Generator (LCG)
// function createPRNG(seed) {
//     let state = seed % 2147483647;
//     if (state <= 0) state += 2147483646;
//     return () => {
//         state = (state * 16807) % 2147483647;
//         return (state - 1) / 2147483646; // Normalize to 0-1
//     };
// }
// let currentPRNG = createPRNG(Date.now()); // Initialize
// Usage: random = currentPRNG(); instead of Math.random()


function isPrime(num) {
    num = Math.abs(Math.floor(num));
    if (num <= 1) return false;
    if (num <= 3) return true;
    if (num % 2 === 0 || num % 3 === 0) return false;
    let i = 5;
    while (i * i <= num) {
        if (num % i === 0 || num % (i + 2) === 0) return false;
        i += 6;
    }
    return true;
}

function fibonacci(n) {
    n = Math.max(0, Math.floor(n));
    if (n <= 1) return n;
    let a = 0, b = 1;
    for (let i = 2; i <= n; i++) { [a, b] = [b, a + b]; }
    return b;
}

function goldenRatioPoint(index, totalPoints, radius) {
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const angle = index * goldenAngle;
    const distance = radius * Math.sqrt(index / totalPoints);
    return { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance };
}

function createSVGElement(tag, attrs = {}, parent = null) {
    const elem = document.createElementNS(SVG_NS, tag);
    for (const [key, value] of Object.entries(attrs)) {
        elem.setAttribute(key, value);
    }
    if (parent) {
        parent.appendChild(elem);
    }
    return elem;
}

// Generate a unique ID for SVG elements (gradients, patterns)
function generateUniqueId(prefix = 'svg-elem') {
    return `${prefix}-${Date.now()}-${randomInt(1000, 9999)}`;
}

function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function getTimeSeedValue() {
    // Normalize current time of day (0-1)
    const now = new Date();
    const secondsInDay = 24 * 60 * 60;
    const currentSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds() + now.getMilliseconds() / 1000;
    return currentSeconds / secondsInDay;
}

// --- Debounce/Throttle (Optional - For performance on resize/mousemove) ---
// function debounce(func, wait) {
//   let timeout;
//   return function executedFunction(...args) {
//     const later = () => {
//       clearTimeout(timeout);
//       func(...args);
//     };
//     clearTimeout(timeout);
//     timeout = setTimeout(later, wait);
//   };
// }


// ====================== Color Management ======================

async function loadColors() {
    try {
        const response = await fetch('./data/colours.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        state.allColors = await response.json();
        populateColorSelectors();
        console.log("Colors loaded successfully:", Object.keys(state.allColors).length, "categories");
    } catch (error) {
        console.error("Could not load colours.json:", error);
        // Use a fallback basic palette if loading fails
        state.allColors = {
            fallback_blues: [
                { name: "Default Blue 1", hex: "#264651" },
                { name: "Default Blue 2", hex: "#0E5360" },
                { name: "Default Blue 3", hex: "#0297A1" },
                { name: "Default Blue 4", hex: "#93bedb" },
            ]
        };
        populateColorSelectors(); // Populate with fallback
    }
}

function populateColorSelectors() {
    dom.colorCategory.innerHTML = ''; // Clear existing options
    for (const category in state.allColors) {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category.charAt(0).toUpperCase() + category.slice(1); // Capitalize
        dom.colorCategory.appendChild(option);
    }
    // Add a "Random Category" option
     const randomCatOption = document.createElement('option');
     randomCatOption.value = 'random_category';
     randomCatOption.textContent = 'Random Category';
     dom.colorCategory.appendChild(randomCatOption);


    // Trigger update for the palette dropdown based on the first category
    updatePaletteDropdown();
    // Add listener for category changes
    dom.colorCategory.addEventListener('change', updatePaletteDropdown);
    // Add listener for palette changes (to update preview)
     dom.colorPalette.addEventListener('change', updatePalettePreview);
}

function updatePaletteDropdown() {
    const selectedCategory = dom.colorCategory.value;
    dom.colorPalette.innerHTML = ''; // Clear existing

    if (selectedCategory === 'random_category') {
        // If random category, add only a "Random Palette" option
        const randomOption = document.createElement('option');
        randomOption.value = 'random_palette';
        randomOption.textContent = 'Random Palette';
        dom.colorPalette.appendChild(randomOption);
    } else if (state.allColors[selectedCategory]) {
        const palettes = state.allColors[selectedCategory];
        // Check if the category contains palette objects or just hex strings/objects
        if (Array.isArray(palettes) && palettes.length > 0 && typeof palettes[0] === 'object' && palettes[0].name && palettes[0].hex) {
             // If it's an array of {name, hex} objects, treat the whole category as one palette
             const option = document.createElement('option');
             option.value = selectedCategory; // Use category name as value
             option.textContent = selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1);
             dom.colorPalette.appendChild(option);
        } else {
             // Assume it's an object containing multiple named palettes (or handle other structures)
             // This part needs adjustment based on the actual structure of colours.json if it's nested deeper
             console.warn("Color category structure not fully handled yet for:", selectedCategory);
             // Add a default option for now
             const defaultOption = document.createElement('option');
             defaultOption.value = 'default';
             defaultOption.textContent = 'Default';
             dom.colorPalette.appendChild(defaultOption);
        }
         // Add a "Random Palette from Category" option
        const randomInCatOption = document.createElement('option');
        randomInCatOption.value = 'random_in_category';
        randomInCatOption.textContent = 'Random Palette (from Category)';
        dom.colorPalette.appendChild(randomInCatOption);
    }

    // Trigger preview update
    updatePalettePreview();
}


function getColorPalette() {
    const category = dom.colorCategory.value;
    const paletteName = dom.colorPalette.value;
    let selectedPaletteHex = [];

    if (paletteName === 'random_palette') {
        const randomCategory = randomChoice(Object.keys(state.allColors));
        selectedPaletteHex = (state.allColors[randomCategory] || []).map(c => c.hex);
    } else if (paletteName === 'random_in_category' && category !== 'random_category') {
         selectedPaletteHex = (state.allColors[category] || []).map(c => c.hex);
         // Shuffle or select a random subset if desired
         selectedPaletteHex.sort(() => 0.5 - secureRandom()); // Simple shuffle
         selectedPaletteHex = selectedPaletteHex.slice(0, randomInt(5, 10)); // Random size 5-10
    } else if (state.allColors[category]) {
        selectedPaletteHex = (state.allColors[category] || []).map(c => c.hex);
    } else {
        // Fallback
        selectedPaletteHex = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#00FFFF', '#FF00FF'];
        console.warn("Could not find selected palette, using fallback.");
    }

     if (selectedPaletteHex.length === 0) {
         // Ensure we always return *something*
         selectedPaletteHex = ['#333333', '#666666', '#999999', '#CCCCCC'];
     }

    state.currentPalette = selectedPaletteHex; // Store the currently used palette hex values
    return state.currentPalette;
}

function updatePalettePreview() {
    const palette = getColorPalette(); // Get the hex values
    dom.palettePreview.innerHTML = ''; // Clear previous
    palette.forEach(hex => {
        const colorBox = document.createElement('div');
        colorBox.classList.add('color-box');
        colorBox.style.backgroundColor = hex;
        colorBox.title = hex; // Show hex on hover
        dom.palettePreview.appendChild(colorBox);
    });
}

function getRandomFill(palette, options) {
    if (options.fillType === 'none') return 'none';

    const chance = secureRandom();

    if (options.fillType === 'gradient' && chance < 0.3) {
        return createGradientFill(palette);
    }
    if (options.fillType === 'pattern' && chance > 0.3 && chance < 0.6) {
        return createPatternFill(palette);
    }
    // Default to solid color
    return randomChoice(palette) || 'grey'; // Fallback color
}

function createGradientFill(palette) {
    const gradientId = generateUniqueId('gradient');
    const isLinear = secureRandom() < 0.7;
    let gradient;

    if (isLinear) {
        gradient = createSVGElement('linearGradient', {
            id: gradientId,
            x1: `${randomInt(0, 100)}%`, y1: `${randomInt(0, 100)}%`,
            x2: `${randomInt(0, 100)}%`, y2: `${randomInt(0, 100)}%`
        });
    } else {
        gradient = createSVGElement('radialGradient', {
            id: gradientId,
            cx: `${randomInt(0, 100)}%`, cy: `${randomInt(0, 100)}%`,
            r: `${randomInt(50, 150)}%`, // Allow larger radius
            fx: `${randomInt(0, 100)}%`, fy: `${randomInt(0, 100)}%` // Focal point
        });
    }

    const numStops = randomInt(2, 4);
    for (let i = 0; i < numStops; i++) {
        createSVGElement('stop', {
            offset: `${Math.floor((i / (numStops - 1)) * 100)}%`,
            'stop-color': randomChoice(palette) || 'grey',
            'stop-opacity': random(0.7, 1.0) // Slightly less transparency variation
        }, gradient);
    }

    dom.defs.appendChild(gradient);
    return `url(#${gradientId})`;
}

function createPatternFill(palette) {
    const patternId = generateUniqueId('pattern');
    const size = randomInt(8, 20); // Variable pattern size
    const pattern = createSVGElement('pattern', {
        id: patternId,
        width: size,
        height: size,
        patternUnits: 'userSpaceOnUse',
        patternTransform: `rotate(${randomInt(0, 90)}) scale(${random(0.5, 1.5)})` // Add scale
    });

    // Add a background to the pattern cell
    createSVGElement('rect', {
        width: size, height: size, fill: randomChoice(palette), opacity: random(0.1, 0.4)
    }, pattern);


    const patternType = randomInt(0, 5); // More pattern types
    const strokeColor = randomChoice(palette) || 'grey';
    const fillColor = randomChoice(palette) || 'lightgrey';
    const strokeWidth = random(0.5, 2);

    switch (patternType) {
        case 0: // Dots
            createSVGElement('circle', { cx: size/2, cy: size/2, r: size * random(0.1, 0.3), fill: fillColor }, pattern);
            break;
        case 1: // Lines
            createSVGElement('line', { x1: 0, y1: size/2, x2: size, y2: size/2, stroke: strokeColor, 'stroke-width': strokeWidth }, pattern);
            if (secureRandom() > 0.5) // Add perpendicular line sometimes
                 createSVGElement('line', { x1: size/2, y1: 0, x2: size/2, y2: size, stroke: strokeColor, 'stroke-width': strokeWidth }, pattern);
            break;
        case 2: // Diagonal lines
            createSVGElement('line', { x1: 0, y1: 0, x2: size, y2: size, stroke: strokeColor, 'stroke-width': strokeWidth }, pattern);
            if (secureRandom() > 0.5)
                 createSVGElement('line', { x1: size, y1: 0, x2: 0, y2: size, stroke: strokeColor, 'stroke-width': strokeWidth }, pattern);
            break;
        case 3: // Checkboard
            createSVGElement('rect', { x: 0, y: 0, width: size/2, height: size/2, fill: fillColor }, pattern);
            createSVGElement('rect', { x: size/2, y: size/2, width: size/2, height: size/2, fill: fillColor }, pattern);
            break;
        case 4: // Triangles
             createSVGElement('polygon', { points: `0,0 ${size},0 ${size/2},${size}`, fill: fillColor }, pattern);
             if (secureRandom() > 0.5)
                createSVGElement('polygon', { points: `0,${size} ${size},${size} ${size/2},0`, fill: randomChoice(palette) }, pattern);
            break;
        case 5: // Small circles/squares
             const shape = secureRandom() > 0.5 ? 'circle' : 'rect';
             const elemSize = size * 0.4;
             if (shape === 'circle') {
                createSVGElement('circle', { cx: size/2, cy: size/2, r: elemSize/2, fill: fillColor, stroke: strokeColor, 'stroke-width': strokeWidth * 0.5 }, pattern);
             } else {
                 createSVGElement('rect', { x: size/2 - elemSize/2, y: size/2 - elemSize/2, width: elemSize, height: elemSize, fill: fillColor, stroke: strokeColor, 'stroke-width': strokeWidth * 0.5 }, pattern);
             }
            break;
    }

    dom.defs.appendChild(pattern);
    return `url(#${patternId})`;
}


// ====================== SVG Generation Core ======================

// Central function to get options from UI
function getOptions() {
    state.currentOptions = {
        patternType: dom.patternType.value,
        complexity: parseInt(dom.complexity.value),
        density: parseInt(dom.density.value),
        maxRecursion: parseInt(dom.maxRecursion.value),
        strokeWeight: parseFloat(dom.strokeWeight.value),
        opacity: parseFloat(dom.opacity.value),
        scale: parseFloat(dom.scale.value),
        layerCount: parseInt(dom.layerCount.value),
        repetition: parseInt(dom.repetition.value),
        fillType: dom.fillType.value,
        bgColor: dom.bgColor.value,
        strokeColor: dom.strokeColor.value,
        useCursor: dom.useCursor.checked,
        useTime: dom.useTime.checked,
        animation: dom.animation.checked,
        animationType: dom.animationType.value,
        viewportWidth: state.viewportWidth, // Use state viewport
        viewportHeight: state.viewportHeight, // Use state viewport
        // Include captured coordinates if needed by patterns
        capturedX: state.capturedX,
        capturedY: state.capturedY,
        capturedV: state.capturedV,
    };
    return state.currentOptions;
}

// Main SVG Generation Function
function generateSVG() {
    console.log("Generating SVG...");
    stopAnimation(); // Stop any existing animation first

    const options = getOptions();
    const palette = getColorPalette(); // Get current palette

    // Clear previous SVG content and defs
    dom.svg.innerHTML = '';
    dom.defs = createSVGElement('defs'); // Recreate defs
    dom.svg.appendChild(dom.defs);

    // Set SVG background (as a rect)
    if (options.bgColor && options.bgColor !== '#ffffff' && options.bgColor !== '#FFFFFF') {
        createSVGElement('rect', {
            x: 0, y: 0, width: '100%', height: '100%', fill: options.bgColor
        }, dom.svg);
    }

    // --- Seeding Logic ---
    // Store original Math.random
    const originalRandom = Math.random;
    let seed = Date.now(); // Base seed

    if (options.useTime) {
        seed += getTimeSeedValue() * 1e9; // Mix in time
    }
    if (options.useCursor && state.mouseX !== null && state.mouseY !== null) {
        // Incorporate mouse position carefully to avoid predictable patterns
        seed += Math.sin(state.mouseX * 0.01) * 1e5 + Math.cos(state.mouseY * 0.01) * 1e5;
         // Mix in captured coords if they exist
        if (state.capturedX !== null) seed += Math.sin(state.capturedX) * 1e4;
        if (state.capturedY !== null) seed += Math.cos(state.capturedY) * 1e4;

    }

    // Simple LCG PRNG based on the combined seed (can replace Math.random)
    let currentSeed = Math.floor(Math.abs(seed)) % 2147483647;
    if (currentSeed === 0) currentSeed = 1;
    const seededRandom = () => {
        currentSeed = (currentSeed * 16807) % 2147483647;
        return (currentSeed - 1) / 2147483646;
    };
     // Temporarily replace Math.random ONLY IF seeds are used
     if (options.useTime || options.useCursor) {
         console.log("Using seeded random.");
         Math.random = seededRandom;
     } else {
         console.log("Using default Math.random.");
         Math.random = secureRandom; // Use the better default random
     }

    // --- Generation Loop (Layers) ---
    let totalElements = 0;
    let combinedMathInfo = {};

    try {
        for (let layer = 0; layer < options.layerCount; layer++) {
            state.currentLayer = layer; // Set current layer context
            let layerGroup = createSVGElement('g', { id: `layer-${layer}` }, dom.svg);
             // Optional: Apply slight variations per layer
             const layerOptions = { ...options };
             if (layer > 0) {
                 layerOptions.complexity = Math.max(1, options.complexity - layer);
                 layerOptions.density = Math.max(1, options.density - layer * 10);
                 layerOptions.strokeWeight = Math.max(0.1, options.strokeWeight * (1 - layer * 0.2));
                 layerOptions.opacity = Math.max(0.1, options.opacity * (1 - layer * 0.15));
                 layerOptions.scale = options.scale * (1 - layer * 0.1);
             }


            // Reset recursion count for patterns that use it
            state.recursionCount = 0;
            let result = {};

            // Generate pattern based on selected type
            switch (options.patternType) {
                case 'random':
                    result = generateRandomPattern(layerGroup, layerOptions, palette);
                    break;
                case 'recursive':
                    result = generateRecursivePattern(layerGroup, layerOptions, palette);
                    break;
                case 'grid':
                    result = generateGridPattern(layerGroup, layerOptions, palette);
                    break;
                case 'quadtree':
                    result = generateQuadtreePattern(layerGroup, layerOptions, palette);
                    break;
                case 'fibonacci':
                    result = generateFibonacciPattern(layerGroup, layerOptions, palette);
                    break;
                case 'mandelbrot':
                    result = generateMandelbrotPattern(layerGroup, layerOptions, palette);
                    break;
                case 'prime':
                    result = generatePrimePattern(layerGroup, layerOptions, palette);
                    break;
                 case 'trig':
                    result = generateTrigPattern(layerGroup, layerOptions, palette);
                    break;
                case 'bezier':
                    result = generateBezierPattern(layerGroup, layerOptions, palette);
                    break;
                case 'lissajous':
                    result = generateLissajousPattern(layerGroup, layerOptions, palette);
                    break;
                // Add cases for new patterns here
                default:
                    console.warn("Unknown pattern type:", options.patternType);
                    result = generateRandomPattern(layerGroup, layerOptions, palette);
            }

            // Combine results from layers
            totalElements += result.elementCount || 0;
            combinedMathInfo[`Layer_${layer}`] = result; // Store layer-specific info
        }

        // Update overall math information
        state.mathInfo = {
            generator: options.patternType,
            layers: options.layerCount,
            viewport: `${options.viewportWidth}x${options.viewportHeight}`,
            totalElements: totalElements,
            details: combinedMathInfo // Include layer details
        };
        updateMathInfo(state.mathInfo);

        // Update SVG stats
        updateSVGStats(totalElements);

        // Store SVG data for export
        state.svgData = dom.svg.outerHTML;
        state.generationCount++;

        // Start animation if enabled
        if (options.animation) {
            startAnimation();
        }

    } catch (error) {
        console.error('Error during SVG generation:', error);
        dom.svg.innerHTML = `<text x="10" y="50" fill="red">Error: ${error.message}. Check console.</text>`;
        updateMathInfo({ error: error.message });
        updateSVGStats(0);
    } finally {
        // Restore original Math.random IMPORTANT!
         Math.random = originalRandom;
         console.log("Restored Math.random.");
    }
}


// ====================== Pattern Generation Functions ======================
// (Includes existing patterns + new ones: Trig, Bezier, Lissajous)

function generateRandomPattern(parent, options, palette) {
    const { viewportWidth: width, viewportHeight: height, complexity, density, repetition } = options;
    let elementCount = 0;
    const numShapes = Math.floor(complexity * (density / 100) * 20 * repetition);

    for (let i = 0; i < numShapes; i++) {
        const shapeType = Math.random(); // Use potentially seeded random
        let shape;
        const fill = getRandomFill(palette, options);
        const stroke = options.strokeColor;
        const strokeWidth = options.strokeWeight;
        const opacity = options.opacity;

        if (shapeType < 0.3) { // Circle
            shape = createSVGElement('circle', {
                cx: random(0, width), cy: random(0, height),
                r: random(5, 30 * complexity * options.scale),
                fill, stroke, 'stroke-width': strokeWidth, opacity
            }, parent);
        } else if (shapeType < 0.6) { // Rectangle
            const rectW = random(10, 50 * complexity * options.scale);
            const rectH = random(10, 50 * complexity * options.scale);
            shape = createSVGElement('rect', {
                x: random(0, width - rectW), y: random(0, height - rectH),
                width: rectW, height: rectH,
                fill, stroke, 'stroke-width': strokeWidth, opacity,
                transform: `rotate(${random(-30, 30)} ${random(0, width)} ${random(0, height)})` // Add random rotation
            }, parent);
        } else { // Polygon
            const points = [];
            const numPoints = randomInt(3, 7); // Up to 7 sides
            const centerX = random(0, width);
            const centerY = random(0, height);
            const radius = random(10, 40 * complexity * options.scale);
            for (let j = 0; j < numPoints; j++) {
                const angle = (j / numPoints) * Math.PI * 2 + random(-0.1, 0.1); // Slight angle jitter
                const r = radius * random(0.8, 1.2); // Radius jitter
                points.push(`${centerX + Math.cos(angle) * r},${centerY + Math.sin(angle) * r}`);
            }
            shape = createSVGElement('polygon', {
                points: points.join(' '),
                fill, stroke, 'stroke-width': strokeWidth, opacity
            }, parent);
        }
        elementCount++;
    }
    return { elementCount, complexity: options.complexity, uniqueColors: palette.length };
}

function generateRecursivePattern(parent, options, palette) {
     const { viewportWidth: width, viewportHeight: height, complexity, maxRecursion } = options;
     state.recursionCount = 0; // Reset global counter

     const initialSize = Math.min(width, height) * 0.4 * options.scale;
     // Center the initial shape slightly offset
     const startX = width/2 + random(-width * 0.1, width * 0.1);
     const startY = height/2 + random(-height * 0.1, height * 0.1);

    const initialShape = {
        type: Math.random() < 0.5 ? 'circle' : 'rect',
        x: startX,
        y: startY,
        size: initialSize, // Use 'size' for both for simplicity in recursion
        depth: 0
    };

    recursiveDraw(parent, initialShape, maxRecursion, options, palette);

    return {
        elementCount: state.recursionCount,
        recursionDepthReached: Math.min(state.recursionCount > 0 ? maxRecursion : 0, maxRecursion), // Actual depth might be less if recursion stopped early
        complexity: options.complexity
    };
}

function recursiveDraw(parent, shapeData, maxDepth, options, palette) {
    if (shapeData.depth >= maxDepth || state.recursionCount >= MAX_RECURSION_SAFETY) {
        if (state.recursionCount >= MAX_RECURSION_SAFETY) console.warn('Max recursion safety limit hit!');
        return;
    }
    state.recursionCount++;

    const { type, x, y, size, depth } = shapeData;
    const fill = getRandomFill(palette, options);
    const stroke = options.strokeColor;
    // Reduce stroke weight and opacity more subtly with depth
    const strokeWidth = Math.max(0.1, options.strokeWeight * (1 - depth / (maxDepth * 1.5)));
    const opacity = Math.max(0.1, options.opacity * (1 - depth / (maxDepth * 2)));

    if (type === 'circle') {
        createSVGElement('circle', {
            cx: x, cy: y, r: Math.max(1, size / 2), // Ensure radius is positive
            fill, stroke, 'stroke-width': strokeWidth, opacity
        }, parent);
    } else { // rect
        createSVGElement('rect', {
             x: x - size / 2, y: y - size / 2,
             width: Math.max(1, size), height: Math.max(1, size), // Ensure positive dimensions
             fill, stroke, 'stroke-width': strokeWidth, opacity,
             transform: `rotate(${random(-10, 10)} ${x} ${y})` // Slight rotation
        }, parent);
    }

    // Calculate children properties
    const childDepth = depth + 1;
    // Complexity influences branching factor
    const numChildren = randomInt(2, Math.max(2, Math.floor(options.complexity / 2)));
    // Scale factor decreases with depth, influenced by density
    const scaleFactor = Math.max(0.1, (0.6 - depth * 0.05) * (options.density / 100 + 0.5));
    const childSize = size * scaleFactor;

    if (childSize < 1) return; // Stop if children are too small

    for (let i = 0; i < numChildren; i++) {
        // Position children relative to parent
        const angle = (i / numChildren) * Math.PI * 2 + random(-0.2, 0.2);
        const distance = size * 0.5 * random(0.8, 1.2); // Place children around parent
        const childX = x + Math.cos(angle) * distance;
        const childY = y + Math.sin(angle) * distance;

        // Randomly choose child type, maybe influenced by parent type
        const childType = Math.random() < 0.6 ? type : (type === 'circle' ? 'rect' : 'circle');

        recursiveDraw(parent, {
            type: childType,
            x: childX,
            y: childY,
            size: childSize,
            depth: childDepth
        }, maxDepth, options, palette);
    }
}


function generateGridPattern(parent, options, palette) {
     const { viewportWidth: width, viewportHeight: height, complexity, density, repetition } = options;
     let elementCount = 0;
     // Grid size influenced by complexity and repetition
     const cellsPerSide = Math.max(2, Math.floor(complexity * 1.5 + repetition));
     const cellWidth = width / cellsPerSide;
     const cellHeight = height / cellsPerSide;
     const densityThreshold = 1 - (density / 100);

     for (let row = 0; row < cellsPerSide; row++) {
         for (let col = 0; col < cellsPerSide; col++) {
             if (Math.random() < densityThreshold) continue; // Skip based on density

             const cx = col * cellWidth + cellWidth / 2;
             const cy = row * cellHeight + cellHeight / 2;
             const cellOptions = { ...options }; // Copy options for potential modification

             // Choose what to draw in the cell
             const cellContentType = randomInt(0, 5); // More variety
             const fill = getRandomFill(palette, cellOptions);
             const stroke = cellOptions.strokeColor;
             const sw = cellOptions.strokeWeight;
             const op = cellOptions.opacity;
             const elementScale = Math.min(cellWidth, cellHeight) * 0.4 * cellOptions.scale * random(0.7, 1.1);

             switch (cellContentType) {
                case 0: // Circle
                    createSVGElement('circle', { cx, cy, r: elementScale, fill, stroke, 'stroke-width': sw, opacity: op }, parent);
                    break;
                case 1: // Rectangle
                    const w = elementScale * 2 * random(0.8, 1.2);
                    const h = elementScale * 2 * random(0.8, 1.2);
                    createSVGElement('rect', { x: cx - w/2, y: cy - h/2, width: w, height: h, fill, stroke, 'stroke-width': sw, opacity: op, transform: `rotate(${random(-20, 20)} ${cx} ${cy})` }, parent);
                    break;
                 case 2: // Line
                     const angle = random(0, Math.PI * 2);
                     const len = elementScale * 2;
                     createSVGElement('line', {
                         x1: cx - Math.cos(angle) * len / 2, y1: cy - Math.sin(angle) * len / 2,
                         x2: cx + Math.cos(angle) * len / 2, y2: cy + Math.sin(angle) * len / 2,
                         stroke: randomChoice(palette), 'stroke-width': sw * random(1, 3), opacity: op
                     }, parent);
                    break;
                 case 3: // Polygon
                    const points = [];
                    const vertices = randomInt(3, 7);
                    for (let i = 0; i < vertices; i++) {
                        const a = (i / vertices) * Math.PI * 2;
                        points.push(`${cx + Math.cos(a) * elementScale},${cy + Math.sin(a) * elementScale}`);
                    }
                    createSVGElement('polygon', { points: points.join(' '), fill, stroke, 'stroke-width': sw, opacity: op }, parent);
                     break;
                 case 4: // Ellipse
                     createSVGElement('ellipse', { cx, cy, rx: elementScale * random(0.7, 1.3), ry: elementScale * random(0.7, 1.3), fill, stroke, 'stroke-width': sw, opacity: op }, parent);
                     break;
                 case 5: // Nested Shape (Example: rect inside circle)
                      const outerR = elementScale * 1.2;
                      createSVGElement('circle', { cx, cy, r: outerR, fill: 'none', stroke: stroke, 'stroke-width': sw * 0.5, opacity: op * 0.5 }, parent);
                      const innerW = outerR * 0.6;
                      createSVGElement('rect', { x: cx - innerW/2, y: cy - innerW/2, width: innerW, height: innerW, fill, stroke: 'none', opacity: op}, parent);
                      elementCount++; // Count inner shape too
                     break;
             }
             elementCount++;
         }
     }

     // Add grid lines optionally based on complexity/density
    if (complexity > 4 && density > 30) {
        const gridLineStroke = options.strokeColor;
        const gridLineOpacity = options.opacity * 0.2;
        const gridLineSW = options.strokeWeight * 0.5;
        for (let row = 0; row <= cellsPerSide; row++) {
            createSVGElement('line', { x1: 0, y1: row * cellHeight, x2: width, y2: row * cellHeight, stroke: gridLineStroke, 'stroke-width': gridLineSW, opacity: gridLineOpacity }, parent);
            elementCount++;
        }
        for (let col = 0; col <= cellsPerSide; col++) {
             createSVGElement('line', { x1: col * cellWidth, y1: 0, x2: col * cellWidth, y2: height, stroke: gridLineStroke, 'stroke-width': gridLineSW, opacity: gridLineOpacity }, parent);
            elementCount++;
        }
    }


     return { elementCount, gridSize: `${cellsPerSide}x${cellsPerSide}`, cellCount: cellsPerSide * cellsPerSide };
}

function generateQuadtreePattern(parent, options, palette) {
    const { viewportWidth: width, viewportHeight: height, maxRecursion } = options;
    state.recursionCount = 0; // Reset global counter

    const rootQuad = { x: 0, y: 0, width, height, depth: 0 };
    generateQuadtreeNode(parent, rootQuad, maxRecursion, options, palette);

     return {
        elementCount: state.recursionCount,
        maxDepthReached: Math.min(state.recursionCount > 0 ? maxRecursion : 0, maxRecursion),
        complexity: options.complexity
    };
}

function generateQuadtreeNode(parent, quad, maxDepth, options, palette) {
    const { x, y, width, height, depth } = quad;

    if (depth >= maxDepth || state.recursionCount >= MAX_RECURSION_SAFETY || width < 2 || height < 2) {
         if (state.recursionCount >= MAX_RECURSION_SAFETY) console.warn('Max recursion safety limit hit!');
        return;
    }
    state.recursionCount++;

     // Subdivision probability influenced by complexity and density
    const subdivideProb = 0.5 + (options.complexity / 10) * 0.4 + (options.density / 100) * 0.2 - (depth / maxDepth) * 0.3;
    const shouldSubdivide = Math.random() < subdivideProb;


    if (shouldSubdivide) {
        const halfWidth = width / 2;
        const halfHeight = height / 2;
         // Add slight randomness to division point
         const midX = x + halfWidth + random(-halfWidth * 0.1, halfWidth * 0.1);
         const midY = y + halfHeight + random(-halfHeight * 0.1, halfHeight * 0.1);

        // Recurse on children
        generateQuadtreeNode(parent, { x: x,    y: y,    width: midX - x,         height: midY - y,         depth: depth + 1 }, maxDepth, options, palette);
        generateQuadtreeNode(parent, { x: midX, y: y,    width: x + width - midX, height: midY - y,         depth: depth + 1 }, maxDepth, options, palette);
        generateQuadtreeNode(parent, { x: x,    y: midY, width: midX - x,         height: y + height - midY, depth: depth + 1 }, maxDepth, options, palette);
        generateQuadtreeNode(parent, { x: midX, y: midY, width: x + width - midX, height: y + height - midY, depth: depth + 1 }, maxDepth, options, palette);

        // Optionally draw dividing lines
        if (options.complexity > 5) {
             const lineOpacity = Math.max(0.05, 0.3 - depth * 0.05);
             const lineWeight = Math.max(0.1, options.strokeWeight * (0.8 - depth * 0.1));
             createSVGElement('line', { x1: x, y1: midY, x2: x + width, y2: midY, stroke: options.strokeColor, 'stroke-width': lineWeight, opacity: lineOpacity }, parent);
             createSVGElement('line', { x1: midX, y1: y, x2: midX, y2: y + height, stroke: options.strokeColor, 'stroke-width': lineWeight, opacity: lineOpacity }, parent);
             state.recursionCount += 2; // Count lines as elements
        }

    } else {
        // Draw a leaf node - more shape variety
         const fill = getRandomFill(palette, options);
         const stroke = options.strokeColor;
         const sw = Math.max(0.1, options.strokeWeight * (1 - depth / maxDepth));
         const op = Math.max(0.1, options.opacity * (1 - depth / (maxDepth * 1.5)));
         const cx = x + width / 2;
         const cy = y + height / 2;
         const r = Math.min(width, height) / 2 * 0.8 * options.scale; // Base radius

         const leafType = randomInt(0, 4);
         switch(leafType) {
             case 0: // Rectangle
                 createSVGElement('rect', { x: x + width*0.1, y: y + height*0.1, width: width*0.8, height: height*0.8, fill, stroke, 'stroke-width': sw, opacity: op}, parent);
                 break;
             case 1: // Circle
                 createSVGElement('circle', { cx, cy, r, fill, stroke, 'stroke-width': sw, opacity: op}, parent);
                 break;
             case 2: // Ellipse
                  createSVGElement('ellipse', { cx, cy, rx: r, ry: r * random(0.5, 1), fill, stroke, 'stroke-width': sw, opacity: op}, parent);
                 break;
             case 3: // Polygon (Triangle/Diamond/etc)
                 const points = [];
                 const sides = randomInt(3, 6);
                  for (let i = 0; i < sides; i++) {
                     const angle = (i / sides) * Math.PI * 2;
                     points.push(`${cx + Math.cos(angle) * r},${cy + Math.sin(angle) * r}`);
                 }
                 createSVGElement('polygon', { points: points.join(' '), fill, stroke, 'stroke-width': sw, opacity: op}, parent);
                 break;
             case 4: // Arc or Path (simple example)
                 const startAngle = random(0, Math.PI * 2);
                 const endAngle = startAngle + random(Math.PI/2, Math.PI * 1.5);
                 const largeArc = (endAngle - startAngle) >= Math.PI ? 1 : 0;
                 const x1 = cx + Math.cos(startAngle) * r;
                 const y1 = cy + Math.sin(startAngle) * r;
                 const x2 = cx + Math.cos(endAngle) * r;
                 const y2 = cy + Math.sin(endAngle) * r;
                 createSVGElement('path', {
                     d: `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`,
                     fill: 'none', stroke: randomChoice(palette), 'stroke-width': sw * 1.5, opacity: op
                 }, parent);
                 break;
         }
    }
}

function generateFibonacciPattern(parent, options, palette) {
    const { viewportWidth: width, viewportHeight: height, complexity, density, repetition } = options;
    const radius = Math.min(width, height) * 0.45 * options.scale;
    const numElements = Math.max(10, Math.floor(50 * complexity * (density / 100) * repetition));
    const phi = (1 + Math.sqrt(5)) / 2;
    const goldenAngle = 2 * Math.PI * (1 - 1 / phi);
    let elementCount = 0;

    // Center the spiral
    const group = createSVGElement('g', { transform: `translate(${width / 2}, ${height / 2})` }, parent);

    for (let i = 0; i < numElements; i++) {
        const theta = i * goldenAngle;
        // Use sqrt for more even distribution
        const distance = radius * Math.sqrt(i / numElements);
        const x = distance * Math.cos(theta);
        const y = distance * Math.sin(theta);

        // Size influenced by complexity and position (1 - i/numElements makes outer smaller)
        const baseSize = Math.max(1, radius * 0.1 * (1 - i / numElements) * (complexity / 5));
        let size = baseSize;
        // Optional: Use actual Fibonacci for first few element sizes
        // if (i < 10) { size = Math.max(1, fibonacci(10 - i) * radius * 0.005 * complexity); }

        const fill = getRandomFill(palette, options);
        const stroke = options.strokeColor;
        const sw = options.strokeWeight;
        const op = options.opacity;

        // Vary shape type more often
        const shapeType = i % randomInt(3, 6);
        switch (shapeType) {
            case 0: // Circle
                createSVGElement('circle', { cx: x, cy: y, r: size, fill, stroke, 'stroke-width': sw, opacity: op }, group);
                break;
            case 1: // Square (rotated)
                createSVGElement('rect', { x: x - size / 2, y: y - size / 2, width: size, height: size, fill, stroke, 'stroke-width': sw, opacity: op, transform: `rotate(${theta * 180 / Math.PI + random(-10, 10)}, ${x}, ${y})` }, group);
                break;
            case 2: // Triangle
                 const points = [];
                 for (let j = 0; j < 3; j++) {
                     const angle = theta + j * (2 * Math.PI / 3);
                     points.push(`${x + size * Math.cos(angle)},${y + size * Math.sin(angle)}`);
                 }
                 createSVGElement('polygon', { points: points.join(' '), fill, stroke, 'stroke-width': sw, opacity: op }, group);
                break;
             case 3: // Ellipse
                 createSVGElement('ellipse', { cx: x, cy: y, rx: size * random(0.8, 1.2), ry: size * random(0.5, 1), fill, stroke, 'stroke-width': sw, opacity: op, transform: `rotate(${theta * 180 / Math.PI + random(-10, 10)}, ${x}, ${y})`}, group);
                break;
             case 4: // Line segment radiating outwards
                 const len = size * 2;
                 createSVGElement('line', {
                     x1: x - Math.cos(theta) * len / 2, y1: y - Math.sin(theta) * len / 2,
                     x2: x + Math.cos(theta) * len / 2, y2: y + Math.sin(theta) * len / 2,
                     stroke: randomChoice(palette), 'stroke-width': sw * random(0.5, 1.5), opacity: op
                 }, group);
                 break;
             // Add more cases? Star? Arc?
        }
        elementCount++;
    }

    // Add connecting spiral path if density/complexity allows
    if (complexity > 5 && density > 50) {
        const pathPoints = [];
        for (let i = 0; i < numElements; i += Math.max(1, Math.floor(numElements / (50 * repetition)))) { // Adjust step based on repetition
            const theta = i * goldenAngle;
            const distance = radius * Math.sqrt(i / numElements);
            pathPoints.push(`${distance * Math.cos(theta)},${distance * Math.sin(theta)}`);
        }
        if (pathPoints.length > 1) {
             createSVGElement('path', {
                 d: `M ${pathPoints[0]} L ${pathPoints.slice(1).join(' L ')}`,
                 fill: 'none', stroke: options.strokeColor, 'stroke-width': options.strokeWeight * 0.5, opacity: 0.4
             }, group);
            elementCount++;
        }
    }


    return {
        elementCount,
        goldenRatio: phi.toFixed(8),
        goldenAngleRad: goldenAngle.toFixed(8),
        numElementsGenerated: numElements
    };
}

function generateMandelbrotPattern(parent, options, palette) {
     const { viewportWidth: width, viewportHeight: height, complexity, density } = options;
     let elementCount = 0;
     // Resolution scales with complexity, density provides a threshold
     const resolution = Math.max(10, Math.min(100, Math.floor(complexity * 7))); // Max resolution 100x100
     const cellWidth = width / resolution;
     const cellHeight = height / resolution;
     const densityThreshold = 1 - (density / 100);

     // Mandelbrot calculation parameters
     const xMin = -2.1, xMax = 0.6, yMin = -1.2, yMax = 1.2;
     const maxIter = Math.floor(complexity * 20) + 15; // More iterations for higher complexity

     for (let row = 0; row < resolution; row++) {
         for (let col = 0; col < resolution; col++) {
            if (Math.random() < densityThreshold) continue; // Density check

             const x0 = xMin + (xMax - xMin) * (col / resolution);
             const y0 = yMin + (yMax - yMin) * (row / resolution);
             let x = 0, y = 0, iter = 0, x2 = 0, y2 = 0;

             while (x2 + y2 <= 4 && iter < maxIter) { // Escape condition |z|^2 > 4
                 y = 2 * x * y + y0;
                 x = x2 - y2 + x0;
                 x2 = x * x;
                 y2 = y * y;
                 iter++;
             }

             if (iter < maxIter && iter > 0) { // Only draw points that escaped
                 const normIter = iter / maxIter; // Normalized iteration count (0-1)
                 const colorIndex = Math.floor(normIter * (palette.length -1));
                 const fillColor = palette[colorIndex] || 'grey';

                 // Size based on how quickly it escaped (faster = smaller)
                 const size = Math.max(1, Math.min(cellWidth, cellHeight) * 0.9 * (1 - normIter) * options.scale);
                 const px = col * cellWidth + cellWidth / 2;
                 const py = row * cellHeight + cellHeight / 2;
                 const sw = options.strokeWeight * 0.5; // Thinner stroke for these
                 const op = options.opacity;

                 // Shape variation based on iteration count or position
                  const shapeType = iter % 4;
                  switch(shapeType) {
                      case 0: createSVGElement('circle', {cx:px, cy:py, r:size/2, fill:fillColor, stroke:options.strokeColor, 'stroke-width':sw, opacity:op}, parent); break;
                      case 1: createSVGElement('rect', {x:px-size/2, y:py-size/2, width:size, height:size, fill:fillColor, stroke:options.strokeColor, 'stroke-width':sw, opacity:op}, parent); break;
                      case 2: createSVGElement('ellipse', {cx:px, cy:py, rx:size/2, ry:size/4, fill:fillColor, stroke:options.strokeColor, 'stroke-width':sw, opacity:op, transform:`rotate(${iter*5} ${px} ${py})`}, parent); break; // Rotating ellipse
                      case 3:
                        const pts = `${px},${py-size/2} ${px+size/2},${py} ${px},${py+size/2} ${px-size/2},${py}`;
                        createSVGElement('polygon', {points:pts, fill:fillColor, stroke:options.strokeColor, 'stroke-width':sw, opacity:op}, parent); break; // Diamond
                  }
                 elementCount++;
             }
             // Optionally draw points *inside* the set (iter === maxIter) with a different style
             // else if (iter === maxIter && density > 80) { ... }
         }
     }

    return { elementCount, resolution, maxIterations: maxIter };
}

function generatePrimePattern(parent, options, palette) {
    const { viewportWidth: width, viewportHeight: height, complexity, density, repetition } = options;
    let elementCount = 0;
    const numElements = Math.max(10, Math.floor(100 * complexity * (density / 100) * repetition));
    const primes = [];
    let num = 2;
    while (primes.length < numElements) {
        if (isPrime(num)) primes.push(num);
        num++;
    }

    if (primes.length === 0) return { elementCount: 0, primeCount: 0 };

    const largestPrime = primes[primes.length - 1];

    // Use different layouts: Grid, Spiral, Random Walk?
    const layoutType = randomInt(0, 1); // 0: Grid, 1: Spiral

    if (layoutType === 0) { // Grid Layout
        const gridSize = Math.ceil(Math.sqrt(primes.length));
        const cellWidth = width / gridSize;
        const cellHeight = height / gridSize;

        for (let i = 0; i < primes.length; i++) {
            const prime = primes[i];
            const row = Math.floor(i / gridSize);
            const col = i % gridSize;
            const x = col * cellWidth + cellWidth / 2;
            const y = row * cellHeight + cellHeight / 2;
            // Size based on prime value relative to largest
            const size = Math.max(2, Math.min(cellWidth, cellHeight) * 0.8 * (Math.log(prime + 1) / Math.log(largestPrime + 1)) * options.scale);
            drawPrimeElement(parent, x, y, size, prime, options, palette);
            elementCount++;
        }
    } else { // Spiral Layout (Ulam spiral variation)
         let x = width / 2, y = height / 2;
         let step = Math.min(width, height) / Math.sqrt(primes.length) * 0.5; // Adjust step size
         let dx = step, dy = 0;
         let stepsTaken = 0, stepsLimit = 1, turnCounter = 0;

         for (let i = 0; i < primes.length; i++) {
             const prime = primes[i];
             // Size can be based on prime or index
             const size = Math.max(1, step * 0.8 * (Math.log(prime + 1) / Math.log(largestPrime + 1)) * options.scale);
             drawPrimeElement(parent, x, y, size, prime, options, palette);
             elementCount++;

             // Move to next position
             x += dx; y += dy;
             stepsTaken++;

             if (stepsTaken >= stepsLimit) {
                 stepsTaken = 0;
                 // Turn counter-clockwise: (dx, dy) -> (-dy, dx)
                 [dx, dy] = [-dy, dx];
                 turnCounter++;
                 if (turnCounter >= 2) { // Increase steps limit every 2 turns
                     turnCounter = 0;
                     stepsLimit++;
                 }
             }
         }
    }

     // Optional: Draw connections between twin primes (primes p, p+2)
     if (complexity > 6 && density > 60) {
         // Requires mapping primes back to their positions (more complex for spiral)
         // ... implementation omitted for brevity ...
     }

     return { elementCount, primeCount: primes.length, largestPrime };
}

// Helper for drawing elements in prime pattern
function drawPrimeElement(parent, x, y, size, primeValue, options, palette) {
    const fill = getRandomFill(palette, options);
    const stroke = options.strokeColor;
    const sw = options.strokeWeight;
    const op = options.opacity;
    // Shape based on prime modulo, e.g., prime % 4 or % 6
    const shapeType = primeValue % 5;
    switch (shapeType) {
        case 0: createSVGElement('circle', { cx:x, cy:y, r:size/2, fill, stroke, 'stroke-width': sw, opacity: op }, parent); break;
        case 1: createSVGElement('rect', { x:x-size/2, y:y-size/2, width:size, height:size, fill, stroke, 'stroke-width': sw, opacity: op }, parent); break;
        case 2: // Triangle
            const p = [`${x},${y-size/2}`, `${x+size/2*0.866},${y+size/4}`, `${x-size/2*0.866},${y+size/4}`].join(' ');
            createSVGElement('polygon', { points:p, fill, stroke, 'stroke-width': sw, opacity: op }, parent); break;
        case 3: // Star (simple 4-point)
            const p2 = [`${x},${y-size/2}`, `${x+size/4},${y}`, `${x},${y+size/2}`, `${x-size/4},${y}`].join(' ');
            createSVGElement('polygon', { points:p2, fill, stroke, 'stroke-width': sw, opacity: op }, parent); break;
        case 4: // Ring / Donut
            createSVGElement('circle', { cx:x, cy:y, r:size/2, fill:'none', stroke:fill, 'stroke-width': sw * 1.5, opacity: op }, parent);
             if (size > 4)
                createSVGElement('circle', { cx:x, cy:y, r:size/4, fill:options.bgColor || 'white', stroke:'none', opacity: 1 }, parent); // Punch hole
             break;

    }
}

// NEW Pattern: Trigonometric Waves
function generateTrigPattern(parent, options, palette) {
     const { viewportWidth: width, viewportHeight: height, complexity, density, repetition } = options;
     let elementCount = 0;
     const numWaves = Math.floor(complexity * repetition);
     const pointsPerWave = Math.floor(100 * (density / 100)) + 10;

    for (let i = 0; i < numWaves; i++) {
        const pathPoints = [];
        const amplitude = random(height * 0.05, height * 0.4) * options.scale;
        const frequency = random(0.5, complexity / 2);
        const phase = random(0, Math.PI * 2);
        const yOffset = random(amplitude, height - amplitude); // Center wave vertically
        const funcType = randomChoice(['sin', 'cos', 'tan']); // Choose trig function

        for (let j = 0; j <= pointsPerWave; j++) {
            const x = (j / pointsPerWave) * width;
            let y = yOffset;

            switch(funcType) {
                case 'sin':
                    y += Math.sin( (j / pointsPerWave) * Math.PI * 2 * frequency + phase) * amplitude;
                    break;
                 case 'cos':
                     y += Math.cos( (j / pointsPerWave) * Math.PI * 2 * frequency + phase) * amplitude;
                     break;
                 case 'tan':
                      // Handle tan carefully due to asymptotes
                      let tanVal = Math.tan( (j / pointsPerWave) * Math.PI * frequency + phase );
                      // Clamp extreme values to avoid huge jumps
                      tanVal = Math.max(-5, Math.min(5, tanVal)); // Clamp between -5 and 5
                      y += tanVal * amplitude * 0.2; // Scale down tan amplitude
                      // Skip points near asymptotes if needed (more complex)
                      break;
            }

             // Ensure y stays within bounds
            y = Math.max(0, Math.min(height, y));
            pathPoints.push(`${x},${y}`);
        }

         if (pathPoints.length > 1) {
             createSVGElement('path', {
                 d: `M ${pathPoints[0]} L ${pathPoints.slice(1).join(' L ')}`,
                 fill: 'none',
                 stroke: randomChoice(palette) || options.strokeColor,
                 'stroke-width': Math.max(0.5, options.strokeWeight * random(0.5, 1.5)),
                 opacity: options.opacity * random(0.7, 1)
             }, parent);
             elementCount++;
         }
    }
    return { elementCount, waves: numWaves, funcType: 'mixed' };
}


// NEW Pattern: Bezier Curves
function generateBezierPattern(parent, options, palette) {
    const { viewportWidth: width, viewportHeight: height, complexity, density, repetition } = options;
    let elementCount = 0;
    const numCurves = Math.floor(complexity * (density / 100) * 5 * repetition);

    for (let i = 0; i < numCurves; i++) {
        const x1 = random(0, width);
        const y1 = random(0, height);
        const x2 = random(0, width);
        const y2 = random(0, height);
        // Control points influence the curve shape
        const cx1 = random(0, width);
        const cy1 = random(0, height);
        const cx2 = random(0, width);
        const cy2 = random(0, height);

        // Use captured coordinates if available
        const startX = state.capturedX ?? x1;
        const startY = state.capturedY ?? y1;
        const endX = (state.capturedV && state.capturedV.x !== null) ? state.capturedV.x : x2;
        const endY = (state.capturedV && state.capturedV.y !== null) ? state.capturedV.y : y2;


         createSVGElement('path', {
             d: `M ${startX} ${startY} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${endX} ${endY}`, // Cubic Bezier
             fill: 'none',
             stroke: randomChoice(palette) || options.strokeColor,
             'stroke-width': Math.max(0.5, options.strokeWeight * random(0.5, 2)),
             opacity: options.opacity * random(0.5, 1)
         }, parent);
         elementCount++;
    }

    return { elementCount, curves: numCurves, type: 'Cubic Bezier' };
}

// NEW Pattern: Lissajous Curves
function generateLissajousPattern(parent, options, palette) {
    const { viewportWidth: width, viewportHeight: height, complexity, density, repetition } = options;
    let elementCount = 0;
    const numCurves = Math.floor(complexity * 0.5 * repetition) + 1;
    const steps = Math.floor(100 * (density / 100)) + 50; // Points per curve

    const centerX = width / 2;
    const centerY = height / 2;
    const radiusX = width * 0.4 * options.scale;
    const radiusY = height * 0.4 * options.scale;

    for (let i = 0; i < numCurves; i++) {
         // Frequencies determine the shape (integers often produce closed curves)
         const a = randomInt(1, complexity / 2 + 1);
         const b = randomInt(1, complexity / 2 + 1);
         // Phase difference
         const delta = Math.PI / randomChoice([1, 2, 3, 4, 6, 8]); // Common fractions of PI

        const pathPoints = [];
        for (let j = 0; j <= steps; j++) {
            const t = (j / steps) * Math.PI * 2 * repetition; // Time parameter, affected by repetition
            const x = centerX + radiusX * Math.sin(a * t + delta);
            const y = centerY + radiusY * Math.sin(b * t);
            pathPoints.push(`${x},${y}`);
        }

         if (pathPoints.length > 1) {
             createSVGElement('path', {
                 d: `M ${pathPoints[0]} L ${pathPoints.slice(1).join(' L ')}`,
                 fill: 'none',
                 stroke: randomChoice(palette) || options.strokeColor,
                 'stroke-width': Math.max(0.5, options.strokeWeight * random(0.8, 1.2)),
                 opacity: options.opacity * random(0.7, 1)
             }, parent);
             elementCount++;
         }
    }
     return { elementCount, curves: numCurves, stepsPerCurve: steps };
}


// ====================== Animation Functions ======================

function startAnimation() {
    if (!state.currentOptions.animation || state.isAnimating) return;

    const elements = dom.svg.querySelectorAll('circle, rect, ellipse, polygon, path');
    if (elements.length === 0) return;

    console.log("Starting animation...");
    state.isAnimating = true;
    const startTime = Date.now();
    const animationType = state.currentOptions.animationType;

    // Store original attributes if needed for reset or complex animation
    // elements.forEach(el => { el._originalAttrs = { ... }; });

    function animateFrame() {
        if (!state.isAnimating) return; // Stop if flag is cleared

        const elapsed = Date.now() - startTime;
        const phase = (elapsed % 5000) / 5000; // 0 to 1 cycle every 5 seconds

        elements.forEach((element, index) => {
            if (!element.parentElement) return; // Skip elements removed from DOM

             const individualPhase = (phase + (index / elements.length) * 0.5) % 1; // Offset phase per element
             const sinPhase = Math.sin(individualPhase * Math.PI * 2); // Value oscillating between -1 and 1

            try {
                switch(animationType) {
                    case 'pulse':
                        const originalR = parseFloat(element.getAttribute('r')) || parseFloat(element.getAttribute('width')) || 5;
                        const pulseFactor = 1 + sinPhase * 0.1 * (state.currentOptions.complexity / 10); // Pulse amount scales with complexity
                        if (element.tagName === 'circle') element.setAttribute('r', Math.max(1, originalR * pulseFactor));
                        // else if (element.tagName === 'rect') { /* Scale rect */ } // More complex
                        break;

                    case 'rotate':
                         // Simple rotation around center (might need origin calculation for paths/polygons)
                         let currentTransform = element.getAttribute('transform') || '';
                         // Remove previous rotation to avoid accumulation if needed
                         currentTransform = currentTransform.replace(/rotate\([^)]+\)/g, '').trim();
                         let bbox;
                         try { bbox = element.getBBox(); } catch(e) { bbox = {x:0, y:0, width:0, height:0}; }
                         const cx = bbox.x + bbox.width / 2;
                         const cy = bbox.y + bbox.height / 2;
                         element.setAttribute('transform', `${currentTransform} rotate(${phase * 360 * (index % 3 + 1)}, ${cx}, ${cy})`); // Different speeds
                        break;

                    case 'opacity':
                        const originalOpacity = parseFloat(element.getAttribute('opacity')) || state.currentOptions.opacity || 1;
                        element.setAttribute('opacity', Math.max(0.1, Math.min(1, originalOpacity * (0.7 + (sinPhase + 1) * 0.15)))); // Fade between 0.7 and 1.0 of original
                        break;

                     case 'morph': // Very simple morph - e.g., change stroke width
                         const originalSW = parseFloat(element.getAttribute('stroke-width')) || state.currentOptions.strokeWeight || 1;
                          if (originalSW > 0) {
                              element.setAttribute('stroke-width', Math.max(0.1, originalSW * (1 + sinPhase * 0.3)));
                          }
                         break;
                }
            } catch (e) {
                 // console.warn("Animation error for element:", element.tagName, e);
                 // Ignore errors for elements that might not have the animated attribute (like <g>)
            }
        });

        state.animationFrame = requestAnimationFrame(animateFrame);
    }

    state.animationFrame = requestAnimationFrame(animateFrame);
}

function stopAnimation() {
    if (state.animationFrame) {
        cancelAnimationFrame(state.animationFrame);
        state.animationFrame = null;
    }
    if (state.isAnimating) {
        console.log("Stopping animation.");
        state.isAnimating = false;
         // Optional: Reset elements to original state if attributes were stored
         // dom.svg.querySelectorAll(...).forEach(el => { /* reset attributes */ });
    }
}


// ====================== UI Interaction Functions ======================

function updateUIFromState() {
     // Update range slider displays (redundant if input event listeners work)
     // dom.complexityDisplay.textContent = dom.complexity.value; ... etc

     // Update captured coords display
     let capturedText = "";
     if (state.capturedX !== null) capturedText += ` X: ${state.capturedX.toFixed(0)}`;
     if (state.capturedY !== null) capturedText += ` Y: ${state.capturedY.toFixed(0)}`;
     if (state.capturedV.x !== null) capturedText += ` V: (${state.capturedV.x.toFixed(0)}, ${state.capturedV.y.toFixed(0)})`;
     dom.capturedCoords.textContent = capturedText.trim();

     // Update viewport inputs based on state
     dom.customWidth.value = state.viewportWidth;
     dom.customHeight.value = state.viewportHeight;
     // Try to match state to preset dropdown
      const currentViewport = `${state.viewportWidth}x${state.viewportHeight}`;
      let matchedPreset = 'custom';
      for (const option of dom.viewportPreset.options) {
          if (option.value !== 'custom' && option.textContent.includes(currentViewport)) {
              matchedPreset = option.value;
              break;
          }
      }
      dom.viewportPreset.value = matchedPreset;

      // Update animation toggle state
      dom.animation.checked = state.currentOptions.animation ?? false;
}

function updateMathInfo(info) {
    if (!info) {
        dom.mathOutput.innerHTML = 'No data.';
        return;
    }
    let html = '';
    // Basic info
    html += `<div><strong>Generator:</strong> ${info.generator || 'N/A'}</div>`;
    html += `<div><strong>Layers:</strong> ${info.layers || 1}</div>`;
    html += `<div><strong>Viewport:</strong> ${info.viewport || 'N/A'}</div>`;
    html += `<div><strong>Total Elements:</strong> ${formatNumber(info.totalElements || 0)}</div>`;

    // Detailed layer info (if available)
    if (info.details) {
         html += '<hr><h4>Layer Details:</h4>';
         for (const layerKey in info.details) {
              html += `<div><strong>${layerKey}:</strong> `;
              const layerInfo = info.details[layerKey];
              const details = Object.entries(layerInfo)
                  .filter(([key]) => key !== 'elementCount') // Exclude elementCount as it's summarized
                  .map(([key, value]) => `${key}: ${typeof value === 'number' ? value.toFixed(2) : value}`)
                  .join(', ');
              html += `${details} (${layerInfo.elementCount || 0} elements)</div>`;
         }
    }

     // Add captured coordinate info
     if (state.capturedX !== null || state.capturedY !== null || state.capturedV.x !== null) {
          html += '<hr><h4>Captured Coords:</h4>';
          if (state.capturedX !== null) html += `<div>X: ${state.capturedX.toFixed(2)}</div>`;
          if (state.capturedY !== null) html += `<div>Y: ${state.capturedY.toFixed(2)}</div>`;
          if (state.capturedV.x !== null) html += `<div>V: (${state.capturedV.x.toFixed(2)}, ${state.capturedV.y.toFixed(2)})</div>`;
     }

     if (info.error) {
        html += `<hr><div style="color: red;"><strong>Error:</strong> ${info.error}</div>`;
     }


    dom.mathOutput.innerHTML = html;
}

function updateSVGStats(elementCount) {
    const svgString = dom.svg.outerHTML || "";
    const svgSizeKB = (svgString.length / 1024).toFixed(2);
    dom.svgStats.textContent = `Size: ${svgSizeKB} KB | Elements: ${formatNumber(elementCount || 0)}`;
}

function updateCursorInfo(event) {
    // Use pageX/pageY for consistency across browsers relative to the document
    // If you need coordinates relative to the SVG element, use getBoundingClientRect
     const rect = dom.svg.getBoundingClientRect();
     state.mouseX = event.clientX - rect.left; // X relative to SVG
     state.mouseY = event.clientY - rect.top; // Y relative to SVG

    dom.cursorInfo.textContent = `X: ${state.mouseX.toFixed(0)}, Y: ${state.mouseY.toFixed(0)}`;
}

function handleViewportChange() {
    const preset = dom.viewportPreset.value;
    let width, height;

    if (preset === 'custom') {
        width = parseInt(dom.customWidth.value) || 800;
        height = parseInt(dom.customHeight.value) || 600;
    } else {
        // Extract dimensions from preset option text or value
        const dimsMatch = dom.viewportPreset.options[dom.viewportPreset.selectedIndex].textContent.match(/(\d+)x(\d+)/);
         if (dimsMatch) {
            width = parseInt(dimsMatch[1]);
            height = parseInt(dimsMatch[2]);
         } else { // Fallback if matching fails
             width = 800; height = 600;
             dom.viewportPreset.value = 'custom'; // Switch back to custom
         }
         // Update custom inputs to reflect preset
         dom.customWidth.value = width;
         dom.customHeight.value = height;
    }

     // Ensure minimum dimensions
     width = Math.max(100, width);
     height = Math.max(100, height);


    state.viewportWidth = width;
    state.viewportHeight = height;

    // Update SVG element attributes
    dom.svg.setAttribute('width', width);
    dom.svg.setAttribute('height', height);
    dom.svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

    console.log(`Viewport set to: ${width}x${height}`);
    // Optionally regenerate SVG automatically on viewport change
    // generateSVG();
}

function captureX() {
    state.capturedX = state.mouseX;
    console.log("Captured X:", state.capturedX);
    updateUIFromState();
}
function captureY() {
    state.capturedY = state.mouseY;
     console.log("Captured Y:", state.capturedY);
    updateUIFromState();
}
function captureV() {
    state.capturedV = { x: state.mouseX, y: state.mouseY };
     console.log("Captured V:", state.capturedV);
    updateUIFromState();
}


// ====================== Download Functions ======================

function downloadSVG() {
    if (!state.svgData) {
        alert('Please generate an SVG first.');
        return;
    }

    // Create a blob from the SVG data
    const blob = new Blob([state.svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `jenVek-svg-${Date.now()}.svg`;
    document.body.appendChild(link); // Required for Firefox
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url); // Clean up
}

function downloadJSON() {
    const dataToSave = {
        timestamp: new Date().toISOString(),
        generationCount: state.generationCount,
        optionsUsed: state.currentOptions, // Save the options used for this gen
        mathProperties: state.mathInfo,
        capturedCoordinates: { // Include captured coords in JSON
             x: state.capturedX,
             y: state.capturedY,
             vector: state.capturedV
        },
        // Note: Raw SVG data is usually too large for math.json,
        // it's saved separately via downloadSVG()
        // If needed, add state.svgData here, but be mindful of size.
    };

    const jsonData = JSON.stringify(dataToSave, null, 2); // Pretty print
    const blob = new Blob([jsonData], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `jenVek-data-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// ====================== Event Listener Setup ======================

function initApp() {
    console.log("Initializing jenVek SVG Generator v2...");
    cacheDOMElements();
    loadColors().then(() => {
        // Set initial viewport and generate first SVG *after* colors are loaded
         handleViewportChange(); // Set initial size from default UI values
        generateSVG(); // Generate initial SVG on load
    });

    // --- Attach Event Listeners ---
    dom.generateBtn.addEventListener('click', generateSVG);
    dom.stopAnimationBtn.addEventListener('click', stopAnimation);
    dom.downloadSvgBtn.addEventListener('click', downloadSVG);
    dom.downloadJsonBtn.addEventListener('click', downloadJSON);

    // Viewport listeners
    dom.viewportPreset.addEventListener('change', handleViewportChange);
    dom.customWidth.addEventListener('change', handleViewportChange);
    dom.customHeight.addEventListener('change', handleViewportChange);


    // Capture buttons
    dom.captureXBtn.addEventListener('click', captureX);
    dom.captureYBtn.addEventListener('click', captureY);
    dom.captureVBtn.addEventListener('click', captureV);

    // Sidebar toggles
    dom.toggleLeftBtn.addEventListener('click', () => dom.leftSidebar.classList.toggle('collapsed'));
    dom.toggleRightBtn.addEventListener('click', () => dom.rightSidebar.classList.toggle('collapsed'));

    // Mouse movement tracking (relative to SVG)
    dom.svg.addEventListener('mousemove', updateCursorInfo);
    // Add touch support for coordinate capture if needed
    dom.svg.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
            updateCursorInfo(e.touches[0]); // Use first touch point
        }
        e.preventDefault(); // Prevent page scrolling while drawing/tracking on SVG
    }, { passive: false });


    // Optional: Regenerate on window resize (can be performance intensive)
    // window.addEventListener('resize', debounce(generateSVG, 300));
    window.addEventListener('resize', () => {
        // Simpler resize handling: just update viewport, user can regenerate
         handleViewportChange();
    });

     // Initial UI update
     updateUIFromState();

    console.log("App Initialized.");
}

// ====================== Initialization ======================
// Wait for the DOM to be fully loaded before initializing
document.addEventListener('DOMContentLoaded', initApp);