// A Star

const CellState = {
  Idle: 0,
  Wall: 1,
  Start: 2,
  End: 3,
};

class Cell {
  constructor(state) {
    this.state = state;
  }
}

class Grid {
  constructor(size) {
    this.size = size;
    this.cells = new Array(size * size);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        this.cells[y * size + x] = new Cell(CellState.Idle);
      }
    }

    this.setCellState(0, 0, CellState.Start);
    this.setCellState(size - 1, size - 1, CellState.End);
  }

  getCellState(x, y) {
    return this.cells[y * this.size + x].state;
  }

  setCellState(x, y, state) {
    this.cells[y * this.size + x].state = state;
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

  setTimeout(function () {
    requestAnimationFrame(render);
  }, 100);
}
requestAnimationFrame(render);
