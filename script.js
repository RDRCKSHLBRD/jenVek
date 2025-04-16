// SVG Generator by jenVek
// This script handles SVG generation using various mathematical patterns
// and provides an interactive UI for controlling the generation parameters

// ====================== Global Variables ======================

// UI state
const state = {
  mouseX: 0,
  mouseY: 0,
  lastUpdate: Date.now(),
  generationCount: 0,
  svgData: null,
  mathInfo: {},
  animationFrame: null,
  recursionCount: 0,
  maxAllowedRecursion: 8, // Safety limit
};

// Blue color palette from the reference image
const colors = {
  blues: [
      '#264651', // Submarine
      '#0E5360', // Details
      '#0297A1', // Beyond
      '#93bedb', // SmoothText
      '#304842', // Carmichael
      '#82B5B8', // Snow Clouds
      '#306CB8', // River
      '#367D9B', // Blue Pebble
      '#2666C6', // Ajna
      '#3DA3A8', // Turquoise
  ],
  // Add more color sets here if needed
};

// ====================== Utility Functions ======================

// Generate a random number between min and max
function random(min, max) {
  return Math.random() * (max - min) + min;
}

// Generate a random integer between min and max (inclusive)
function randomInt(min, max) {
  return Math.floor(random(min, max + 1));
}

// Get a random item from an array
function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Check if a number is prime
function isPrime(num) {
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

// Get the nth prime number (optimized for small values)
function getNthPrime(n) {
  const primes = [];
  let num = 2;
  
  while (primes.length < n) {
      if (isPrime(num)) {
          primes.push(num);
      }
      num++;
  }
  
  return primes[n - 1];
}

// Get the nth Fibonacci number
function fibonacci(n) {
  if (n <= 0) return 0;
  if (n === 1) return 1;
  
  let a = 0, b = 1;
  for (let i = 2; i <= n; i++) {
      const temp = a + b;
      a = b;
      b = temp;
  }
  return b;
}

// Calculate golden ratio points
function goldenRatioPoint(index, totalPoints, radius) {
  const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // ~2.39996 radians or ~137.5 degrees
  const angle = index * goldenAngle;
  const distance = radius * Math.sqrt(index / totalPoints);
  
  return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance
  };
}

// Create SVG element with given tag and attributes
function createSVGElement(tag, attrs = {}) {
  const elem = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [key, value] of Object.entries(attrs)) {
      elem.setAttribute(key, value);
  }
  return elem;
}

// Generate a unique ID
function generateId() {
  return `svg-elem-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

// Format number with commas
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Get time-based value
function getTimeValue() {
  const now = new Date();
  return (now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()) / 86400;
}

// ====================== SVG Generation Functions ======================

// Create a random SVG pattern
function generateRandomPattern(svg, options) {
  const width = parseInt(svg.getAttribute('width'));
  const height = parseInt(svg.getAttribute('height'));
  const complexity = options.complexity;
  const density = options.density / 100;
  const palette = getColorPalette();
  
  // Clear existing content
  svg.innerHTML = '';
  
  // Add a background if specified
  if (options.bgColor && options.bgColor !== '#ffffff') {
      const bg = createSVGElement('rect', {
          x: 0,
          y: 0,
          width: width,
          height: height,
          fill: options.bgColor
      });
      svg.appendChild(bg);
  }
  
  // Number of shapes based on complexity and density
  const numShapes = Math.floor(complexity * density * 20);
  
  // Create shapes
  for (let i = 0; i < numShapes; i++) {
      const shapeType = Math.random();
      let shape;
      
      if (shapeType < 0.3) {
          // Circle
          shape = createSVGElement('circle', {
              cx: random(0, width),
              cy: random(0, height),
              r: random(5, 30 * complexity),
              fill: getRandomFill(palette, options),
              stroke: options.strokeColor,
              'stroke-width': options.strokeWeight,
              opacity: options.opacity
          });
      } else if (shapeType < 0.6) {
          // Rectangle
          const rectWidth = random(10, 50 * complexity);
          const rectHeight = random(10, 50 * complexity);
          shape = createSVGElement('rect', {
              x: random(0, width - rectWidth),
              y: random(0, height - rectHeight),
              width: rectWidth,
              height: rectHeight,
              fill: getRandomFill(palette, options),
              stroke: options.strokeColor,
              'stroke-width': options.strokeWeight,
              opacity: options.opacity
          });
      } else {
          // Polygon
          const points = [];
          const numPoints = randomInt(3, 6);
          const centerX = random(0, width);
          const centerY = random(0, height);
          const radius = random(10, 40 * complexity);
          
          for (let j = 0; j < numPoints; j++) {
              const angle = (j / numPoints) * Math.PI * 2;
              const x = centerX + Math.cos(angle) * radius;
              const y = centerY + Math.sin(angle) * radius;
              points.push(`${x},${y}`);
          }
          
          shape = createSVGElement('polygon', {
              points: points.join(' '),
              fill: getRandomFill(palette, options),
              stroke: options.strokeColor,
              'stroke-width': options.strokeWeight,
              opacity: options.opacity
          });
      }
      
      svg.appendChild(shape);
  }
  
  return {
      elementCount: numShapes,
      complexity: complexity,
      uniqueColors: palette.length
  };
}

// Generate a recursive pattern
function generateRecursivePattern(svg, options) {
  const width = parseInt(svg.getAttribute('width'));
  const height = parseInt(svg.getAttribute('height'));
  const complexity = options.complexity;
  const maxDepth = Math.min(options.maxRecursion, state.maxAllowedRecursion);
  const palette = getColorPalette();
  
  // Clear existing content
  svg.innerHTML = '';
  
  // Add a background if specified
  if (options.bgColor && options.bgColor !== '#ffffff') {
      const bg = createSVGElement('rect', {
          x: 0,
          y: 0,
          width: width,
          height: height,
          fill: options.bgColor
      });
      svg.appendChild(bg);
  }
  
  // Reset recursion count
  state.recursionCount = 0;
  
  // Start recursion with initial shape
  const initialSize = Math.min(width, height) * 0.8;
  const group = createSVGElement('g', {
      transform: `translate(${width/2}, ${height/2})`
  });
  
  // Create initial shapes for recursion
  const shapes = [];
  if (Math.random() < 0.5) {
      // Start with circle
      shapes.push({
          type: 'circle',
          x: 0,
          y: 0,
          size: initialSize / 2,
          depth: 0
      });
  } else {
      // Start with rectangle
      shapes.push({
          type: 'rect',
          x: -initialSize / 2,
          y: -initialSize / 2,
          width: initialSize,
          height: initialSize,
          depth: 0
      });
  }
  
  // Process recursively
  shapes.forEach(shapeData => {
      recursiveDraw(group, shapeData, maxDepth, options, palette, complexity);
  });
  
  svg.appendChild(group);
  
  return {
      elementCount: state.recursionCount,
      recursionDepth: maxDepth,
      complexity: complexity
  };
}

// Recursive drawing function
function recursiveDraw(parent, shapeData, maxDepth, options, palette, complexity) {
  // Safety check - prevent excessive recursion
  if (state.recursionCount > 10000) {
      console.warn('Recursion limit reached!');
      return;
  }
  
  // Increment recursion counter
  state.recursionCount++;
  
  const { type, depth } = shapeData;
  
  // Create current shape
  let shape;
  if (type === 'circle') {
      shape = createSVGElement('circle', {
          cx: shapeData.x,
          cy: shapeData.y,
          r: shapeData.size,
          fill: getRandomFill(palette, options),
          stroke: options.strokeColor,
          'stroke-width': options.strokeWeight * (1 - depth / maxDepth),
          opacity: options.opacity * (1 - 0.2 * depth / maxDepth)
      });
  } else {
      shape = createSVGElement('rect', {
          x: shapeData.x,
          y: shapeData.y,
          width: shapeData.width,
          height: shapeData.height,
          fill: getRandomFill(palette, options),
          stroke: options.strokeColor,
          'stroke-width': options.strokeWeight * (1 - depth / maxDepth),
          opacity: options.opacity * (1 - 0.2 * depth / maxDepth)
      });
  }
  
  parent.appendChild(shape);
  
  // Stop if we've reached max depth
  if (depth >= maxDepth) return;
  
  // Calculate properties for children
  const childDepth = depth + 1;
  const childCount = Math.max(2, Math.floor(4 * Math.random() * (1 - depth / maxDepth)));
  const scaleFactor = 0.5 - (0.1 * depth);
  
  // Create children based on shape type
  if (type === 'circle') {
      const childRadius = shapeData.size * scaleFactor;
      
      for (let i = 0; i < childCount; i++) {
          const angle = (i / childCount) * Math.PI * 2 + depth * 0.2;
          const distance = shapeData.size * (0.7 - depth * 0.05);
          const childX = shapeData.x + Math.cos(angle) * distance;
          const childY = shapeData.y + Math.sin(angle) * distance;
          
          // Switch shape type for more variety
          const childType = Math.random() < 0.3 ? 'rect' : 'circle';
          
          if (childType === 'circle') {
              recursiveDraw(parent, {
                  type: 'circle',
                  x: childX,
                  y: childY,
                  size: childRadius,
                  depth: childDepth
              }, maxDepth, options, palette, complexity);
          } else {
              const rectSize = childRadius * 1.5;
              recursiveDraw(parent, {
                  type: 'rect',
                  x: childX - rectSize / 2,
                  y: childY - rectSize / 2,
                  width: rectSize,
                  height: rectSize,
                  depth: childDepth
              }, maxDepth, options, palette, complexity);
          }
      }
  } else {
      // For rectangles, divide into quadrants
      const childWidth = shapeData.width * scaleFactor;
      const childHeight = shapeData.height * scaleFactor;
      
      for (let i = 0; i < childCount; i++) {
          const offsetX = random(-0.3, 0.3) * shapeData.width;
          const offsetY = random(-0.3, 0.3) * shapeData.height;
          const childX = shapeData.x + shapeData.width/2 - childWidth/2 + offsetX;
          const childY = shapeData.y + shapeData.height/2 - childHeight/2 + offsetY;
          
          // Switch shape type for more variety
          const childType = Math.random() < 0.3 ? 'circle' : 'rect';
          
          if (childType === 'rect') {
              recursiveDraw(parent, {
                  type: 'rect',
                  x: childX,
                  y: childY,
                  width: childWidth,
                  height: childHeight,
                  depth: childDepth
              }, maxDepth, options, palette, complexity);
          } else {
              const radius = Math.min(childWidth, childHeight) / 2;
              recursiveDraw(parent, {
                  type: 'circle',
                  x: childX + childWidth / 2,
                  y: childY + childHeight / 2,
                  size: radius,
                  depth: childDepth
              }, maxDepth, options, palette, complexity);
          }
      }
  }
}

// Generate a grid pattern
function generateGridPattern(svg, options) {
  const width = parseInt(svg.getAttribute('width'));
  const height = parseInt(svg.getAttribute('height'));
  const complexity = options.complexity;
  const density = options.density / 100;
  const palette = getColorPalette();
  
  // Clear existing content
  svg.innerHTML = '';
  
  // Add a background if specified
  if (options.bgColor && options.bgColor !== '#ffffff') {
      const bg = createSVGElement('rect', {
          x: 0,
          y: 0,
          width: width,
          height: height,
          fill: options.bgColor
      });
      svg.appendChild(bg);
  }
  
  // Calculate grid size based on complexity and density
  const cellsPerSide = Math.max(2, Math.floor(complexity * 3 + 2));
  const cellWidth = width / cellsPerSide;
  const cellHeight = height / cellsPerSide;
  
  // Create a group for the grid
  const grid = createSVGElement('g');
  
  // Create cells
  let elementCount = 0;
  for (let row = 0; row < cellsPerSide; row++) {
      for (let col = 0; col < cellsPerSide; col++) {
          // Skip some cells based on density
          if (Math.random() > density) continue;
          
          const x = col * cellWidth;
          const y = row * cellHeight;
          
          // Randomize what to draw in each cell
          const cellType = Math.random();
          let cell;
          
          if (cellType < 0.25) {
              // Circle
              cell = createSVGElement('circle', {
                  cx: x + cellWidth / 2,
                  cy: y + cellHeight / 2,
                  r: Math.min(cellWidth, cellHeight) * random(0.2, 0.45),
                  fill: getRandomFill(palette, options),
                  stroke: options.strokeColor,
                  'stroke-width': options.strokeWeight,
                  opacity: options.opacity
              });
          } else if (cellType < 0.5) {
              // Rectangle
              const rectWidth = cellWidth * random(0.5, 0.9);
              const rectHeight = cellHeight * random(0.5, 0.9);
              cell = createSVGElement('rect', {
                  x: x + (cellWidth - rectWidth) / 2,
                  y: y + (cellHeight - rectHeight) / 2,
                  width: rectWidth,
                  height: rectHeight,
                  fill: getRandomFill(palette, options),
                  stroke: options.strokeColor,
                  'stroke-width': options.strokeWeight,
                  opacity: options.opacity
              });
          } else if (cellType < 0.75) {
              // Line
              const diagonal = Math.random() < 0.5;
              cell = createSVGElement('line', {
                  x1: x + (diagonal ? 0 : cellWidth / 2),
                  y1: y + (diagonal ? 0 : 0),
                  x2: x + (diagonal ? cellWidth : cellWidth / 2),
                  y2: y + (diagonal ? cellHeight : cellHeight),
                  stroke: randomChoice(palette),
                  'stroke-width': options.strokeWeight * random(1, 3),
                  opacity: options.opacity
              });
          } else {
              // Polygon
              const points = [];
              const vertices = randomInt(3, 6);
              const centerX = x + cellWidth / 2;
              const centerY = y + cellHeight / 2;
              const radius = Math.min(cellWidth, cellHeight) * 0.4;
              
              for (let i = 0; i < vertices; i++) {
                  const angle = (i / vertices) * Math.PI * 2;
                  const px = centerX + Math.cos(angle) * radius;
                  const py = centerY + Math.sin(angle) * radius;
                  points.push(`${px},${py}`);
              }
              
              cell = createSVGElement('polygon', {
                  points: points.join(' '),
                  fill: getRandomFill(palette, options),
                  stroke: options.strokeColor,
                  'stroke-width': options.strokeWeight,
                  opacity: options.opacity
              });
          }
          
          grid.appendChild(cell);
          elementCount++;
      }
  }
  
  // Add grid lines if complexity is high enough
  if (complexity > 3) {
      // Horizontal lines
      for (let row = 0; row <= cellsPerSide; row++) {
          const line = createSVGElement('line', {
              x1: 0,
              y1: row * cellHeight,
              x2: width,
              y2: row * cellHeight,
              stroke: options.strokeColor,
              'stroke-width': options.strokeWeight * 0.5,
              opacity: 0.3
          });
          grid.appendChild(line);
          elementCount++;
      }
      
      // Vertical lines
      for (let col = 0; col <= cellsPerSide; col++) {
          const line = createSVGElement('line', {
              x1: col * cellWidth,
              y1: 0,
              x2: col * cellWidth,
              y2: height,
              stroke: options.strokeColor,
              'stroke-width': options.strokeWeight * 0.5,
              opacity: 0.3
          });
          grid.appendChild(line);
          elementCount++;
      }
  }
  
  svg.appendChild(grid);
  
  return {
      elementCount: elementCount,
      gridSize: cellsPerSide,
      cellCount: cellsPerSide * cellsPerSide
  };
}

// Generate a quadtree pattern
function generateQuadtreePattern(svg, options) {
  const width = parseInt(svg.getAttribute('width'));
  const height = parseInt(svg.getAttribute('height'));
  const maxDepth = Math.min(options.maxRecursion, state.maxAllowedRecursion);
  const palette = getColorPalette();
  
  // Clear existing content
  svg.innerHTML = '';
  
  // Add a background if specified
  if (options.bgColor && options.bgColor !== '#ffffff') {
      const bg = createSVGElement('rect', {
          x: 0,
          y: 0,
          width: width,
          height: height,
          fill: options.bgColor
      });
      svg.appendChild(bg);
  }
  
  // Reset recursion counter
  state.recursionCount = 0;
  
  // Create the root node
  const rootQuad = {
      x: 0,
      y: 0,
      width: width,
      height: height,
      depth: 0
  };
  
  // Create a group for the quadtree
  const quadtreeGroup = createSVGElement('g');
  
  // Generate the quadtree recursively
  generateQuadtreeNode(quadtreeGroup, rootQuad, maxDepth, options, palette);
  
  svg.appendChild(quadtreeGroup);
  
  return {
      elementCount: state.recursionCount,
      maxDepth: maxDepth,
      complexity: options.complexity
  };
}

// Recursive function to generate quadtree nodes
function generateQuadtreeNode(parent, quad, maxDepth, options, palette) {
  const { x, y, width, height, depth } = quad;
  
  // Safety check - prevent excessive recursion
  if (state.recursionCount > 10000) {
      console.warn('Recursion limit reached!');
      return;
  }
  
  // Increment recursion counter
  state.recursionCount++;
  
  // Decide whether to subdivide this node
  const shouldSubdivide = depth < maxDepth && 
                          Math.random() < (0.6 + options.complexity * 0.04) && 
                          width > 5 && height > 5;
  
  if (shouldSubdivide) {
      // Subdivide into four quadrants
      const halfWidth = width / 2;
      const halfHeight = height / 2;
      
      // Create quadrants with slight displacement for more interest
      const displacement = (depth < maxDepth - 1) ? 0.1 : 0;
      const offsetX = random(-displacement, displacement) * halfWidth;
      const offsetY = random(-displacement, displacement) * halfHeight;
      
      const midX = x + halfWidth + offsetX;
      const midY = y + halfHeight + offsetY;
      
      // Top-left quadrant
      generateQuadtreeNode(parent, {
          x: x,
          y: y,
          width: halfWidth,
          height: halfHeight,
          depth: depth + 1
      }, maxDepth, options, palette);
      
      // Top-right quadrant
      generateQuadtreeNode(parent, {
          x: midX,
          y: y,
          width: halfWidth,
          height: halfHeight,
          depth: depth + 1
      }, maxDepth, options, palette);
      
      // Bottom-left quadrant
      generateQuadtreeNode(parent, {
          x: x,
          y: midY,
          width: halfWidth,
          height: halfHeight,
          depth: depth + 1
      }, maxDepth, options, palette);
      
      // Bottom-right quadrant
      generateQuadtreeNode(parent, {
          x: midX,
          y: midY,
          width: halfWidth,
          height: halfHeight,
          depth: depth + 1
      }, maxDepth, options, palette);
      
      // Draw the dividing lines
      const lineOpacity = 0.2 + (maxDepth - depth) * 0.1;
      const lineWeight = options.strokeWeight * (1 - depth / maxDepth);
      
      // Horizontal dividing line
      const hLine = createSVGElement('line', {
          x1: x,
          y1: midY,
          x2: x + width,
          y2: midY,
          stroke: options.strokeColor,
          'stroke-width': lineWeight,
          opacity: lineOpacity
      });
      parent.appendChild(hLine);
      
      // Vertical dividing line
      const vLine = createSVGElement('line', {
          x1: midX,
          y1: y,
          x2: midX,
          y2: y + height,
          stroke: options.strokeColor,
          'stroke-width': lineWeight,
          opacity: lineOpacity
      });
      parent.appendChild(vLine);
  } else {
      // Create a leaf node
      // Choose a shape based on depth and randomness
      const shapeType = (depth % 3) + Math.floor(Math.random() * 3);
      
      switch (shapeType) {
          case 0:
              // Rectangle
              const rect = createSVGElement('rect', {
                  x: x + width * 0.05,
                  y: y + height * 0.05,
                  width: width * 0.9,
                  height: height * 0.9,
                  fill: getRandomFill(palette, options),
                  stroke: options.strokeColor,
                  'stroke-width': options.strokeWeight * (1 - depth / maxDepth),
                  opacity: options.opacity
              });
              parent.appendChild(rect);
              break;
              
          case 1:
              // Circle
              const circle = createSVGElement('circle', {
                  cx: x + width / 2,
                  cy: y + height / 2,
                  r: Math.min(width, height) * 0.4,
                  fill: getRandomFill(palette, options),
                  stroke: options.strokeColor,
                  'stroke-width': options.strokeWeight * (1 - depth / maxDepth),
                  opacity: options.opacity
              });
              parent.appendChild(circle);
              break;
              
          case 2:
              // Ellipse
              const ellipse = createSVGElement('ellipse', {
                  cx: x + width / 2,
                  cy: y + height / 2,
                  rx: width * 0.4,
                  ry: height * 0.4,
                  fill: getRandomFill(palette, options),
                  stroke: options.strokeColor,
                  'stroke-width': options.strokeWeight * (1 - depth / maxDepth),
                  opacity: options.opacity
              });
              parent.appendChild(ellipse);
              break;
              
          case 3:
              // Diamond
              const diamond = createSVGElement('polygon', {
                  points: `${x + width/2},${y} ${x + width},${y + height/2} ${x + width/2},${y + height} ${x},${y + height/2}`,
                  fill: getRandomFill(palette, options),
                  stroke: options.strokeColor,
                  'stroke-width': options.strokeWeight * (1 - depth / maxDepth),
                  opacity: options.opacity
              });
              parent.appendChild(diamond);
              break;
              
          case 4:
              // Triangle
              const triangle = createSVGElement('polygon', {
                  points: `${x + width/2},${y} ${x + width},${y + height} ${x},${y + height}`,
                  fill: getRandomFill(palette, options),
                  stroke: options.strokeColor,
                  'stroke-width': options.strokeWeight * (1 - depth / maxDepth),
                  opacity: options.opacity
              });
              parent.appendChild(triangle);
              break;
      }
  }
}

// Generate a Fibonacci spiral pattern
function generateFibonacciPattern(svg, options) {
  const width = parseInt(svg.getAttribute('width'));
  const height = parseInt(svg.getAttribute('height'));
  const complexity = options.complexity;
  const density = options.density / 100;
  const palette = getColorPalette();
  
  // Clear existing content
  svg.innerHTML = '';
  
  // Add a background if specified
  if (options.bgColor && options.bgColor !== '#ffffff') {
      const bg = createSVGElement('rect', {
          x: 0,
          y: 0,
          width: width,
          height: height,
          fill: options.bgColor
      });
      svg.appendChild(bg);
  }
  
  // Create a group for the pattern
  const group = createSVGElement('g', {
      transform: `translate(${width/2}, ${height/2})`
  });
  
  // Calculate radius based on canvas size
  const radius = Math.min(width, height) * 0.45;
  
  // Number of elements based on complexity and density
  const numElements = Math.max(10, Math.floor(50 * complexity * density));
  
  // Generate Fibonacci spiral
  const phi = (1 + Math.sqrt(5)) / 2;
  const goldenAngle = 2 * Math.PI * (1 - 1 / phi);
  
  // Collect mathematical properties
  const mathProperties = {
      goldenRatio: phi.toFixed(8),
      goldenAngle: goldenAngle.toFixed(8) + " radians",
      elements: numElements
  };
  
  // Draw the spiral elements
  for (let i = 0; i < numElements; i++) {
      // Calculate position on the spiral
      const theta = i * goldenAngle;
      // Use sqrt for uniform density
      const distance = radius * Math.sqrt(i / numElements);
      const x = distance * Math.cos(theta);
      const y = distance * Math.sin(theta);
      
      // Size decreases as we go out (or by Fibonacci numbers)
      let size;
      if (i < 20) {
          // For the first few elements, use actual Fibonacci numbers for size
          size = fibonacci(20 - i) * radius * 0.01;
      } else {
          // For the rest, use a formula
          size = radius * 0.15 * (1 - i / numElements);
      }
      
      // Alternate between circles, squares, and other shapes
      const shapeType = i % 4;
      let element;
      
      switch (shapeType) {
          case 0:
              // Circle
              element = createSVGElement('circle', {
                  cx: x,
                  cy: y,
                  r: size,
                  fill: getRandomFill(palette, options),
                  stroke: options.strokeColor,
                  'stroke-width': options.strokeWeight,
                  opacity: options.opacity
              });
              break;
              
          case 1:
              // Square
              element = createSVGElement('rect', {
                  x: x - size / 2,
                  y: y - size / 2,
                  width: size,
                  height: size,
                  fill: getRandomFill(palette, options),
                  stroke: options.strokeColor,
                  'stroke-width': options.strokeWeight,
                  opacity: options.opacity,
                  transform: `rotate(${theta * 180 / Math.PI}, ${x}, ${y})`
              });
              break;
              
          case 2:
              // Triangle
              const points = [];
              for (let j = 0; j < 3; j++) {
                  const angle = theta + j * (2 * Math.PI / 3);
                  points.push(`${x + size * Math.cos(angle)},${y + size * Math.sin(angle)}`);
              }
              element = createSVGElement('polygon', {
                  points: points.join(' '),
                  fill: getRandomFill(palette, options),
                  stroke: options.strokeColor,
                  'stroke-width': options.strokeWeight,
                  opacity: options.opacity
              });
              break;
              
          case 3:
              // Ellipse
              element = createSVGElement('ellipse', {
                  cx: x,
                  cy: y,
                  rx: size,
                  ry: size * 0.6,
                  fill: getRandomFill(palette, options),
                  stroke: options.strokeColor,
                  'stroke-width': options.strokeWeight,
                  opacity: options.opacity,
                  transform: `rotate(${theta * 180 / Math.PI}, ${x}, ${y})`
              });
              break;
      }
      
      group.appendChild(element);
  }
  
  // Add connecting lines if complexity is high enough
  if (complexity > 5) {
      const path = [];
      for (let i = 0; i < numElements; i += Math.max(1, Math.floor(numElements / 50))) {
          const theta = i * goldenAngle;
          const distance = radius * Math.sqrt(i / numElements);
          const x = distance * Math.cos(theta);
          const y = distance * Math.sin(theta);
          
          if (i === 0) {
              path.push(`M ${x} ${y}`);
          } else {
              path.push(`L ${x} ${y}`);
          }
      }
      
      const spiralPath = createSVGElement('path', {
          d: path.join(' '),
          fill: 'none',
          stroke: options.strokeColor,
          'stroke-width': options.strokeWeight * 0.5,
          opacity: 0.5
      });
      
      group.appendChild(spiralPath);
  }
  
  svg.appendChild(group);
  
  return {
      ...mathProperties,
      elementCount: numElements
  };
}

// Generate a simplified Mandelbrot-inspired pattern
function generateMandelbrotPattern(svg, options) {
  const width = parseInt(svg.getAttribute('width'));
  const height = parseInt(svg.getAttribute('height'));
  const complexity = options.complexity;
  const palette = getColorPalette();
  
  // Clear existing content
  svg.innerHTML = '';
  
  // Add a background if specified
  if (options.bgColor && options.bgColor !== '#ffffff') {
      const bg = createSVGElement('rect', {
          x: 0,
          y: 0,
          width: width,
          height: height,
          fill: options.bgColor
      });
      svg.appendChild(bg);
  }
  
  // Create a group for the pattern
  const group = createSVGElement('g');
  
  // Grid resolution based on complexity
  const resolution = Math.max(10, Math.min(50, Math.floor(complexity * 5)));
  const cellWidth = width / resolution;
  const cellHeight = height / resolution;
  
  // Define Mandelbrot bounds (these values frame the most interesting parts)
  const xMin = -2.1;
  const xMax = 0.6;
  const yMin = -1.2;
  const yMax = 1.2;
  
  // Max iterations for Mandelbrot calculation
  const maxIter = Math.floor(complexity * 15) + 10;
  
  // Count for elements created
  let elementCount = 0;
  
  // Generate a grid of points and check if they're in the Mandelbrot set
  for (let row = 0; row < resolution; row++) {
      for (let col = 0; col < resolution; col++) {
          // Map grid coordinates to complex plane
          const x0 = xMin + (xMax - xMin) * (col / resolution);
          const y0 = yMin + (yMax - yMin) * (row / resolution);
          
          // Calculate Mandelbrot escape iterations
          let x = 0;
          let y = 0;
          let iter = 0;
          let x2 = 0;
          let y2 = 0;
          
          // Main mandelbrot iteration: z = z^2 + c
          while (x2 + y2 < 4 && iter < maxIter) {
              y = 2 * x * y + y0;
              x = x2 - y2 + x0;
              x2 = x * x;
              y2 = y * y;
              iter++;
          }
          
          // Only plot points that escape (for visual interest)
          if (iter < maxIter && iter > 0) {
              // Map iteration count to color
              const colorIndex = Math.floor((iter / maxIter) * palette.length);
              const fillColor = palette[Math.min(colorIndex, palette.length - 1)];
              
              // Calculate size based on iterations
              const size = Math.max(2, cellWidth * 0.8 * (1 - iter / maxIter));
              
              // Create shape based on position in grid
              const shapeType = (row + col) % 4;
              let element;
              
              const px = col * cellWidth + cellWidth / 2;
              const py = row * cellHeight + cellHeight / 2;
              
              switch (shapeType) {
                  case 0:
                      // Circle
                      element = createSVGElement('circle', {
                          cx: px,
                          cy: py,
                          r: size / 2,
                          fill: fillColor,
                          stroke: options.strokeColor,
                          'stroke-width': options.strokeWeight * 0.5,
                          opacity: options.opacity
                      });
                      break;
                      
                  case 1:
                      // Square
                      element = createSVGElement('rect', {
                          x: px - size / 2,
                          y: py - size / 2,
                          width: size,
                          height: size,
                          fill: fillColor,
                          stroke: options.strokeColor,
                          'stroke-width': options.strokeWeight * 0.5,
                          opacity: options.opacity
                      });
                      break;
                      
                  case 2:
                      // Rectangle or line
                      element = createSVGElement('rect', {
                          x: px - size / 4,
                          y: py - size / 2,
                          width: size / 2,
                          height: size,
                          fill: fillColor,
                          stroke: options.strokeColor,
                          'stroke-width': options.strokeWeight * 0.5,
                          opacity: options.opacity
                      });
                      break;
                      
                  case 3:
                      // Diamond
                      element = createSVGElement('polygon', {
                          points: `${px},${py-size/2} ${px+size/2},${py} ${px},${py+size/2} ${px-size/2},${py}`,
                          fill: fillColor,
                          stroke: options.strokeColor,
                          'stroke-width': options.strokeWeight * 0.5,
                          opacity: options.opacity
                      });
                      break;
              }
              
              group.appendChild(element);
              elementCount++;
          }
      }
  }
  
  svg.appendChild(group);
  
  return {
      resolution: resolution,
      maxIterations: maxIter,
      elementCount: elementCount
  };
}

// Generate a prime number based pattern
function generatePrimePattern(svg, options) {
  const width = parseInt(svg.getAttribute('width'));
  const height = parseInt(svg.getAttribute('height'));
  const complexity = options.complexity;
  const density = options.density / 100;
  const palette = getColorPalette();
  
  // Clear existing content
  svg.innerHTML = '';
  
  // Add a background if specified
  if (options.bgColor && options.bgColor !== '#ffffff') {
      const bg = createSVGElement('rect', {
          x: 0,
          y: 0,
          width: width,
          height: height,
          fill: options.bgColor
      });
      svg.appendChild(bg);
  }
  
  // Create a group for the pattern
  const group = createSVGElement('g');
  
  // Number of elements based on complexity and density
  const numElements = Math.floor(200 * complexity * density);
  
  // Prime number tracking
  const primes = [];
  let num = 2;
  while (primes.length < numElements) {
      if (isPrime(num)) {
          primes.push(num);
      }
      num++;
  }
  
  // Grid for positioning elements
  const gridSize = Math.ceil(Math.sqrt(numElements));
  const cellWidth = width / gridSize;
  const cellHeight = height / gridSize;
  
  // Generate elements based on prime properties
  for (let i = 0; i < primes.length; i++) {
      const prime = primes[i];
      
      // Position in a spiral pattern
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;
      
      const x = col * cellWidth + cellWidth / 2;
      const y = row * cellHeight + cellHeight / 2;
      
      // Size based on prime's value and position
      const primeLog = Math.log(prime) / Math.log(primes[primes.length - 1]);
      const size = Math.max(5, Math.min(cellWidth, cellHeight) * 0.8 * primeLog);
      
      // Choose shape based on prime modulo 4
      const shapeType = prime % 4;
      let element;
      
      switch (shapeType) {
          case 0:
              // Circle
              element = createSVGElement('circle', {
                  cx: x,
                  cy: y,
                  r: size / 2,
                  fill: getRandomFill(palette, options),
                  stroke: options.strokeColor,
                  'stroke-width': options.strokeWeight,
                  opacity: options.opacity
              });
              break;
              
          case 1:
              // Square
              element = createSVGElement('rect', {
                  x: x - size / 2,
                  y: y - size / 2,
                  width: size,
                  height: size,
                  fill: getRandomFill(palette, options),
                  stroke: options.strokeColor,
                  'stroke-width': options.strokeWeight,
                  opacity: options.opacity
              });
              break;
              
          case 2:
              // Triangle
              const points = [];
              for (let j = 0; j < 3; j++) {
                  const angle = j * (2 * Math.PI / 3);
                  points.push(`${x + size/2 * Math.cos(angle)},${y + size/2 * Math.sin(angle)}`);
              }
              element = createSVGElement('polygon', {
                  points: points.join(' '),
                  fill: getRandomFill(palette, options),
                  stroke: options.strokeColor,
                  'stroke-width': options.strokeWeight,
                  opacity: options.opacity
              });
              break;
              
          case 3:
              // Star
              const starPoints = [];
              const outerRadius = size / 2;
              const innerRadius = size / 4;
              const numPoints = 5;
              
              for (let j = 0; j < numPoints * 2; j++) {
                  const angle = j * Math.PI / numPoints;
                  const radius = j % 2 === 0 ? outerRadius : innerRadius;
                  starPoints.push(`${x + radius * Math.cos(angle)},${y + radius * Math.sin(angle)}`);
              }
              
              element = createSVGElement('polygon', {
                  points: starPoints.join(' '),
                  fill: getRandomFill(palette, options),
                  stroke: options.strokeColor,
                  'stroke-width': options.strokeWeight,
                  opacity: options.opacity
              });
              break;
      }
      
      group.appendChild(element);
  }
  
  // Draw connections between twin primes if complexity is high
  if (complexity > 5) {
      for (let i = 0; i < primes.length - 1; i++) {
          if (primes[i + 1] - primes[i] === 2) {
              // These are twin primes
              const row1 = Math.floor(i / gridSize);
              const col1 = i % gridSize;
              const x1 = col1 * cellWidth + cellWidth / 2;
              const y1 = row1 * cellHeight + cellHeight / 2;
              
              const row2 = Math.floor((i + 1) / gridSize);
              const col2 = (i + 1) % gridSize;
              const x2 = col2 * cellWidth + cellWidth / 2;
              const y2 = row2 * cellHeight + cellHeight / 2;
              
              const line = createSVGElement('line', {
                  x1: x1,
                  y1: y1,
                  x2: x2,
                  y2: y2,
                  stroke: options.strokeColor,
                  'stroke-width': options.strokeWeight * 0.5,
                  opacity: 0.4
              });
              
              group.appendChild(line);
          }
      }
  }
  
  svg.appendChild(group);
  
  return {
      primeCount: primes.length,
      largestPrime: primes[primes.length - 1],
      elementCount: primes.length
  };
}

// ====================== Fill & Color Functions ======================

// Get a random fill based on options
function getRandomFill(palette, options) {
  if (options.fillType === 'none') {
      return 'none';
  }
  
  if (options.fillType === 'gradient' && Math.random() < 0.3) {
      return createGradientFill(palette);
  }
  
  if (options.fillType === 'pattern' && Math.random() < 0.3) {
      return createPatternFill(palette);
  }
  
  // Default to solid color
  return randomChoice(palette);
}

// Create a gradient fill
function createGradientFill(palette) {
  const gradientId = `gradient-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const svg = document.getElementById('svg-canvas');
  
  // Check if defs element exists, create if not
  let defs = svg.querySelector('defs');
  if (!defs) {
      defs = createSVGElement('defs');
      svg.appendChild(defs);
  }
  
  // Create linear or radial gradient
  const isLinear = Math.random() < 0.7;
  let gradient;
  
  if (isLinear) {
      gradient = createSVGElement('linearGradient', {
          id: gradientId,
          x1: '0%',
          y1: '0%',
          x2: `${Math.floor(Math.random() * 100)}%`,
          y2: `${Math.floor(Math.random() * 100)}%`
      });
  } else {
      gradient = createSVGElement('radialGradient', {
          id: gradientId,
          cx: `${Math.floor(Math.random() * 100)}%`,
          cy: `${Math.floor(Math.random() * 100)}%`,
          r: `${Math.floor(50 + Math.random() * 50)}%`,
          fx: `${Math.floor(Math.random() * 100)}%`,
          fy: `${Math.floor(Math.random() * 100)}%`
      });
  }
  
  // Add gradient stops
  const numStops = 2 + Math.floor(Math.random() * 3);
  for (let i = 0; i < numStops; i++) {
      const offset = `${Math.floor((i / (numStops - 1)) * 100)}%`;
      const stop = createSVGElement('stop', {
          offset: offset,
          'stop-color': randomChoice(palette),
          'stop-opacity': 0.7 + Math.random() * 0.3
      });
      gradient.appendChild(stop);
  }
  
  defs.appendChild(gradient);
  return `url(#${gradientId})`;
}

// Create a pattern fill
function createPatternFill(palette) {
  const patternId = `pattern-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const svg = document.getElementById('svg-canvas');
  
  // Check if defs element exists, create if not
  let defs = svg.querySelector('defs');
  if (!defs) {
      defs = createSVGElement('defs');
      svg.appendChild(defs);
  }
  
  // Create pattern element
  const pattern = createSVGElement('pattern', {
      id: patternId,
      width: '10',
      height: '10',
      patternUnits: 'userSpaceOnUse',
      patternTransform: `rotate(${Math.floor(Math.random() * 90)})`
  });
  
  // Choose a pattern type
  const patternType = Math.floor(Math.random() * 5);
  switch (patternType) {
      case 0: // Dots
          const dot = createSVGElement('circle', {
              cx: '5',
              cy: '5',
              r: '2',
              fill: randomChoice(palette)
          });
          pattern.appendChild(dot);
          break;
          
      case 1: // Grid
          const hLine = createSVGElement('line', {
              x1: '0',
              y1: '5',
              x2: '10',
              y2: '5',
              stroke: randomChoice(palette),
              'stroke-width': '1'
          });
          const vLine = createSVGElement('line', {
              x1: '5',
              y1: '0',
              x2: '5',
              y2: '10',
              stroke: randomChoice(palette),
              'stroke-width': '1'
          });
          pattern.appendChild(hLine);
          pattern.appendChild(vLine);
          break;
          
      case 2: // Diagonal lines
          const line = createSVGElement('line', {
              x1: '0',
              y1: '0',
              x2: '10',
              y2: '10',
              stroke: randomChoice(palette),
              'stroke-width': '1'
          });
          pattern.appendChild(line);
          break;
          
      case 3: // Checkboard
          const rect1 = createSVGElement('rect', {
              x: '0',
              y: '0',
              width: '5',
              height: '5',
              fill: randomChoice(palette)
          });
          const rect2 = createSVGElement('rect', {
              x: '5',
              y: '5',
              width: '5',
              height: '5',
              fill: randomChoice(palette)
          });
          pattern.appendChild(rect1);
          pattern.appendChild(rect2);
          break;
          
      case 4: // Triangles
          const tri = createSVGElement('polygon', {
              points: '0,0 10,0 5,10',
              fill: randomChoice(palette)
          });
          pattern.appendChild(tri);
          break;
  }
  
  defs.appendChild(pattern);
  return `url(#${patternId})`;
}

// Get current color palette
function getColorPalette() {
  const paletteType = document.getElementById('color-palette').value;
  
  if (paletteType === 'blues') {
      return colors.blues;
  }
  
  if (paletteType === 'random') {
      // Generate a random palette
      const numColors = 5 + Math.floor(Math.random() * 5);
      const palette = [];
      
      for (let i = 0; i < numColors; i++) {
          palette.push(getRandomColor());
      }
      
      return palette;
  }
  
  // Default to blues
  return colors.blues;
}

// Generate a random color
function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

// ====================== UI Interaction Functions ======================

// Get current options from UI controls
function getOptions() {
  return {
      complexity: parseInt(document.getElementById('complexity').value),
      patternType: document.getElementById('pattern-type').value,
      density: parseInt(document.getElementById('density').value),
      maxRecursion: parseInt(document.getElementById('max-recursion').value),
      strokeWeight: parseFloat(document.getElementById('stroke-weight').value),
      scale: parseFloat(document.getElementById('scale').value),
      useCursor: document.getElementById('use-cursor').checked,
      useTime: document.getElementById('use-time').checked,
      animation: document.getElementById('animation').checked,
      fillType: document.getElementById('fill-type').value,
      opacity: parseFloat(document.getElementById('opacity').value),
      bgColor: document.getElementById('bg-color').value,
      strokeColor: document.getElementById('stroke-color').value
  };
}

// Generate SVG based on current options
function generateSVG() {
  // Cancel any running animation
  if (state.animationFrame) {
      cancelAnimationFrame(state.animationFrame);
      state.animationFrame = null;
  }
  
  const svg = document.getElementById('svg-canvas');
  const options = getOptions();
  
  // Apply scaling if needed
  if (options.scale !== 1) {
      const width = parseInt(svg.getAttribute('width'));
      const height = parseInt(svg.getAttribute('height'));
      svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  }
  
  // Seed with cursor data if enabled
  let result = {};
  if (options.useCursor) {
      Math.random = () => {
          const x = Math.sin(state.mouseX * state.mouseY) * 10000;
          return x - Math.floor(x);
      };
  }
  
  // Seed with time data if enabled
  if (options.useTime) {
      const timeValue = getTimeValue();
      const originalRandom = Math.random;
      Math.random = () => {
          return (originalRandom() + timeValue) % 1;
      };
  }
  
  // Generate pattern based on selected type
  try {
      switch (options.patternType) {
          case 'random':
              result = generateRandomPattern(svg, options);
              break;
          case 'recursive':
              result = generateRecursivePattern(svg, options);
              break;
          case 'grid':
              result = generateGridPattern(svg, options);
              break;
          case 'quadtree':
              result = generateQuadtreePattern(svg, options);
              break;
          case 'fibonacci':
              result = generateFibonacciPattern(svg, options);
              break;
          case 'mandelbrot':
              result = generateMandelbrotPattern(svg, options);
              break;
          case 'prime':
              result = generatePrimePattern(svg, options);
              break;
          default:
              result = generateRandomPattern(svg, options);
      }
      
      // Update math information
      state.mathInfo = result;
      updateMathInfo(result);
      
      // Update SVG stats
      const svgSize = new XMLSerializer().serializeToString(svg).length / 1024;
      document.getElementById('svg-stats').textContent = 
          `Size: ${svgSize.toFixed(2)} KB | Elements: ${result.elementCount || 0}`;
      
      // Store SVG data for export
      state.svgData = svg.outerHTML;
      state.generationCount++;
      
      // Start animation if enabled
      if (options.animation) {
          startAnimation(svg, options);
      }
      
  } catch (error) {
      console.error('Error generating SVG:', error);
      svg.innerHTML = `<text x="10" y="50" fill="red">Error: ${error.message}</text>`;
  }
  
  // Restore default Math.random
  Math.random = () => crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;
}

// Update math information display
function updateMathInfo(info) {
  const container = document.getElementById('math-output');
  let html = '';
  
  for (const [key, value] of Object.entries(info)) {
      if (key !== 'elementCount') {
          html += `<div><strong>${key}:</strong> ${value}</div>`;
      }
  }
  
  container.innerHTML = html || 'No mathematical properties available for this pattern.';
}

// Start animation for SVG elements
function startAnimation(svg, options) {
  // Simple animation that gradually changes properties of SVG elements
  const elements = svg.querySelectorAll('circle, rect, ellipse, polygon, path');
  const startTime = Date.now();
  
  function animate() {
      const elapsed = Date.now() - startTime;
      const phase = (elapsed % 5000) / 5000; // 0 to 1 every 5 seconds
      
      elements.forEach((element, index) => {
          const individualPhase = (phase + index / elements.length) % 1;
          
          // Apply different animations based on element type
          if (element.tagName === 'circle') {
              const originalR = parseFloat(element.getAttribute('r')) || 5;
              const pulseFactor = 0.8 + Math.sin(individualPhase * Math.PI * 2) * 0.2;
              element.setAttribute('r', originalR * pulseFactor);
          } else if (element.tagName === 'rect') {
              const transform = element.getAttribute('transform') || '';
              element.setAttribute('transform', transform + ` rotate(${individualPhase * 10}, ${element.getAttribute('x')}, ${element.getAttribute('y')})`);
          }
          
          // Change opacity for all elements
          const originalOpacity = parseFloat(element.getAttribute('opacity')) || 1;
          const opacityChange = originalOpacity * 0.2 * Math.sin(individualPhase * Math.PI * 2);
          element.setAttribute('opacity', originalOpacity + opacityChange);
      });
      
      state.animationFrame = requestAnimationFrame(animate);
  }
  
  animate();
}

// Download SVG file
function downloadSVG() {
  if (!state.svgData) {
      alert('Please generate an SVG first.');
      return;
  }
  
  const blob = new Blob([state.svgData], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `jenVek-svg-${Date.now()}.svg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Download JSON data

function downloadJSON() {
  if (!state.mathInfo) {
      alert('Please generate an SVG first.');
      return;
  }

  const jsonData = JSON.stringify({
      generationCount: state.generationCount,
      timestamp: new Date().toISOString(),
      mathProperties: state.mathInfo
  }, null, 2);

  const blob = new Blob([jsonData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `jenVek-math-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ====================== Event Listeners ======================

document.getElementById('generate-btn').addEventListener('click', generateSVG);
document.getElementById('download-btn').addEventListener('click', downloadSVG);
document.getElementById('download-json-btn').addEventListener('click', downloadJSON);

// Display slider values
document.querySelectorAll('input[type="range"]').forEach(input => {
  const span = input.parentElement.querySelector('.value-display');
  if (span) {
      input.addEventListener('input', () => {
          span.textContent = input.value;
      });
  }
});

// Toggle left sidebar
document.getElementById('toggle-left').addEventListener('click', () => {
  const left = document.querySelector('.left-sidebar');
  left.classList.toggle('collapsed');
});

// Toggle right sidebar
document.getElementById('toggle-right').addEventListener('click', () => {
  const right = document.querySelector('.right-sidebar');
  right.classList.toggle('collapsed');
});

// Toggle footer expansion
document.getElementById('toggle-footer').addEventListener('click', () => {
  document.querySelector('footer').classList.toggle('expanded');
});

// Mouse tracking for cursor-based generation
document.addEventListener('mousemove', (e) => {
  state.mouseX = e.clientX;
  state.mouseY = e.clientY;
  document.getElementById('cursor-info').textContent = `X: ${state.mouseX}, Y: ${state.mouseY}`;
});

// Auto-generate one on load
window.addEventListener('load', generateSVG);
