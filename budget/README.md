# Budget Optimization System

A simple web app that helps users optimize their budget investment using the Fractional Knapsack greedy algorithm to maximize profit.

## Features

- Enter total budget and investment options (name, cost, profit)
- Dynamically add/remove investment options
- Calculate optimal selection using fractional knapsack algorithm
- Display results: total profit, budget used, remaining budget, selected items
- Visualize profit distribution with bar or pie chart (toggleable)
- Export results to CSV file
- Enhanced input validation with detailed error messages
- Dark mode toggle
- Load sample data for testing
- Mobile-friendly responsive design

## Folder Structure

```
budget/
├── index.html      # Main HTML file
├── styles.css      # CSS styles
├── script.js       # JavaScript logic
└── assets/         # (Optional) For additional assets
```

## How to Run

1. Open the `index.html` file in a web browser.
2. Enter your total budget.
3. Add investment options by filling in name, cost, and profit, or click "Add Item" for more.
4. Click "Calculate" to see the optimized results.
5. Use "Load Sample Data" to populate with example items.
6. Toggle dark mode with the button in the header.
7. Reset to start over.

## Algorithm

The app uses the Fractional Knapsack greedy algorithm:
1. Calculate profit-to-cost ratio for each item
2. Sort items by ratio in descending order
3. Select items fully if budget allows, or partially if needed
4. Maximize total profit within the budget constraint

## Technologies Used

- HTML5
- CSS3
- JavaScript (ES6+)
- Chart.js for data visualization