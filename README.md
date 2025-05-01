# Playwright Automated Testing Suite

This project contains automated test scripts for various testing scenarios using Playwright.

## Test Types

1. **Functional Testing** (`tests/functional.spec.js`)
   - Tests user interactions on an e-commerce website
   - Covers search functionality, adding to cart, and user registration

2. **UI Testing** (`tests/ui.spec.js`)
   - Tests layout, responsive design, validation feedback, and accessibility
   - Uses different viewport sizes to verify responsive behavior

3. **API Testing** (`tests/api.spec.js`)
   - Tests REST API endpoints using reqres.in demo API
   - Covers GET, POST, PUT, DELETE methods and error handling

4. **Database Testing** (`tests/database.spec.js`)
   - Uses SQLite to test database operations
   - Covers INSERT, UPDATE, DELETE and complex JOIN queries

## Getting Started

### Prerequisites

- Node.js (latest stable version recommended)
- npm (comes with Node.js)

### Installation

All dependencies should be installed. If not, run:

```bash
npm install
```

### Running Tests

Run all tests:

```bash
npx playwright test
```

Run a specific test file:

```bash
npx playwright test tests/functional.spec.js
```

Run tests with UI mode:

```bash
npx playwright test --ui
```

### UI Mode

Playwright UI mode provides an interactive way to:
- View test results in a graphical interface
- Debug tests with step-by-step execution
- Inspect DOM elements
- View test traces

To open UI mode:

1. Run `npx playwright test --ui`
2. A browser window will open showing the Playwright UI
3. Navigate through tests using the sidebar
4. Click on individual tests to see detailed results
5. Use the timeline to step through test execution
6. View screenshots and DOM snapshots at each step

### Generating New Tests

You can use Playwright's Codegen tool to record new tests:

```bash
npx playwright codegen <url>
```

Replace `<url>` with the website you want to test. This will open:
- A browser where you can interact with the website
- A window showing the generated test code 