/**
 * Sum Calculator Module
 * Provides sum calculation functionality with UI
 */

export function showSumCalculator(resultsContainer, onExit = null) {
    const sumCalculatorHTML = `
      <div class="sum-calculator-widget">
        <div class="calculator-header">
          <h3>Sum Calculator</h3>
          <p>Enter numbers separated by spaces, commas, or new lines</p>
        </div>
        
        <div class="calculator-input-section">
          <textarea 
            id="sum-numbers-input" 
            class="sum-input" 
            placeholder="e.g., 1, 2, 3, 4, 5 or 1 2 3 4 5"
            rows="3"
          ></textarea>
        </div>

        <div class="calculator-result">
          <div class="result-display">
            <span class="result-label">Sum:</span>
            <span id="sum-result" class="result-value">0</span>
          </div>
          <div id="sum-details" class="calculation-details"></div>
        </div>

        <div class="calculator-actions">
          <button id="sum-calculate-btn" class="action-btn primary">Calculate</button>
          <button id="sum-clear-btn" class="action-btn">Clear</button>
          <button id="sum-back-btn" class="action-btn">Back</button>
        </div>
      </div>
    `;

    resultsContainer.innerHTML = sumCalculatorHTML;
    setupSumCalculatorEvents(onExit);

    // Focus the input
    setTimeout(() => {
        document.getElementById("sum-numbers-input").focus();
    }, 100);
}

function setupSumCalculatorEvents(onExit = null) {
    const input = document.getElementById("sum-numbers-input");
    const calculateBtn = document.getElementById("sum-calculate-btn");
    const clearBtn = document.getElementById("sum-clear-btn");
    const backBtn = document.getElementById("sum-back-btn");

    // Calculate on button click
    calculateBtn.addEventListener("click", () => calculateSum());

    // Calculate on Enter key
    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.ctrlKey) {
            e.preventDefault();
            calculateSum();
        } else if (e.key === "Escape") {
            exitSumCalculator(onExit);
        }
    });

    // Clear button
    clearBtn.addEventListener("click", () => clearSumCalculator());

    // Back button
    backBtn.addEventListener("click", () => exitSumCalculator(onExit));

    // Auto-calculate on input
    let timeout;
    input.addEventListener("input", () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => calculateSum(), 300);
    });
}

function calculateSum() {
    const input = document.getElementById("sum-numbers-input");
    const resultSpan = document.getElementById("sum-result");
    const detailsDiv = document.getElementById("sum-details");

    try {
        const inputText = input.value.trim();

        if (!inputText) {
            resultSpan.textContent = "0";
            detailsDiv.textContent = "Enter numbers to calculate";
            return;
        }

        // Parse numbers from various separators
        const numbers = inputText
            .split(/[,\s\n\r]+/)
            .map((str) => str.trim())
            .filter((str) => str !== "")
            .map((str) => {
                const num = parseFloat(str);
                if (isNaN(num)) {
                    throw new Error(`"${str}" is not a valid number`);
                }
                return num;
            });

        if (numbers.length === 0) {
            resultSpan.textContent = "0";
            detailsDiv.textContent = "No valid numbers found";
            return;
        }

        const sum = numbers.reduce((acc, num) => acc + num, 0);

        // Update result
        resultSpan.textContent = sum.toLocaleString();

        // Show details
        const details = [
            `Numbers: ${numbers.join(" + ")}`,
            `Count: ${numbers.length}`,
            `Average: ${(sum / numbers.length).toFixed(2)}`,
        ].join(" • ");

        detailsDiv.textContent = details;
    } catch (error) {
        resultSpan.textContent = "Error";
        detailsDiv.textContent = error.message;
    }
}

function clearSumCalculator() {
    const input = document.getElementById("sum-numbers-input");
    const resultSpan = document.getElementById("sum-result");
    const detailsDiv = document.getElementById("sum-details");

    input.value = "";
    resultSpan.textContent = "0";
    detailsDiv.textContent = "";
    input.focus();
}

function exitSumCalculator(onExit = null) {
    if (onExit && typeof onExit === 'function') {
        onExit();
    } else if (window.ctrlSearchInstance) {
        window.ctrlSearchInstance.showEmptyState();
        window.ctrlSearchInstance.focusSearch();
    }
}