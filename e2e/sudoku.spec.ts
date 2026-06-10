import { test, expect, type Page } from "@playwright/test";

// ─── Helpers ────────────────────────────────────────────────────────────────

/** The board grid container */
function boardGrid(page: Page) {
  return page.locator(".grid-cols-6");
}

/** Get a cell button by row and column (0-indexed) */
function cell(page: Page, row: number, col: number) {
  return boardGrid(page).locator("button").nth(row * 6 + col);
}

/** Get the number pad button for a digit */
function numButton(page: Page, n: number) {
  return page
    .locator("button")
    .filter({ has: page.locator(`span:text-is("${n}")`) })
    .first();
}

/** Get the erase (✕) button on the number pad */
function eraseButton(page: Page) {
  // The erase button is the last button in the number pad area
  return page.locator(".flex.items-center.justify-center.gap-2 > button").last();
}

/** Get a toolbar button by its label text */
function toolButton(page: Page, label: string) {
  return page.locator("button").filter({ hasText: label });
}

/** Get a difficulty tab button */
function diffButton(page: Page, label: string) {
  return page.locator("button").filter({ hasText: new RegExp(`^${label}$`) });
}

/** Read the full board as a 2D number array from the DOM */
async function readBoard(page: Page): Promise<number[][]> {
  const board: number[][] = [];
  for (let r = 0; r < 6; r++) {
    const row: number[] = [];
    for (let c = 0; c < 6; c++) {
      const text = await cell(page, r, c).textContent();
      row.push(text?.trim() ? parseInt(text!.trim(), 10) : 0);
    }
    board.push(row);
  }
  return board;
}

/** Find a digit (1-6) that still has remaining slots on the board */
function findAvailableDigit(board: number[][]): number {
  const counts = new Array(7).fill(0);
  for (const row of board) {
    for (const v of row) {
      if (v >= 1 && v <= 6) counts[v]++;
    }
  }
  for (let n = 1; n <= 6; n++) {
    if (counts[n] < 6) return n;
  }
  return 1; // fallback
}

/** Count empty cells on the board */
function countEmpty(board: number[][]): number {
  let count = 0;
  for (const row of board) {
    for (const v of row) {
      if (v === 0) count++;
    }
  }
  return count;
}

// ─── Test Suite ─────────────────────────────────────────────────────────────

test.describe("六宫格数独", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  // ── 1. 页面加载与初始渲染 ────────────────────────────────────────────────

  test("页面标题和棋盘正确渲染", async ({ page }) => {
    await expect(page).toHaveTitle("六宫格数独");
    await expect(page.locator("h1")).toHaveText("六宫格数独");

    // 棋盘 36 个格子
    const cells = boardGrid(page).locator("button");
    await expect(cells).toHaveCount(36);

    // 数字面板 6 个数字按钮 + 1 个擦除按钮
    for (let n = 1; n <= 6; n++) {
      await expect(numButton(page, n)).toBeVisible();
    }
    await expect(eraseButton(page)).toBeVisible();
  });

  // ── 2. 初始棋盘状态 ─────────────────────────────────────────────────────

  test("初始棋盘有预填数字和空格", async ({ page }) => {
    const board = await readBoard(page);
    let filled = 0;
    let empty = 0;
    for (const row of board) {
      for (const v of row) {
        if (v === 0) empty++;
        else filled++;
      }
    }
    expect(filled).toBeGreaterThan(0);
    expect(empty).toBeGreaterThan(0);
    // 简单模式挖 10 个空格
    expect(empty).toBe(10);
  });

  // ── 3. 格子选择与高亮 ───────────────────────────────────────────────────

  test("点击格子选中并高亮同行/列/宫", async ({ page }) => {
    // 点击一个预填数字格子
    const board = await readBoard(page);
    let targetR = 0,
      targetC = 0;
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
        if (board[r][c] !== 0) {
          targetR = r;
          targetC = c;
          break;
        }
      }
      if (board[targetR][targetC] !== 0) break;
    }

    await cell(page, targetR, targetC).click();

    // 选中格子应有 bg-blue-100
    await expect(cell(page, targetR, targetC)).toHaveClass(/bg-blue-100/);

    // 同行格子应有高亮（bg-slate-50 或 bg-blue-50）
    const boxRow = Math.floor(targetR / 2) * 2;
    const boxCol = Math.floor(targetC / 3) * 3;
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
        if (r === targetR && c === targetC) continue;
        const inRow = r === targetR;
        const inCol = c === targetC;
        const inBox =
          r >= boxRow && r < boxRow + 2 && c >= boxCol && c < boxCol + 3;
        if (inRow || inCol || inBox) {
          await expect(cell(page, r, c)).toHaveClass(/bg-slate-50|bg-blue-50/);
        }
      }
    }
  });

  test("选择有数字的格子时，相同数字的格子也高亮", async ({ page }) => {
    const board = await readBoard(page);
    // 找到一个有数字的格子
    let targetR = 0,
      targetC = 0;
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
        if (board[r][c] !== 0) {
          targetR = r;
          targetC = c;
          break;
        }
      }
      if (board[targetR][targetC] !== 0) break;
    }

    const value = board[targetR][targetC];
    await cell(page, targetR, targetC).click();

    // 找另一个同值的格子，验证 bg-blue-50
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
        if (
          (r !== targetR || c !== targetC) &&
          board[r][c] === value
        ) {
          await expect(cell(page, r, c)).toHaveClass(/bg-blue-50/);
        }
      }
    }
  });

  // ── 4. 填入数字 ─────────────────────────────────────────────────────────

  test("点击数字面板填入数字到空格", async ({ page }) => {
    const board = await readBoard(page);
    // 找第一个空格
    let emptyR = 0,
      emptyC = 0;
    outer: for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
        if (board[r][c] === 0) {
          emptyR = r;
          emptyC = c;
          break outer;
        }
      }
    }

    const fillNum = findAvailableDigit(board);
    await cell(page, emptyR, emptyC).click();
    await numButton(page, fillNum).click();

    // 格子显示数字
    await expect(cell(page, emptyR, emptyC)).toHaveText(String(fillNum));
  });

  test("不能修改预填数字（初始格子）", async ({ page }) => {
    const board = await readBoard(page);
    // 找一个有数字的格子
    let filledR = 0,
      filledC = 0;
    outer: for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
        if (board[r][c] !== 0) {
          filledR = r;
          filledC = c;
          break outer;
        }
      }
    }

    const originalValue = board[filledR][filledC];
    await cell(page, filledR, filledC).click();

    // 尝试填入不同的数字（确保该数字按钮可用）
    const counts = new Array(7).fill(0);
    for (const row of board) {
      for (const v of row) {
        if (v >= 1 && v <= 6) counts[v]++;
      }
    }
    let differentNum = 1;
    for (let n = 1; n <= 6; n++) {
      if (n !== originalValue && counts[n] < 6) {
        differentNum = n;
        break;
      }
    }
    await numButton(page, differentNum).click();

    // 预填数字不应改变
    await expect(cell(page, filledR, filledC)).toHaveText(
      String(originalValue)
    );
  });

  test("未选中格子时点击数字面板无效果", async ({ page }) => {
    const boardBefore = await readBoard(page);
    // 不选中任何格子，直接点数字
    await numButton(page, 1).click();
    const boardAfter = await readBoard(page);
    expect(boardAfter).toEqual(boardBefore);
  });

  // ── 5. 擦除数字 ─────────────────────────────────────────────────────────

  test("点击擦除按钮清除用户填入的数字", async ({ page }) => {
    const board = await readBoard(page);
    let emptyR = 0,
      emptyC = 0;
    outer: for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
        if (board[r][c] === 0) {
          emptyR = r;
          emptyC = c;
          break outer;
        }
      }
    }

    const fillNum = findAvailableDigit(board);
    // 填入再擦除
    await cell(page, emptyR, emptyC).click();
    await numButton(page, fillNum).click();
    await expect(cell(page, emptyR, emptyC)).toHaveText(String(fillNum));

    await eraseButton(page).click();
    await expect(cell(page, emptyR, emptyC)).toHaveText("");
  });

  test("不能擦除预填数字", async ({ page }) => {
    const board = await readBoard(page);
    let filledR = 0,
      filledC = 0;
    outer: for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
        if (board[r][c] !== 0) {
          filledR = r;
          filledC = c;
          break outer;
        }
      }
    }

    await cell(page, filledR, filledC).click();
    await eraseButton(page).click();

    // 预填数字不变
    await expect(cell(page, filledR, filledC)).toHaveText(
      String(board[filledR][filledC])
    );
  });

  // ── 6. 错误检测 ─────────────────────────────────────────────────────────

  test("填入错误数字时格子显示错误样式", async ({ page }) => {
    const board = await readBoard(page);
    let emptyR = 0,
      emptyC = 0;
    outer: for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
        if (board[r][c] === 0) {
          emptyR = r;
          emptyC = c;
          break outer;
        }
      }
    }

    // 找同行已有的数字作为冲突值
    const rowValues = new Set(board[emptyR].filter((v) => v !== 0));
    if (rowValues.size > 0) {
      const wrongNum = [...rowValues][0];
      await cell(page, emptyR, emptyC).click();
      await numButton(page, wrongNum).click();

      // 点击其他格子取消选中，让错误样式可见（选中时 bg-blue-100 会覆盖）
      // 点一个不在同位置的格子
      const otherR = emptyR === 0 ? 5 : 0;
      const otherC = emptyC === 0 ? 5 : 0;
      await cell(page, otherR, otherC).click();

      // 错误格子应有红色背景和文字
      await expect(cell(page, emptyR, emptyC)).toHaveClass(/bg-red-50/);
      await expect(cell(page, emptyR, emptyC)).toHaveClass(/text-red-500/);
    }
  });

  // ── 7. 难度切换 ─────────────────────────────────────────────────────────

  test("切换难度到中等，空格数量增加", async ({ page }) => {
    const boardEasy = await readBoard(page);
    const emptyEasy = countEmpty(boardEasy);
    expect(emptyEasy).toBe(10);

    await diffButton(page, "中等").click();
    const boardMedium = await readBoard(page);
    const emptyMedium = countEmpty(boardMedium);
    expect(emptyMedium).toBe(16);
  });

  test("切换难度到困难，空格数量最多", async ({ page }) => {
    await diffButton(page, "困难").click();
    const boardHard = await readBoard(page);
    const emptyHard = countEmpty(boardHard);
    expect(emptyHard).toBe(22);
  });

  test("难度按钮高亮当前选中项", async ({ page }) => {
    // 初始为"简单"
    const easyBtn = diffButton(page, "简单");
    await expect(easyBtn).toHaveClass(/bg-white/);

    // 切换到"中等"
    await diffButton(page, "中等").click();
    const medBtn = diffButton(page, "中等");
    await expect(medBtn).toHaveClass(/bg-white/);
  });

  test("切换难度后生成新棋盘", async ({ page }) => {
    const boardBefore = await readBoard(page);
    await diffButton(page, "中等").click();
    const boardAfter = await readBoard(page);

    // 棋盘应该完全不同（概率极高）
    const same = boardBefore.every((row, r) =>
      row.every((v, c) => v === boardAfter[r][c])
    );
    expect(same).toBe(false);
  });

  // ── 8. 撤销/重做 ────────────────────────────────────────────────────────

  test("撤销按钮恢复上一步操作", async ({ page }) => {
    const board = await readBoard(page);
    let emptyR = 0,
      emptyC = 0;
    outer: for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
        if (board[r][c] === 0) {
          emptyR = r;
          emptyC = c;
          break outer;
        }
      }
    }

    const fillNum = findAvailableDigit(board);
    await cell(page, emptyR, emptyC).click();
    await numButton(page, fillNum).click();
    await expect(cell(page, emptyR, emptyC)).toHaveText(String(fillNum));

    // 撤销
    await toolButton(page, "撤销").click();
    await expect(cell(page, emptyR, emptyC)).toHaveText("");
  });

  test("重做按钮恢复撤销的操作", async ({ page }) => {
    const board = await readBoard(page);
    let emptyR = 0,
      emptyC = 0;
    outer: for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
        if (board[r][c] === 0) {
          emptyR = r;
          emptyC = c;
          break outer;
        }
      }
    }

    const fillNum = findAvailableDigit(board);
    await cell(page, emptyR, emptyC).click();
    await numButton(page, fillNum).click();

    await toolButton(page, "撤销").click();
    await expect(cell(page, emptyR, emptyC)).toHaveText("");

    await toolButton(page, "重做").click();
    await expect(cell(page, emptyR, emptyC)).toHaveText(String(fillNum));
  });

  test("初始状态撤销按钮禁用", async ({ page }) => {
    const undoBtn = toolButton(page, "撤销");
    await expect(undoBtn).toBeDisabled();
  });

  test("没有撤销时重做按钮禁用", async ({ page }) => {
    const redoBtn = toolButton(page, "重做");
    await expect(redoBtn).toBeDisabled();
  });

  // ── 9. 提示功能 ─────────────────────────────────────────────────────────

  test("点击提示按钮显示提示信息", async ({ page }) => {
    await toolButton(page, "提示").click();

    // 应出现提示消息（格式：第X行第Y列 → N）
    const hintMsg = page.getByText(/第\d+行第\d+列.*→/);
    await expect(hintMsg).toBeVisible();
  });

  test("提示后自动在对应格子填入正确数字", async ({ page }) => {
    const boardBefore = await readBoard(page);

    await toolButton(page, "提示").click();

    // 棋盘应有一个新数字
    let changed = false;
    const boardAfter = await readBoard(page);
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
        if (boardBefore[r][c] === 0 && boardAfter[r][c] !== 0) {
          changed = true;
          break;
        }
      }
      if (changed) break;
    }
    expect(changed).toBe(true);
  });

  test("提示后对应格子被选中", async ({ page }) => {
    await toolButton(page, "提示").click();

    // 应该有一个格子被选中（bg-blue-100）
    const selectedCell = page.locator("button.bg-blue-100");
    await expect(selectedCell).toHaveCount(1);
  });

  // ── 10. 新游戏 ──────────────────────────────────────────────────────────

  test("新游戏按钮生成全新棋盘", async ({ page }) => {
    const boardBefore = await readBoard(page);

    await toolButton(page, "新游戏").click();

    const boardAfter = await readBoard(page);
    const same = boardBefore.every((row, r) =>
      row.every((v, c) => v === boardAfter[r][c])
    );
    expect(same).toBe(false);
  });

  test("新游戏重置棋盘状态", async ({ page }) => {
    // 填一个数字
    const board = await readBoard(page);
    let emptyR = 0,
      emptyC = 0;
    outer: for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
        if (board[r][c] === 0) {
          emptyR = r;
          emptyC = c;
          break outer;
        }
      }
    }

    const fillNum = findAvailableDigit(board);
    await cell(page, emptyR, emptyC).click();
    await numButton(page, fillNum).click();

    // 新游戏
    await toolButton(page, "新游戏").click();

    // 撤销按钮应禁用（历史清空）
    await expect(toolButton(page, "撤销")).toBeDisabled();
    // 没有完成提示
    await expect(page.locator("text=恭喜完成")).not.toBeVisible();
  });

  // ── 11. 键盘操作 ────────────────────────────────────────────────────────

  test("键盘数字键填入数字", async ({ page }) => {
    const board = await readBoard(page);
    let emptyR = 0,
      emptyC = 0;
    outer: for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
        if (board[r][c] === 0) {
          emptyR = r;
          emptyC = c;
          break outer;
        }
      }
    }

    await cell(page, emptyR, emptyC).click();
    await page.keyboard.press("3");
    await expect(cell(page, emptyR, emptyC)).toHaveText("3");
  });

  test("键盘 Backspace 擦除数字", async ({ page }) => {
    const board = await readBoard(page);
    let emptyR = 0,
      emptyC = 0;
    outer: for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
        if (board[r][c] === 0) {
          emptyR = r;
          emptyC = c;
          break outer;
        }
      }
    }

    await cell(page, emptyR, emptyC).click();
    await page.keyboard.press("2");
    await expect(cell(page, emptyR, emptyC)).toHaveText("2");

    await page.keyboard.press("Backspace");
    await expect(cell(page, emptyR, emptyC)).toHaveText("");
  });

  test("键盘方向键移动选择", async ({ page }) => {
    const board = await readBoard(page);
    // 找一个空格
    let emptyR = 0,
      emptyC = 0;
    outer: for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
        if (board[r][c] === 0) {
          emptyR = r;
          emptyC = c;
          break outer;
        }
      }
    }

    await cell(page, emptyR, emptyC).click();
    await expect(cell(page, emptyR, emptyC)).toHaveClass(/bg-blue-100/);

    // 按右键
    if (emptyC < 5) {
      await page.keyboard.press("ArrowRight");
      await expect(cell(page, emptyR, emptyC + 1)).toHaveClass(/bg-blue-100/);
    }
  });

  test("键盘 Ctrl+Z 撤销", async ({ page }) => {
    const board = await readBoard(page);
    let emptyR = 0,
      emptyC = 0;
    outer: for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
        if (board[r][c] === 0) {
          emptyR = r;
          emptyC = c;
          break outer;
        }
      }
    }

    await cell(page, emptyR, emptyC).click();
    await page.keyboard.press("5");
    await expect(cell(page, emptyR, emptyC)).toHaveText("5");

    await page.keyboard.press("Meta+z");
    await expect(cell(page, emptyR, emptyC)).toHaveText("");
  });

  test("键盘 Ctrl+Shift+Z 重做", async ({ page }) => {
    const board = await readBoard(page);
    let emptyR = 0,
      emptyC = 0;
    outer: for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
        if (board[r][c] === 0) {
          emptyR = r;
          emptyC = c;
          break outer;
        }
      }
    }

    await cell(page, emptyR, emptyC).click();
    await page.keyboard.press("4");
    await page.keyboard.press("Meta+z");
    await expect(cell(page, emptyR, emptyC)).toHaveText("");

    await page.keyboard.press("Meta+Shift+z");
    await expect(cell(page, emptyR, emptyC)).toHaveText("4");
  });

  // ── 12. 数字面板计数 ────────────────────────────────────────────────────

  test("数字面板显示剩余数量", async ({ page }) => {
    const board = await readBoard(page);
    // 统计 1 的数量
    let count1 = 0;
    for (const row of board) {
      for (const v of row) {
        if (v === 1) count1++;
      }
    }
    const remaining = 6 - count1;
    const btn = numButton(page, 1);
    if (remaining > 0) {
      await expect(btn).toContainText(String(remaining));
    } else {
      // 所有 1 都已放完，按钮应禁用
      await expect(btn).toBeDisabled();
    }
  });

  test("数字全部放完后对应按钮禁用", async ({ page }) => {
    // 找一个数字的剩余数量
    const board = await readBoard(page);
    const counts = new Array(7).fill(0);
    for (const row of board) {
      for (const v of row) {
        if (v >= 1 && v <= 6) counts[v]++;
      }
    }
    // 找到已经全部放置的数字
    const fullDigits = [];
    for (let n = 1; n <= 6; n++) {
      if (counts[n] === 6) fullDigits.push(n);
    }
    // 如果有已满的数字，验证按钮禁用
    for (const n of fullDigits) {
      await expect(numButton(page, n)).toBeDisabled();
    }
  });

  // ── 13. 完成检测 ────────────────────────────────────────────────────────

  test("连续使用提示填满棋盘后显示完成消息", async ({ page }) => {
    // 使用提示多次直到完成（最多 22 次对应困难难度，简单只需 10 次）
    for (let i = 0; i < 12; i++) {
      // 检查是否已完成
      const completed = page.locator("text=恭喜完成");
      if (await completed.isVisible()) break;
      await toolButton(page, "提示").click();
      // 等待状态更新
      await page.waitForTimeout(100);
    }

    await expect(page.locator("text=恭喜完成")).toBeVisible();
  });

  test("完成后提示按钮禁用", async ({ page }) => {
    // 用提示快速完成
    for (let i = 0; i < 12; i++) {
      const completed = page.locator("text=恭喜完成");
      if (await completed.isVisible()) break;
      await toolButton(page, "提示").click();
      await page.waitForTimeout(100);
    }

    await expect(toolButton(page, "提示")).toBeDisabled();
  });
});
