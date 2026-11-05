# Investment Revenue Projection App Requirements

## Purpose

Build a web app that estimates how an investment may grow over a chosen number of years when the investor enters a monthly investment amount, increases the yearly contribution annually, and earns a fixed assumed annual return. Present the projection as both a table and a graph.

## User inputs

- **Starting monthly investment:** The amount the user plans to invest each month. The app converts this to an annual contribution by multiplying by 12.
- **Annual investment increase:** Defaults to **10%**. The annual contribution increases by this percentage each year.
- **Annual return:** Defaults to **10%**.
- **Investment start year:** The calendar year of the first contribution.
- **Starting age:** The investor's age in the investment start year.
- **Wished retirement age:** The age at which the projection ends. This must be greater than the starting age.
- **Years until retirement:** Calculated as `wished retirement age - starting age`; it is not independently editable.

Inputs must be editable so users can compare different scenarios.

## Browser storage

- Automatically save the current valid calculator assumptions in browser storage when they change.
- Restore the saved assumptions when the app is opened again.
- Keep the last valid saved plan if a user temporarily enters invalid values; invalid input must not overwrite saved data.
- Show a clear status when the plan has been saved or browser storage cannot be read or written.
- Keep the monthly tracker checks saved independently by year.

## Import and export

- Users can export the current valid plan assumptions to a downloadable JSON file.
- Users can import a previously exported JSON plan.
- Validate the JSON format, version, required numeric fields, and assumption ranges before applying an imported plan.
- Do not change the current plan when an imported file is malformed or contains invalid assumptions; show a clear error message.
- The JSON format is:

  ```json
  {
    "format": "goodgrowth-investment-projection",
    "version": 2,
    "assumptions": {
      "startingMonthlyInvestment": 4166.67,
      "annualIncrease": 10,
      "annualReturn": 10,
      "startYear": 2026,
      "startAge": 30,
      "retirementAge": 60
    }
  }
  ```

- Version 1 files with `startingInvestment` in annual units remain importable; convert their annual amount to a monthly amount by dividing by 12 and rounding to the nearest cent.

## Appearance

- Provide an accessible toggle between light and dark themes.
- Apply the selected theme consistently to the page, controls, cards, chart, table, and supporting text.
- Save the user's theme preference in the browser and restore it on the next visit when storage is available.

## Monthly investment tracker

- Show a month-by-month checklist for a selectable calendar year, defaulting to the current year.
- Each month can be marked invested or not invested, and the tracker shows the monthly investment target from the current input and how many months are checked.
- Save check states in browser storage by calendar year so they remain available after reload and do not overwrite other years.
- Provide clear status feedback if saved tracker data cannot be read or check states cannot be saved.
- The tracker is a record of whether the user invested; marking a month does not change the projection calculation.

## Calculation rules

- For projection calculations, the yearly contribution is the starting monthly investment multiplied by 12.
- Contributions are modeled as one annual contribution, at the **beginning** of each year; monthly payment timing is not modeled separately.
- The first year's contribution is the converted annual amount.
- Each following year's contribution is the previous year's contribution multiplied by `1 + annual investment increase`.
- Each year's contribution earns that year's return.
- Returns compound annually at the selected fixed annual return.
- The first contribution occurs in the investment start year at the starting age. Each subsequent contribution is associated with the next calendar year and age.
- Project one contribution year for each year from the starting age up to, but not including, the wished retirement age.
- For year `n`:
  - `contribution[n] = starting monthly investment × 12 × (1 + annual investment increase)^(n - 1)`
  - `ending balance[n] = (ending balance[n - 1] + contribution[n]) × (1 + annual return)`
  - The balance before year 1 is zero.
- This is an estimate based on a constant return. It does not account for fees, taxes, inflation, or variable market performance.

## Results

### Summary

Show the following at the selected retirement age:

- Projected ending balance.
- Total amount contributed.
- Estimated investment growth, calculated as ending balance minus total contributions.

### Year-by-year table

Show one row per projected calendar year with:

- Calendar year.
- Investor age for that year.
- Contribution for that year.
- Total contributions to date.
- Projected ending balance.
- Estimated growth to date (ending balance minus total contributions to date).

### Graph

Show a graph across the projection period comparing:

- Total contributions to date.
- Projected ending balance.

The graph must make every individual projected year visible, include a marker for each annual value, and provide calendar-year labels and inspectable values. It must include a legend and update when inputs change.

## Interaction and validation

- Recalculate the summary, table, and graph when an input changes.
- Accept only valid positive starting investments, whole-number ages, a valid calendar start year, and a retirement age greater than the starting age.
- Accept annual investment increase and annual return as percentages; reject values that would make the contribution or balance calculations invalid.
- Display clear validation feedback and do not present invalid or stale projections as current results.
- Format monetary values consistently as currency, with sensible rounding for display while retaining adequate precision for calculations.

## Usability and accessibility

- Use clear labels and explain that the results are projections, not guaranteed returns.
- Make the app usable on desktop and mobile screen sizes.
- Ensure input controls, the table, and graph are accessible by keyboard and have appropriate accessible labels or text alternatives.

## Acceptance criteria

1. A user can enter a starting monthly investment, start year, starting age, and wished retirement age; the app calculates the annual amount internally, with the investment increase and return defaulting to 10%.
2. The projection duration is calculated from the difference between retirement age and starting age.
3. The app calculates the annual contribution increase and compounds each beginning-of-year contribution for that year.
4. The summary and year-by-year table show consistent contribution and balance values with calendar years and ages.
5. The graph displays both cumulative contributions and projected balance for every individual year.
6. Changing a valid input refreshes all results; invalid input is clearly identified and does not leave misleading results visible.
7. The app communicates the fixed-return assumption and the projection's limitations.
8. A valid plan can be exported to version 2 JSON and imported back with all assumptions and calculated results restored; version 1 annual-investment files remain supported.
9. Unsupported, malformed, or invalid JSON files are rejected with a clear message without changing the existing plan.
10. The theme toggle switches all app surfaces and the chart between readable light and dark color palettes, and restores the saved selection when possible.
11. The monthly tracker allows checking and unchecking each month, shows the number of invested months and monthly target, and retains independent checks for different years across reloads.
12. Valid calculator assumptions are saved automatically and restored on reload; invalid edits do not replace the last valid saved plan.
