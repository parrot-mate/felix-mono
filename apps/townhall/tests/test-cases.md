# TownHall Test Cases

#### Test Case: Employee can search and open a product from the portal

- Scenario: A signed-in employee needs to find a product quickly.
- Preconditions: The app is running and the real `@pmate/erp-homepage-nav` table contains at least one product row.
- Steps:
  1. Open the TownHall homepage.
  2. Enter a keyword in the search box.
  3. Click a matching product card.
  4. Click the product entry button from the side panel.
- Expected Result: Search results narrow immediately, the side panel updates to the selected product, and the entry link opens successfully.

#### Test Case: Manager can create a new product record

- Scenario: A signed-in employee opens the management view and creates a new entry.
- Preconditions: The app is running, the management view is accessible, and the current environment can write to the real table.
- Steps:
  1. Switch to the management view.
  2. Fill in the product form with valid values.
  3. Save the form.
  4. Return to the portal view and search for the new product.
- Expected Result: The product is saved, appears in the portal list, and can be opened in the side panel.

#### Test Case: Local UI state is restored after refresh

- Scenario: A user chooses filters and a selected product, then refreshes.
- Preconditions: The browser can access localStorage and the real product list has loaded successfully.
- Steps:
  1. Apply a category filter.
  2. Select a product card.
  3. Refresh the page.
- Expected Result: The filter and selected product are restored without breaking the app shell.
