const billInput = document.getElementById('bill-amount');
const peopleInput = document.getElementById('people-count');
const tipButtons = Array.from(document.querySelectorAll('.tip-btn'));
const customTipInput = document.getElementById('custom-tip');
const billErrorEl = document.getElementById('bill-error');
const peopleErrorEl = document.getElementById('people-error');
const tipPerPersonEl = document.getElementById('tip-per-person');
const totalPerPersonEl = document.getElementById('total-per-person');
const grandTotalEl = document.getElementById('grand-total');
const resetBtn = document.getElementById('reset-btn');
const historyListEl = document.getElementById('history-list');
const historyCountEl = document.getElementById('history-count');

const STORAGE_KEY = 'tip-calculator-history';
const MAX_HISTORY_ITEMS = 5;

let selectedTipPercent = null;
let lastSavedSnapshot = null;

function formatCurrency(value) {
  return `$${value.toFixed(2)}`;
}

function clearResults() {
  tipPerPersonEl.textContent = '$0.00';
  totalPerPersonEl.textContent = '$0.00';
  grandTotalEl.textContent = '$0.00';
}

function clearErrors() {
  billErrorEl.textContent = '';
  peopleErrorEl.textContent = '';
  billInput.classList.remove('error');
  peopleInput.classList.remove('error');
  customTipInput.classList.remove('error');
}

function setFieldError(input, errorEl, message) {
  input.classList.add('error');
  errorEl.textContent = message;
}

function validateInputs(showErrors = false) {
  const billValue = billInput.value.trim();
  const peopleValue = peopleInput.value.trim();
  const bill = parseFloat(billValue);
  const people = parseInt(peopleValue, 10);

  const isBillValid = billValue !== '' && !Number.isNaN(bill) && bill > 0;
  const isPeopleValid = peopleValue !== '' && !Number.isNaN(people) && people > 0;

  if (showErrors) {
    clearErrors();

    if (!isBillValid) {
      setFieldError(billInput, billErrorEl, 'Please enter a valid bill amount.');
    }

    if (!isPeopleValid) {
      setFieldError(peopleInput, peopleErrorEl, 'Please enter at least 1 person.');
    }
  } else {
    clearErrors();
  }

  return isBillValid && isPeopleValid;
}

function updateResults(showErrors = false) {
  const isValid = validateInputs(showErrors);

  if (!isValid) {
    clearResults();
    return;
  }

  const bill = parseFloat(billInput.value) || 0;
  const people = parseInt(peopleInput.value, 10) || 0;
  const tipPercent = selectedTipPercent ?? 0;
  const tipAmount = bill * (tipPercent / 100);
  const tipPerPerson = tipAmount / people;
  const totalPerPerson = (bill + tipAmount) / people;
  const grandTotal = bill + tipAmount;

  tipPerPersonEl.textContent = formatCurrency(tipPerPerson);
  totalPerPersonEl.textContent = formatCurrency(totalPerPerson);
  grandTotalEl.textContent = formatCurrency(grandTotal);
}

function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (error) {
    return [];
  }
}

function saveHistory(entry) {
  const history = getHistory();
  const updatedHistory = [entry, ...history].slice(0, MAX_HISTORY_ITEMS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
  renderHistory();
}

function renderHistory() {
  const history = getHistory();
  historyCountEl.textContent = `${history.length} saved`;

  if (!history.length) {
    historyListEl.innerHTML = '<li class="history-item"><strong>No splits yet</strong><small>Your recent calculations will appear here.</small></li>';
    return;
  }

  historyListEl.innerHTML = history
    .map((item) => {
      const date = new Date(item.timestamp).toLocaleString();
      return `
        <li class="history-item">
          <strong>${formatCurrency(item.totalPerPerson)} each • ${formatCurrency(item.grandTotal)} total</strong>
          <small>${item.bill} bill • ${item.people} people • ${item.tipPercent}% tip • ${date}</small>
        </li>
      `;
    })
    .join('');
}

function addToHistory() {
  const bill = parseFloat(billInput.value);
  const people = parseInt(peopleInput.value, 10);
  const tipPercent = selectedTipPercent ?? 0;

  if (!bill || !people || bill <= 0 || people <= 0) {
    return;
  }

  const tipAmount = bill * (tipPercent / 100);
  const totalPerPerson = (bill + tipAmount) / people;
  const grandTotal = bill + tipAmount;
  const snapshot = `${bill.toFixed(2)}|${people}|${tipPercent.toFixed(2)}`;

  if (snapshot === lastSavedSnapshot) {
    return;
  }

  lastSavedSnapshot = snapshot;
  saveHistory({
    bill: bill.toFixed(2),
    people,
    tipPercent: Number(tipPercent).toFixed(2),
    totalPerPerson: Number(totalPerPerson),
    grandTotal: Number(grandTotal),
    timestamp: new Date().toISOString()
  });
}

function setActiveButton(activeButton) {
  tipButtons.forEach((button) => button.classList.toggle('active', button === activeButton));
}

function selectTip(value) {
  if (value === 'custom') {
    selectedTipPercent = parseFloat(customTipInput.value) || 0;
    customTipInput.hidden = false;
    customTipInput.focus();
  } else {
    selectedTipPercent = Number(value);
    customTipInput.hidden = true;
    customTipInput.value = '';
  }

  updateResults(true);
}

resetBtn.addEventListener('click', () => {
  billInput.value = '';
  peopleInput.value = '';
  customTipInput.value = '';
  customTipInput.hidden = true;
  selectedTipPercent = null;
  lastSavedSnapshot = null;
  setActiveButton(null);
  clearErrors();
  clearResults();
});

function handleCalculationComplete() {
  const isValid = validateInputs(true);
  if (!isValid) {
    clearResults();
    return;
  }

  updateResults(true);
  addToHistory();
}

[billInput, peopleInput].forEach((input) => {
  input.addEventListener('input', handleCalculationComplete);
});

customTipInput.addEventListener('input', () => {
  if (customTipInput.hidden) {
    return;
  }

  selectedTipPercent = parseFloat(customTipInput.value) || 0;
  handleCalculationComplete();
});

tipButtons.forEach((button) => {
  button.addEventListener('click', () => {
    setActiveButton(button);
    selectTip(button.dataset.tip);
    handleCalculationComplete();
  });
});

renderHistory();
updateResults();
