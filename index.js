// A Star

const CellState = {
  Idle: 0,
  Wall: 1,
  Start: 2,
  End: 3,
  Opened: 4,
  Closed: 5,
  Path: 6,
};

const Heuristic = {
  Manhattan: "Manhattan",
  Euclidean: "Euclidean",
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
    if (x > 0 && y > 0) {
      neighbours.push(this.getCell(x - 1, y - 1));
    }
    if (x < this.size - 1 && y < this.size - 1) {
      neighbours.push(this.getCell(x + 1, y + 1));
    }
    if (x > 0 && y < this.size - 1) {
      neighbours.push(this.getCell(x - 1, y + 1));
    }
    if (x < this.size - 1 && y > 0) {
      neighbours.push(this.getCell(x + 1, y - 1));
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

  resetSearch() {
    for (let cell of this.cells) {
      if (
        cell.state == CellState.Opened ||
        cell.state == CellState.Closed ||
        cell.state == CellState.Path
      ) {
        cell.state = CellState.Idle;
      }
    }
  }
}

// Manhattan distance from now
function heuristic(from, to, type) {
  let x = Math.abs(from.x - to.x);
  let y = Math.abs(from.y - to.y);
  switch (type) {
    case Heuristic.Manhattan:
      return x + y;
    case Heuristic.Euclidean:
      return Math.sqrt(x * x + y * y);
  }
  return 0;
}

const SearchState = {
  Searching: 0,
  StateChanged: 1,
  Found: 2,
  NotFound: 3,
};

class AStar {
  constructor(grid, heuristicType) {
    const start = grid.findStart();
    this.grid = grid;
    this.heuristic = heuristicType;
    this.neighbors = [];
    this.openSet = [start];
    this.closedSet = [];
    this.currentNode = undefined;
    this.start = start;
    this.end = grid.findEnd();
  }

  step() {
    if (this.neighbors.length > 0) {
      if (this.neighbors.length == 1) {
        this.stepNeighbors();
        return { state: SearchState.StateChanged, path: [] };
      }
      return this.stepNeighbors();
    }
    if (this.openSet.length <= 0) {
      return { state: SearchState.NotFound, path: [] };
    }

    this.currentNode = this.openSet[0];
    for (let i = 1; i < this.openSet.length; i++) {
      if (this.openSet[i].f <= this.currentNode.f) {
        if (this.openSet[i].h < this.currentNode.h) {
          this.currentNode = this.openSet[i];
        }
      }
    }

    let changed = false;
    this.openSet.splice(this.openSet.indexOf(this.currentNode), 1);
    if (!this.closedSet.includes(this.currentNode)) {
      this.closedSet.push(this.currentNode);
      if (
        this.currentNode.state != CellState.Start &&
        this.currentNode.state != CellState.End
      ) {
        changed = true;
        this.currentNode.state = CellState.Closed;
      }
    }

    if (this.currentNode == this.end) {
      return {
        state: SearchState.Found,
        path: this.retracePath(this.start, this.end),
      };
    }

    this.neighbors = this.grid.getNeighbors(
      this.currentNode.x,
      this.currentNode.y,
    );
    let state = changed ? SearchState.StateChanged : SearchState.Searching;
    return { state: state, path: [] };
  }

  stepNeighbors() {
    let neighbor = this.neighbors.pop();
    if (neighbor.state == CellState.Wall || this.closedSet.includes(neighbor)) {
      return { state: SearchState.Searching, path: [] };
    }

    let newCostToNeighbor =
      this.currentNode.g +
      heuristic(this.currentNode, neighbor, this.heuristic);
    if (newCostToNeighbor < neighbor.g || !this.openSet.includes(neighbor)) {
      neighbor.g = newCostToNeighbor;
      neighbor.h = heuristic(neighbor, this.end, this.heuristic);
      neighbor.f = neighbor.g + neighbor.h;
      neighbor.parent = this.currentNode;

      if (!this.openSet.includes(neighbor)) {
        if (
          neighbor.state != CellState.Start &&
          neighbor.state != CellState.End
        ) {
          neighbor.state = CellState.Opened;
        }
        this.openSet.push(neighbor);
      }
    }
    return { state: SearchState.Searching, path: [] };
  }

  retracePath(start, end) {
    let path = [];
    let current = end;
    while (current != start) {
      path.push(current);
      current = current.parent;
    }
    return path.reverse();
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

function resetSearch() {
  runButton.textContent = "Run";
  isRunning = false;
  currentSearch = undefined;
}

const resetButton = document.getElementById("clearGrid");
resetButton.addEventListener("click", (_) => {
  grid.resetSearch();
  resetSearch();
});
const clearWallsButton = document.getElementById("clearWalls");
clearWallsButton.addEventListener("click", (_) => {
  initGrid(cellCount);
  resetSearch();
});

let currentHeuristic = Heuristic.Manhattan;
const heuristicSelect = document.getElementById("heuristicPicker");
heuristicSelect.addEventListener("change", (e) => {
  currentHeuristic = e.target.value;
  resetSearch();
  grid.resetSearch();
});

let currentSearch = undefined;
let isRunning = false;
const runButton = document.getElementById("run");
runButton.addEventListener("click", (_) => {
  if (isRunning) {
    runButton.textContent = "Run";
    isRunning = false;
  } else {
    if (currentSearch == undefined) {
      currentSearch = new AStar(grid, currentHeuristic);
      grid.resetSearch();
    }
    runButton.textContent = "Pause";
    isRunning = true;
  }
});
const stepForward = document.getElementById("stepForward");
stepForward.addEventListener("click", (_) => {
  if (!isRunning) {
    if (currentSearch == undefined) {
      currentSearch = new AStar(grid, currentHeuristic);
      grid.resetSearch();
    }
    performStep();
    requestAnimationFrame(render);
  }
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
  if (isRunning) {
    return;
  }
  grid.resetSearch();
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
  if (isRunning) {
    return;
  }
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

function performStep() {
  while (currentSearch) {
    const { state, path } = currentSearch.step();
    switch (state) {
      case SearchState.StateChanged:
        return;
      case SearchState.Found:
        console.log("Found path: ", path);
        resetSearch();
        grid.setPath(path);
        break;
      case SearchState.NotFound:
        console.log("Could not find path");
        resetSearch();
        break;
    }
  }
}

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
      const cell = grid.getCell(x, y);

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
        case CellState.Opened:
          ctx.fillStyle = "rgb(0,120,0)";
          ctx.fillRect(x * step, y * step, step, step);

          ctx.fillStyle = "rgb(255,255,255)";
          ctx.fillText("G: " + cell.g, x * step + 5, y * step + 15);
          ctx.fillText("H: " + cell.h, x * step + 5, y * step + 25);
          ctx.fillText("F: " + cell.f, x * step + 5, y * step + 35);
          break;
        case CellState.Closed:
          ctx.fillStyle = "rgb(120,0,0)";
          ctx.fillRect(x * step, y * step, step, step);

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

  if (isRunning) {
    performStep();
  }

  setTimeout(function () {
    requestAnimationFrame(render);
  }, stepDelay);
}
requestAnimationFrame(render);
