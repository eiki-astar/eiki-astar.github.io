// A Star

const CellState = {
  Idle: 0,
  Wall: 1,
  Start: 2,
  End: 3,
  Expanded: 4,
  Path: 5,
};

class Cell {
  constructor(x, y, state) {
    this.x = x;
    this.y = y;
    this.state = state;
    this.f = 0;
    this.g = 0;
    this.h = 0;
    this.parent = undefined;
  }
}

class Grid {
  constructor(size) {
    this.size = size;
    this.cells = new Array(size * size);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        this.cells[y * size + x] = new Cell(x, y, CellState.Idle);
      }
    }

    this.setCellState(0, 0, CellState.Start);
    this.setCellState(size - 1, size - 1, CellState.End);
  }

  findStart() {
    return this.findFirstWithState(CellState.Start);
  }

  findEnd() {
    return this.findFirstWithState(CellState.End);
  }

  findFirstWithState(state) {
    for (let cell of this.cells) {
      if (cell.state == state) {
        return cell;
      }
    }
  }

  getCell(x, y) {
    return this.cells[y * this.size + x];
  }

  getCellState(x, y) {
    return this.cells[y * this.size + x].state;
  }

  setCellState(x, y, state) {
    this.cells[y * this.size + x].state = state;
  }

  getNeighbors(x, y) {
    let neighbours = [];
    if (x > 0) {
      neighbours.push(this.getCell(x - 1, y));
    }
    if (x < this.size - 1) {
      neighbours.push(this.getCell(x + 1, y));
    }
    if (y > 0) {
      neighbours.push(this.getCell(x, y - 1));
    }
    if (y < this.size - 1) {
      neighbours.push(this.getCell(x, y + 1));
    }
    return neighbours.filter((cell) => cell.state != CellState.Wall);
  }

  setPath(path) {
    for (let cell of this.cells) {
      if (cell.state == CellState.Expanded) {
        cell.state = CellState.Idle;
      }
    }
    for (let node of path) {
      if (node.state != CellState.Start && node.state != CellState.End) {
        node.state = CellState.Path;
      }
    }
  }
}

// Manhattan distance from now
function heuristic(from, to) {
  let x = Math.abs(from.x - to.x);
  let y = Math.abs(from.y - to.y);
  return x + y;
}

const AStarState = {
  Searching: 0,
  Found: 1,
  NotFound: 2,
};

class AStar {
  constructor(grid) {
    this.grid = grid;

    this.openSet = [];
    this.closedSet = [];
    const start = grid.findStart();
    this.end = grid.findEnd();

    this.openSet.push(start);

    this.neighbors = [];
  }

  step() {
    if (this.neighbors.length > 0) {
      return this.stepNeighbors();
    }
    if (this.openSet.length <= 0) {
      return { state: AStarState.NotFound, path: [] };
    }

    let lowestIndex = 0;
    for (let i = 0; i < this.openSet.length; i++) {
      if (this.openSet[i].f < this.openSet[lowestIndex].f) {
        lowestIndex = i;
      }
    }
    this.current = this.openSet[lowestIndex];

    if (this.current === this.end) {
      let path = [];
      let temp = this.current.parent;
      path.push(temp);
      while (temp.parent) {
        path.push(temp.parent);
        temp = temp.parent;
      }
      return { state: AStarState.Found, path: path.reverse() };
    }

    this.openSet.splice(lowestIndex, 1);
    this.closedSet.push(this.current);

    this.neighbors = this.grid.getNeighbors(this.current.x, this.current.y);
    return this.stepNeighbors();
  }

  stepNeighbors() {
    let neighbor = this.neighbors.shift();
    if (!this.closedSet.includes(neighbor)) {
      let possibleG = this.current.g + 1;

      if (!this.openSet.includes(neighbor)) {
        this.openSet.push(neighbor);
      } else if (possibleG >= neighbor.g) {
        return { state: AStarState.Searching, path: [] };
      }

      neighbor.g = possibleG;
      neighbor.h = heuristic(neighbor, this.end);
      neighbor.f = neighbor.g + neighbor.h;
      neighbor.parent = this.current;
      if (
        neighbor.state != CellState.Start &&
        neighbor.state != CellState.End
      ) {
        neighbor.state = CellState.Expanded;
      }
    }
    return { state: AStarState.Searching, path: [] };
  }
}

let cellCount = 5;
let grid = new Grid(cellCount);

function initGrid(count) {
  grid = new Grid(count);
}

// UI

const cellCountSlider = document.getElementById("cellCountSlider");
const cellCountValue = document.getElementById("cellCountValue");

cellCountSlider.value = cellCount;
cellCountValue.textContent = cellCount;

cellCountSlider.addEventListener("input", (e) => {
  cellCountValue.textContent = e.target.value;
  cellCount = e.target.value;
  initGrid(cellCount);
});

const clearButton = document.getElementById("clearGrid");
clearButton.addEventListener("click", (_) => {
  initGrid(cellCount);
});

let currentSearch = undefined;
const runButton = document.getElementById("run");
runButton.addEventListener("click", (_) => {
  currentSearch = new AStar(grid);
  runButton.disabled = true;
});

let stepDelay = 1000;
const stepDelaySlider = document.getElementById("stepDelaySlider");
const stepDelayValue = document.getElementById("stepDelayValue");
stepDelaySlider.value = stepDelay;
stepDelayValue.textContent = stepDelay;
stepDelaySlider.addEventListener("input", (e) => {
  stepDelayValue.textContent = e.target.value;
  stepDelay = e.target.value;
});

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
let currentlyDraggedCell = undefined;

function getCellFromPoint(offsetX, offsetY) {
  const mainAxis = Math.min(canvas.clientWidth, canvas.clientHeight);
  const cellSize = mainAxis / cellCount;
  const x = Math.floor(offsetX / cellSize);
  const y = Math.floor(offsetY / cellSize);

  if (x < 0 || y < 0 || x >= cellCount || y >= cellCount) {
    return;
  }

  const state = grid.getCellState(x, y);
  return { x, y, state };
}

canvas.addEventListener("mousedown", (e) => {
  const { offsetX, offsetY } = e;
  const cell = getCellFromPoint(offsetX, offsetY);
  if (cell.state == CellState.Wall || cell.state == CellState.Idle) {
    toggleCell(cell.x, cell.y, cell.state);
    requestAnimationFrame(render);
  } else if (cell.state == CellState.Start || cell.state == CellState.End) {
    currentlyDraggedCell = cell;
  }
});
canvas.addEventListener("mouseup", (e) => {
  if (currentlyDraggedCell) {
    const { x, y, state } = getCellFromPoint(e.offsetX, e.offsetY);
    if (currentlyDraggedCell) {
      if (
        state != undefined &&
        state != CellState.Start &&
        state != CellState.End
      ) {
        grid.setCellState(x, y, currentlyDraggedCell.state);
        grid.setCellState(
          currentlyDraggedCell.x,
          currentlyDraggedCell.y,
          CellState.Idle,
        );
        requestAnimationFrame(render);
      }

      currentlyDraggedCell = undefined;
    }
  }
});

const observer = new ResizeObserver((_) => {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
});
observer.observe(canvas);

function toggleCell(x, y, state) {
  if (
    state === undefined ||
    state === CellState.Start ||
    state === CellState.End
  ) {
    return;
  }

  if (state == CellState.Wall) {
    grid.setCellState(x, y, CellState.Idle);
  } else {
    grid.setCellState(x, y, CellState.Wall);
  }
}

function renderGrid(ctx, w, h, step) {
  ctx.beginPath();
  for (var x = 0; x <= w; x += step) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
  }
  ctx.strokeStyle = "rgb(0,0,0)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.beginPath();
  for (var y = 0; y <= h; y += step) {
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
  }
  ctx.stroke();
}

function renderCells(ctx, grid, step) {
  for (let y = 0; y < grid.size; y++) {
    for (let x = 0; x < grid.size; x++) {
      switch (grid.getCellState(x, y)) {
        case CellState.Wall:
          ctx.fillStyle = "rgb(80,80,80)";
          ctx.fillRect(x * step, y * step, step, step);
          break;
        case CellState.Start:
          ctx.fillStyle = "rgb(0,255,0)";
          ctx.fillRect(x * step, y * step, step, step);
          break;
        case CellState.End:
          ctx.fillStyle = "rgb(255,0,0)";
          ctx.fillRect(x * step, y * step, step, step);
          break;
        case CellState.Expanded:
          ctx.fillStyle = "rgb(0,120,0)";
          ctx.fillRect(x * step, y * step, step, step);

          const cell = grid.getCell(x, y);
          ctx.fillStyle = "rgb(255,255,255)";
          ctx.fillText("G: " + cell.g, x * step + 5, y * step + 15);
          ctx.fillText("H: " + cell.h, x * step + 5, y * step + 25);
          ctx.fillText("F: " + cell.f, x * step + 5, y * step + 35);

          break;
        case CellState.Path:
          ctx.fillStyle = "rgb(0,0,120)";
          ctx.fillRect(x * step, y * step, step, step);
          break;
      }
    }
  }
}

function render() {
  const { width, height } = canvas;

  const mainAxis = Math.min(width, height);
  const cellSize = mainAxis / cellCount;

  ctx.clearRect(0, 0, width, height);
  renderCells(ctx, grid, cellSize);
  renderGrid(ctx, cellSize * cellCount, cellSize * cellCount, cellSize);

  if (currentSearch) {
    const { state, path } = currentSearch.step();
    switch (state) {
      case AStarState.Found:
        console.log("Found path: ", path);
        currentSearch = undefined;
        runButton.disabled = false;
        grid.setPath(path);
        break;
      case AStarState.NotFound:
        console.log("Could not find path");
        currentSearch = undefined;
        runButton.disabled = false;
        break;
    }
  }

  setTimeout(function () {
    requestAnimationFrame(render);
  }, stepDelay);
}
requestAnimationFrame(render);
