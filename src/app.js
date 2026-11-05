"use strict";

const form = document.querySelector("#projection-form");
const investmentInput = document.querySelector("#starting-monthly-investment");
const increaseInput = document.querySelector("#annual-increase");
const returnInput = document.querySelector("#annual-return");
const startYearInput = document.querySelector("#start-year");
const startAgeInput = document.querySelector("#start-age");
const retirementAgeInput = document.querySelector("#retirement-age");
const durationInput = document.querySelector("#duration");
const errorMessage = document.querySelector("#form-error");
const exportButton = document.querySelector("#export-plan");
const importButton = document.querySelector("#import-plan");
const importFileInput = document.querySelector("#import-file");
const dataMessage = document.querySelector("#data-message");
const planStorageStatus = document.querySelector("#plan-storage-status");
const themeToggle = document.querySelector("#theme-toggle");
const themeIcon = document.querySelector("#theme-icon");
const themeLabel = document.querySelector("#theme-label");
const themeStatus = document.querySelector("#theme-status");
const endingBalanceOutput = document.querySelector("#ending-balance");
const endingCaption = document.querySelector("#ending-caption");
const projectionPeriod = document.querySelector("#projection-period");
const totalContributionsOutput = document.querySelector("#total-contributions");
const investmentGrowthOutput = document.querySelector("#investment-growth");
const projectionRows = document.querySelector("#projection-rows");
const chart = document.querySelector("#projection-chart");
const chartDescription = document.querySelector("#chart-description");
const trackerYearOutput = document.querySelector("#tracker-year");
const trackerProgress = document.querySelector("#tracker-progress");
const trackerTarget = document.querySelector("#tracker-target");
const monthGrid = document.querySelector("#month-grid");
const trackerStatus = document.querySelector("#tracker-status");
const previousTrackerYear = document.querySelector("#tracker-previous-year");
const nextTrackerYear = document.querySelector("#tracker-next-year");

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});
const compactCurrency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  notation: "compact",
  maximumFractionDigits: 1,
});
const svgNamespace = "http://www.w3.org/2000/svg";
const planStorageKey = "goodgrowth-investment-plan-v1";
const trackerStorageKey = "goodgrowth-monthly-investment-tracker-v1";
const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
let trackerYear = new Date().getFullYear();
let trackerYears = {};

function applyTheme(theme) {
  const isDark = theme === "dark";
  document.documentElement.dataset.theme = isDark ? "dark" : "light";
  themeToggle.setAttribute("aria-pressed", String(isDark));
  themeToggle.setAttribute("aria-label", `Switch to ${isDark ? "light" : "dark"} mode`);
  themeLabel.textContent = `${isDark ? "Light" : "Dark"} mode`;
  themeIcon.textContent = isDark ? "☀" : "☾";
  document.querySelector('meta[name="theme-color"]').content = isDark ? "#090b0d" : "#f5f7f4";
}

function initializeTheme() {
  let savedTheme = "light";
  try {
    const preference = localStorage.getItem("goodgrowth-theme");
    if (preference === "light" || preference === "dark") savedTheme = preference;
  } catch {
    themeStatus.textContent = "Theme preference could not be loaded in this browser.";
    themeStatus.hidden = false;
  }
  applyTheme(savedTheme);
}

function toggleTheme() {
  const theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(theme);
  themeStatus.hidden = true;
  try {
    localStorage.setItem("goodgrowth-theme", theme);
  } catch {
    themeStatus.textContent = "Theme changed, but this browser could not save your preference.";
    themeStatus.hidden = false;
  }
  updateProjection();
}

function readInput(input) {
  const value = input.value.trim();
  return value === "" ? Number.NaN : Number(value);
}

function showTrackerStatus(message, isError = false) {
  trackerStatus.textContent = message;
  trackerStatus.classList.toggle("tracker-status-error", isError);
  trackerStatus.hidden = false;
}

function isValidTrackerData(data) {
  if (data === null || typeof data !== "object" || Array.isArray(data) || data.version !== 1) return false;
  if (data.years === null || typeof data.years !== "object" || Array.isArray(data.years)) return false;
  return Object.entries(data.years).every(([year, months]) =>
    /^\d{4}$/.test(year)
    && Number(year) >= 1900
    && Number(year) <= 9999
    && Array.isArray(months)
    && months.length === 12
    && months.every((checked) => typeof checked === "boolean"),
  );
}

function initializeTracker() {
  try {
    const saved = localStorage.getItem(trackerStorageKey);
    if (saved === null) return;
    const data = JSON.parse(saved);
    if (!isValidTrackerData(data)) {
      showTrackerStatus("Saved tracker data is invalid. New checks will be saved over it.", true);
      return;
    }
    trackerYears = data.years;
  } catch {
    showTrackerStatus("Could not read saved tracker data. Checks may only last for this session.", true);
  }
}

function saveTracker() {
  try {
    localStorage.setItem(trackerStorageKey, JSON.stringify({ version: 1, years: trackerYears }));
    trackerStatus.hidden = true;
  } catch {
    showTrackerStatus("Could not save your checks in this browser. They may not persist after you leave.", true);
  }
}

function getCheckedMonths(year) {
  return trackerYears[year] || Array(12).fill(false);
}

function updateTrackerSummary() {
  const checkedCount = getCheckedMonths(trackerYear).filter(Boolean).length;
  trackerProgress.textContent = `${checkedCount} of 12 ${checkedCount === 1 ? "month" : "months"} invested`;
  const monthlyInvestment = readInput(investmentInput);
  trackerTarget.textContent = Number.isFinite(monthlyInvestment) && monthlyInvestment > 0
    ? currency.format(monthlyInvestment)
    : "—";
}

function renderTracker() {
  trackerYearOutput.textContent = String(trackerYear);
  previousTrackerYear.disabled = trackerYear <= 1900;
  nextTrackerYear.disabled = trackerYear >= 9999;
  const checkedMonths = getCheckedMonths(trackerYear);
  updateTrackerSummary();

  const items = document.createDocumentFragment();
  for (const [index, month] of monthNames.entries()) {
    const label = document.createElement("label");
    label.className = "month-item";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = checkedMonths[index];
    checkbox.setAttribute("aria-label", `${month} ${trackerYear}: mark monthly investment as invested`);
    checkbox.addEventListener("change", () => {
      const yearChecks = [...getCheckedMonths(trackerYear)];
      yearChecks[index] = checkbox.checked;
      trackerYears[trackerYear] = yearChecks;
      saveTracker();
      status.textContent = checkbox.checked ? "Invested" : "Not yet";
      status.classList.toggle("is-invested", checkbox.checked);
      updateTrackerSummary();
    });

    const monthName = document.createElement("span");
    monthName.className = "month-name";
    monthName.textContent = month;
    const status = document.createElement("span");
    status.className = checkbox.checked ? "month-status is-invested" : "month-status";
    status.textContent = checkbox.checked ? "Invested" : "Not yet";
    label.append(checkbox, monthName, status);
    items.append(label);
  }
  monthGrid.replaceChildren(items);
}

function clearResults() {
  endingBalanceOutput.textContent = "—";
  endingCaption.textContent = "Projection unavailable";
  totalContributionsOutput.textContent = "—";
  investmentGrowthOutput.textContent = "—";
  projectionRows.replaceChildren();
  chart.replaceChildren();
  chart.removeAttribute("aria-label");
  chartDescription.textContent = "";
  projectionPeriod.textContent = "Your estimated outcome, year by year.";
  document.querySelector("#summary").setAttribute("aria-label", "Projection unavailable while inputs are invalid");
}

function validateValues({ startingMonthlyInvestment, annualIncrease, annualReturn, startYear, startAge, retirementAge }) {
  const duration = retirementAge - startAge;

  if (!Number.isFinite(startingMonthlyInvestment) || startingMonthlyInvestment <= 0) {
    return { error: "Enter a starting monthly investment greater than zero." };
  }
  if (!Number.isFinite(annualIncrease) || annualIncrease < 0) {
    return { error: "Enter a yearly investment increase of 0% or more." };
  }
  if (!Number.isFinite(annualReturn) || annualReturn <= -100) {
    return { error: "Enter an annual return greater than -100%." };
  }
  if (!Number.isInteger(startYear) || startYear < 1900 || startYear > 9999) {
    return { error: "Enter a start year from 1900 to 9999." };
  }
  if (!Number.isInteger(startAge) || startAge < 0 || startAge > 99) {
    return { error: "Enter a starting age from 0 to 99." };
  }
  if (!Number.isInteger(retirementAge) || retirementAge < 1 || retirementAge > 100 || retirementAge <= startAge) {
    return { error: "Retirement age must be a whole number above your starting age and no more than 100." };
  }
  if (duration > 100 || startYear + duration - 1 > 9999) {
    return { error: "This age range or start year creates a projection that is too long to display." };
  }

  const startingYearlyInvestment = startingMonthlyInvestment * 12;
  if (!Number.isFinite(startingYearlyInvestment)) {
    return { error: "That monthly investment is too large to calculate. Enter a smaller amount." };
  }

  const plan = calculateProjection(startingYearlyInvestment, annualIncrease / 100, annualReturn / 100, duration, startYear, startAge);
  if (!plan || plan.some((year) => !Object.values(year).every(Number.isFinite))) {
    return { error: "These values grow beyond the range this calculator can display. Try a lower rate or shorter duration." };
  }

  return { plan };
}

function validateInputs() {
  return validateValues({
    startingMonthlyInvestment: readInput(investmentInput),
    annualIncrease: readInput(increaseInput),
    annualReturn: readInput(returnInput),
    startYear: readInput(startYearInput),
    startAge: readInput(startAgeInput),
    retirementAge: readInput(retirementAgeInput),
  });
}

function showPlanStorageStatus(message, isError = false) {
  planStorageStatus.textContent = message;
  planStorageStatus.classList.toggle("plan-storage-status-error", isError);
}

function initializePlan() {
  try {
    const saved = localStorage.getItem(planStorageKey);
    if (saved === null) return "";

    const data = JSON.parse(saved);
    const keys = ["startingMonthlyInvestment", "annualIncrease", "annualReturn", "startYear", "startAge", "retirementAge"];
    if (
      data === null
      || typeof data !== "object"
      || Array.isArray(data)
      || data.version !== 1
      || data.assumptions === null
      || typeof data.assumptions !== "object"
      || Array.isArray(data.assumptions)
      || keys.some((key) => typeof data.assumptions[key] !== "number" || !Number.isFinite(data.assumptions[key]))
    ) {
      return "Saved plan data is invalid. The current plan will be saved instead.";
    }

    const validation = validateValues(data.assumptions);
    if (validation.error) return "Saved plan data is invalid. The current plan will be saved instead.";

    investmentInput.value = String(data.assumptions.startingMonthlyInvestment);
    increaseInput.value = String(data.assumptions.annualIncrease);
    returnInput.value = String(data.assumptions.annualReturn);
    startYearInput.value = String(data.assumptions.startYear);
    startAgeInput.value = String(data.assumptions.startAge);
    retirementAgeInput.value = String(data.assumptions.retirementAge);
    return "";
  } catch {
    return "Could not read the saved plan. Browser storage may be unavailable.";
  }
}

function saveCurrentPlan() {
  try {
    localStorage.setItem(planStorageKey, JSON.stringify({
      version: 1,
      assumptions: getCurrentAssumptions(),
    }));
    showPlanStorageStatus("Your plan is saved in this browser.");
  } catch {
    showPlanStorageStatus("Could not save your plan. Browser storage may be unavailable.", true);
  }
}

function getCurrentAssumptions() {
  return {
    startingMonthlyInvestment: readInput(investmentInput),
    annualIncrease: readInput(increaseInput),
    annualReturn: readInput(returnInput),
    startYear: readInput(startYearInput),
    startAge: readInput(startAgeInput),
    retirementAge: readInput(retirementAgeInput),
  };
}

function showDataMessage(message, isError = false) {
  dataMessage.textContent = message;
  dataMessage.classList.toggle("data-message-error", isError);
  dataMessage.hidden = false;
}

function exportPlan() {
  const assumptions = getCurrentAssumptions();
  const validation = validateValues(assumptions);
  if (validation.error) {
    showDataMessage(`Fix the plan before exporting. ${validation.error}`, true);
    return;
  }

  const data = {
    format: "goodgrowth-investment-projection",
    version: 2,
    assumptions,
  };
  const file = new Blob([`${JSON.stringify(data, null, 2)}\n`], { type: "application/json" });
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = "goodgrowth-investment-plan.json";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showDataMessage("Your plan was exported as a JSON file.");
}

async function importPlan(file) {
  let data;
  try {
    data = JSON.parse(await file.text());
  } catch {
    showDataMessage("Could not read this file. Select a valid Goodgrowth plan JSON file.", true);
    return;
  }

  if (
    data === null
    || typeof data !== "object"
    || Array.isArray(data)
    || data.format !== "goodgrowth-investment-projection"
    || (data.version !== 1 && data.version !== 2)
    || data.assumptions === null
    || typeof data.assumptions !== "object"
    || Array.isArray(data.assumptions)
  ) {
    showDataMessage("This file is not a supported Goodgrowth plan JSON file.", true);
    return;
  }

  const assumptions = data.assumptions;
  const legacy = data.version === 1;
  const investmentKey = legacy ? "startingInvestment" : "startingMonthlyInvestment";
  const keys = [investmentKey, "annualIncrease", "annualReturn", "startYear", "startAge", "retirementAge"];
  if (keys.some((key) => typeof assumptions[key] !== "number" || !Number.isFinite(assumptions[key]))) {
    showDataMessage("The plan file is missing valid numeric assumptions.", true);
    return;
  }

  const importedAssumptions = {
    ...assumptions,
    startingMonthlyInvestment: legacy
      ? Math.round((assumptions.startingInvestment / 12) * 100) / 100
      : assumptions.startingMonthlyInvestment,
  };
  if (!Number.isFinite(importedAssumptions.startingMonthlyInvestment)) {
    showDataMessage("The plan file's investment amount is too large to import.", true);
    return;
  }

  const validation = validateValues(importedAssumptions);
  if (validation.error) {
    showDataMessage(`The plan file contains invalid assumptions. ${validation.error}`, true);
    return;
  }

  investmentInput.value = String(importedAssumptions.startingMonthlyInvestment);
  increaseInput.value = String(assumptions.annualIncrease);
  returnInput.value = String(assumptions.annualReturn);
  startYearInput.value = String(assumptions.startYear);
  startAgeInput.value = String(assumptions.startAge);
  retirementAgeInput.value = String(assumptions.retirementAge);
  updateProjection();
  showDataMessage("Plan imported and projection updated.");
}

function calculateProjection(startingInvestment, annualIncrease, annualReturn, duration, startYear, startAge) {
  const plan = [];
  let totalContributions = 0;
  let endingBalance = 0;

  for (let year = 1; year <= duration; year += 1) {
    const contribution = startingInvestment * ((1 + annualIncrease) ** (year - 1));
    totalContributions += contribution;
    endingBalance = (endingBalance + contribution) * (1 + annualReturn);
    const growth = endingBalance - totalContributions;
    plan.push({
      year,
      calendarYear: startYear + year - 1,
      age: startAge + year - 1,
      contribution,
      totalContributions,
      endingBalance,
      growth,
    });
  }

  return plan;
}

function appendSvgElement(parent, name, attributes, text) {
  const element = document.createElementNS(svgNamespace, name);
  for (const [key, value] of Object.entries(attributes)) {
    element.setAttribute(key, value);
  }
  if (text !== undefined) element.textContent = text;
  parent.append(element);
  return element;
}

function renderChart(plan) {
  const width = Math.max(760, plan.length * 42 + 80);
  const height = 280;
  const margin = { top: 15, right: 13, bottom: 34, left: 67 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const maximum = Math.max(...plan.map((year) => year.endingBalance), 1);
  const tickCount = 4;
  const x = (index) => margin.left + (index / Math.max(plan.length - 1, 1)) * plotWidth;
  const y = (value) => margin.top + plotHeight - (value / maximum) * plotHeight;
  const points = (key) => plan.map((year, index) => `${x(index)},${y(year[key])}`).join(" ");

  chart.setAttribute("viewBox", `0 0 ${width} ${height}`);
  chart.style.width = `${width}px`;
  chart.style.minWidth = "100%";
  chart.setAttribute("aria-label", `Projected value and total contributions over ${plan.length} years`);
  chart.replaceChildren();
  appendSvgElement(chart, "title", { id: "chart-title" }, "Projected investment growth");

  for (let tick = 0; tick <= tickCount; tick += 1) {
    const value = (maximum / tickCount) * tick;
    const tickY = y(value);
    appendSvgElement(chart, "line", {
      x1: margin.left,
      y1: tickY,
      x2: width - margin.right,
      y2: tickY,
      stroke: "var(--chart-grid)",
      "stroke-width": "1",
    });
    appendSvgElement(chart, "text", {
      x: margin.left - 10,
      y: tickY + 3,
      fill: "var(--chart-label)",
      "font-size": "9",
      "text-anchor": "end",
      "font-family": "DM Sans, sans-serif",
    }, compactCurrency.format(value));
  }

  const contributionsPoints = plan.map((year, index) => `${x(index)},${y(year.totalContributions)}`);
  const areaPoints = [
    `${x(0)},${y(plan[0].totalContributions)}`,
    ...plan.map((year, index) => `${x(index)},${y(year.endingBalance)}`),
    `${x(plan.length - 1)},${y(plan[plan.length - 1].totalContributions)}`,
    ...contributionsPoints.slice(0, -1).reverse(),
  ].join(" ");
  appendSvgElement(chart, "polygon", {
    points: areaPoints,
    fill: "var(--chart-area)",
    opacity: "0.78",
  });
  appendSvgElement(chart, "polyline", {
    points: points("totalContributions"),
    fill: "none",
    stroke: "var(--chart-contributions)",
    "stroke-width": "2.5",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
  });
  appendSvgElement(chart, "polyline", {
    points: points("endingBalance"),
    fill: "none",
    stroke: "var(--chart-value)",
    "stroke-width": "3",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
  });

  for (let index = 0; index < plan.length; index += 1) {
    const year = plan[index];
    const contributionPoint = appendSvgElement(chart, "circle", {
      cx: x(index),
      cy: y(year.totalContributions),
      r: "3.5",
      fill: "var(--chart-contributions)",
      stroke: "#fff",
      "stroke-width": "1.5",
    });
    appendSvgElement(contributionPoint, "title", {}, `Year ${year.calendarYear}, age ${year.age}: total invested ${currency.format(year.totalContributions)}`);
    const balancePoint = appendSvgElement(chart, "circle", {
      cx: x(index),
      cy: y(year.endingBalance),
      r: "4",
      fill: "var(--chart-value)",
      stroke: "#fff",
      "stroke-width": "1.5",
    });
    appendSvgElement(balancePoint, "title", {}, `Year ${year.calendarYear}, age ${year.age}: projected value ${currency.format(year.endingBalance)}`);
    appendSvgElement(chart, "text", {
      x: x(index),
      y: height - 9,
      fill: "var(--chart-label)",
      "font-size": plan.length > 35 ? "8" : "9",
      "text-anchor": "middle",
      "font-family": "DM Sans, sans-serif",
    }, String(year.calendarYear));
  }

  const finalYear = plan[plan.length - 1];
  chartDescription.textContent = `Each point is labeled by calendar year. The projection runs from ${plan[0].calendarYear} to ${finalYear.calendarYear}; the final projected value is ${currency.format(finalYear.endingBalance)} and total contributions are ${currency.format(finalYear.totalContributions)}.`;
}

function renderTable(plan) {
  const rows = document.createDocumentFragment();
  for (const year of plan) {
    const row = document.createElement("tr");
    const values = [
      { value: String(year.calendarYear) },
      { value: String(year.age) },
      { value: currency.format(year.contribution) },
      { value: currency.format(year.totalContributions) },
      { value: currency.format(year.endingBalance), className: "projected-cell" },
      { value: currency.format(year.growth) },
    ];
    for (const item of values) {
      const cell = document.createElement("td");
      cell.textContent = item.value;
      if (item.className) cell.className = item.className;
      row.append(cell);
    }
    rows.append(row);
  }
  projectionRows.replaceChildren(rows);
}

function updateProjection() {
  renderTracker();
  const startAge = readInput(startAgeInput);
  const retirementAge = readInput(retirementAgeInput);
  durationInput.value = Number.isInteger(startAge) && Number.isInteger(retirementAge) && retirementAge > startAge
    ? String(retirementAge - startAge)
    : "";

  const result = validateInputs();
  if (result.error) {
    errorMessage.textContent = result.error;
    errorMessage.hidden = false;
    clearResults();
    return;
  }

  saveCurrentPlan();
  errorMessage.hidden = true;
  const plan = result.plan;
  const finalYear = plan[plan.length - 1];
  const startYear = plan[0].calendarYear;
  const retirementYear = finalYear.calendarYear + 1;
  endingBalanceOutput.textContent = currency.format(finalYear.endingBalance);
  endingCaption.textContent = `At retirement in ${retirementYear} (age ${readInput(retirementAgeInput)})`;
  totalContributionsOutput.textContent = currency.format(finalYear.totalContributions);
  investmentGrowthOutput.textContent = currency.format(finalYear.growth);
  projectionPeriod.textContent = `Investing from ${startYear} through ${finalYear.calendarYear} (age ${plan[0].age}–${finalYear.age}), retiring at ${readInput(retirementAgeInput)}.`;
  document.querySelector("#summary").setAttribute("aria-label", `Projected value ${currency.format(finalYear.endingBalance)}, total invested ${currency.format(finalYear.totalContributions)}, estimated growth ${currency.format(finalYear.growth)}`);
  renderTable(plan);
  renderChart(plan);
}

form.addEventListener("input", updateProjection);
form.addEventListener("change", updateProjection);
form.addEventListener("submit", (event) => event.preventDefault());
themeToggle.addEventListener("click", toggleTheme);
exportButton.addEventListener("click", exportPlan);
importButton.addEventListener("click", () => importFileInput.click());
importFileInput.addEventListener("change", async () => {
  const [file] = importFileInput.files;
  if (file) await importPlan(file);
  importFileInput.value = "";
});
previousTrackerYear.addEventListener("click", () => {
  if (trackerYear > 1900) {
    trackerYear -= 1;
    renderTracker();
  }
});
nextTrackerYear.addEventListener("click", () => {
  if (trackerYear < 9999) {
    trackerYear += 1;
    renderTracker();
  }
});
initializeTheme();
const planLoadMessage = initializePlan();
initializeTracker();
updateProjection();
if (planLoadMessage) {
  showPlanStorageStatus(planLoadMessage, true);
}
